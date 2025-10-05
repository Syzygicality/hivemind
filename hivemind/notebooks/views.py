from rest_framework import generics, filters, status, permissions, serializers
from .models import User, Notebook, Page, Version, Draft, Post, Vote
from .serializers import UserSerializer, NotebookSerializer, PageSerializer, VersionSerializer, DraftSerializer, PostSerializer
from rest_framework.response import Response
from django.db import transaction, models
from django.shortcuts import get_object_or_404

# Create your views here.
class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username']
    lookup_field = 'id'

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

#I added this --> Ansh Routray

class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user
#----

class NotebookListCreateView(generics.ListCreateAPIView):
    serializer_class = NotebookSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'notebook_id'

    def get_queryset(self):
        user = self.request.user
        return (
            Notebook.objects.filter(admin_id=user) |
            Notebook.objects.filter(user_ids=user)
        ).distinct().order_by('-updated_at')
    
    def perform_create(self, serializer):
        # Set default merge threshold of 3 if not provided
        if 'merge_threshold' not in self.request.data or self.request.data.get('merge_threshold') is None:
            serializer.save(admin_id=self.request.user, merge_threshold=3)
        else:
            serializer.save(admin_id=self.request.user)

class NotebookDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotebookSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'notebook_id'

    def get_queryset(self):
        user = self.request.user
        return (
            Notebook.objects.filter(admin_id=user) |
            Notebook.objects.filter(user_ids=user)
        ).distinct().order_by('-updated_at')

    def perform_update(self, serializer):
        serializer.save()
        notebook = serializer.instance
        data = self.request.data

        add_users = data.get('add_user_ids', [])
        remove_users = data.get('remove_user_ids', [])

        if add_users:
            notebook.user_ids.add(*User.objects.filter(id__in=add_users))
        if remove_users:
            notebook.user_ids.remove(*User.objects.filter(id__in=remove_users))
        
        return notebook

class PageListCreateView(generics.ListCreateAPIView):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'page_id'

    def get_queryset(self):
        notebook_id = self.kwargs.get('notebook_id')
        return Page.objects.filter(notebook_id=notebook_id).order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Create a new Page and an initial empty Version, return the serialized Page.

        We override create() so we can attach the initial Version to the Page
        and return the Page serializer (including the latest_version) to the client.
        """
        notebook_id = self.kwargs.get('notebook_id')
        if not notebook_id:
            raise serializers.ValidationError("Notebook id is required in URL.")

        try:
            notebook = Notebook.objects.get(notebook_id=notebook_id)
        except Notebook.DoesNotExist:
            return Response({"detail": "Notebook not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Pass the notebook instance when saving the Page
            page = serializer.save(notebook_id=notebook)

            # create an initial empty Version and attach it
            version = Version.objects.create(
                user_id=request.user,
                page_id=page,
                previous_version=None,
                content=""
            )
            page.latest_version = version
            page.save()

        out_serializer = PageSerializer(page, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

class PageDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'page_id'

class VersionListView(generics.ListAPIView):
    serializer_class = VersionSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'version_id'

    def get_queryset(self):
        page_id = self.kwargs.get('page_id')
        if not page_id:
            return Version.objects.none()

        versions = Version.objects.filter(page_id=page_id).order_by('created_at')
        return versions

class VersionSingleView(generics.RetrieveAPIView):
    queryset = Version.objects.all()
    serializer_class = VersionSerializer
    lookup_field = 'version_id'

class DraftListCreateView(generics.ListCreateAPIView):
    serializer_class = DraftSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'draft_id'
    
    def get_queryset(self):
        return Draft.objects.filter(user_id=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create a new Draft linked to the current user and return the full serialized Draft."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        page_id = request.data.get('page_id')
        if not page_id:
            raise serializers.ValidationError({"page_id": "This field is required."})

        # Optionally, verify page existence
        try:
            page = Page.objects.get(page_id=page_id)
        except Page.DoesNotExist:
            return Response({"detail": "Page not found."}, status=status.HTTP_404_NOT_FOUND)

        draft = serializer.save(
            user_id=request.user,
            page_id=page,
            content=""
        )

        out_serializer = DraftSerializer(draft, context={'request': request})
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

class DraftDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DraftSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'draft_id'
    
    def get_queryset(self):
        return Draft.objects.filter(user_id=self.request.user)

class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        page_id = self.kwargs.get('page_id')
        return (
            Post.objects
            .filter(page_id=page_id)
            .order_by('-votes')
        )
    
    def perform_create(self, serializer):
        draft = get_object_or_404(Draft, draft_id=self.request.data.get('draft_id'), user_id=self.request.user)
        # Use the content from the request (which should be the draft content) or fall back to draft content
        content = self.request.data.get('content', draft.content)
        serializer.save(
            user_id=self.request.user,
            page_id=draft.page_id,
            draft_id=draft,
            content=content,
            votes=0
        )

class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'post_id'

    def get_queryset(self):
        return Post.objects.all()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user:
            raise PermissionError("You can only delete your own posts.")
        instance.delete()

class PostVoteView(generics.UpdateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'post_id'

    def get_queryset(self):
        return Post.objects.all()
    
    @transaction.atomic()
    def update(self, request, *args, **kwargs):
        user = request.user
        post = self.get_object() 

        existing_vote = Vote.objects.filter(post_id=post, user_id=user).first()

        if existing_vote:
            post.votes = models.F('votes') - 1
            existing_vote.delete()
        else:
            post.votes = models.F('votes') + 1
            Vote.objects.create(post_id=post, user_id=user)

        post.save()
        post.refresh_from_db()

        page = post.page_id
        notebook = page.notebook_id

        # Check if merge threshold is set and if post has enough votes
        merge_threshold = notebook.merge_threshold
        if merge_threshold is not None and post.votes >= merge_threshold:
            new_version = Version.objects.create(
                user_id=post.user_id,
                page_id=page,
                previous_version=page.latest_version,
                content=post.draft_id.content
            )
            page.latest_version = new_version
            page.save()

            post.draft_id.delete()
            post.delete()
            return Response({"merged": True, "message": "Post merged into new version."}, status=status.HTTP_200_OK)

        return Response({"votes": post.votes}, status=status.HTTP_200_OK)

class VersionCompareView(generics.GenericAPIView):
    """Compare two versions of a page and return content for diff highlighting."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, *args, **kwargs):
        """Get two versions for comparison.
        Query params:
        - version1: UUID of first version (older)
        - version2: UUID of second version (newer) - defaults to latest version if not provided
        """
        page_id = kwargs.get('page_id')
        version1_id = request.query_params.get('version1')
        version2_id = request.query_params.get('version2')
        
        if not page_id:
            return Response({"detail": "Page id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not version1_id:
            return Response({"detail": "version1 parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            page = Page.objects.get(page_id=page_id)
        except Page.DoesNotExist:
            return Response({"detail": "Page not found."}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            version1 = Version.objects.get(version_id=version1_id, page_id=page)
        except Version.DoesNotExist:
            return Response({"detail": "First version not found."}, status=status.HTTP_404_NOT_FOUND)
        
        if version2_id:
            try:
                version2 = Version.objects.get(version_id=version2_id, page_id=page)
            except Version.DoesNotExist:
                return Response({"detail": "Second version not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Default to latest version
            version2 = page.latest_version
            if not version2:
                return Response({"detail": "Page has no latest version."}, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            "version1": VersionSerializer(version1).data,
            "version2": VersionSerializer(version2).data,
            "page_title": page.title
        }, status=status.HTTP_200_OK)