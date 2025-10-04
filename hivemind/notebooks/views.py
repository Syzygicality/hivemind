from rest_framework import generics, serializers, filters
from .models import User, Notebook, Page, Version, Draft, Post, Vote
from .serializers import UserSerializer, NotebookSerializer, PageSerializer, VersionSerializer, DraftSerializer, PostSerializer
from rest_framework import permissions
from django.db import transaction

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

class NotebookListCreateView(generics.ListCreateAPIView):
    serializer_class = NotebookSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'notebook_id'

    def get_queryset(self, request, *args, **kwargs):
        user = self.request.user
        return (
            Notebook.objects.filter(admin_id=user) |
            Notebook.objects.filter(user_ids=user)
        ).distinct().order_by('-updated_at')

class NotebookDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotebookSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'notebook_id'

    def get_queryset(self, request, *args, **kwargs):
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
    lookup_field = 'page_id'

    def get_queryset(self, request, *args, **kwargs):
        notebook_id = kwargs.get('notebook_id')
        return Page.objects.filter(notebook_id=notebook_id).order_by('-created_at')
    
    def perform_create(self, serializer):
        with transaction.atomic():
            page = serializer.save(notebook_id=self.request.data.get('notebook_id'))
            version = Version.objects.create(
                user_id=self.request.user,
                previous_version=None,
                content=""
            )
            page.latest_version = version
            page.save()
        return version

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
    
    def perform_create(self, serializer):
        serializer.save(
            user_id=self.request.user,
            page_id_id=self.request.data.get('page_id'),
            content=""
        )

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
        return Post.objects.filter(user_id=self.request.user)
    
    def perform_create(self, serializer):
        draft_id = self.request.data.get('draft_id')

        draft = self.get_queryset().filter(draft_id=draft_id).first()
        if not draft:
            raise serializers.ValidationError("Draft not found or not owned by you.")

        serializer.save(
            user_id=self.request.user,
            page_id=draft.page_id,
            draft_id=draft,
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
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        post = self.get_object()
        user = request.user
        action = request.data.get('action')
        
        existing_vote = Vote.objects.filter(post_id=post, user_id=user).first()
        
        if action == "remove":
            if existing_vote:
                if existing_vote.agree:
                    post.votes -= 1
                else:
                    post.votes += 1
                existing_vote.delete()
        
        elif action in ["like", "dislike"]:
            agree = action == "like"
            if existing_vote:
                # adjust votes if user flips vote
                if existing_vote.agree != agree:
                    post.votes += 1 if agree else -1
                    existing_vote.agree = agree
                    existing_vote.save()
            else:
                # new vote
                Vote.objects.create(user_id=user, post_id=post, agree=agree)
                post.votes += 1 if agree else -1

        post.save()

        # 3️⃣ Check thresholds from notebook settings
        page = post.page_id
        notebook = page.notebook_id

        # Merge threshold
        if post.votes >= notebook.merge_threshold:
            # Promote post content into new Version
            Version.objects.create(
                user_id=post.user_id,
                page_id=page,
                previous_version=page.latest_version,
                content=post.draft_id.content
            )
            # Update page latest_version
            page.latest_version = Version.objects.filter(page_id=page).latest('created_at')
            page.save()
            # Cleanup post and draft
            post.draft_id.delete()
            post.delete()
            return Response({"merged": True, "message": "Post merged into new version."})

        # Toss threshold (negative votes)
        if post.votes <= notebook.toss_threshold:
            post.delete()
            return Response({"tossed": True, "message": "Post discarded due to low votes."})

        # Default: return updated post data
        serializer = PostSerializer(post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)