from rest_framework import generics
from .models import User, Notebook, Page, Version
from .serializers import UserSerializer, NotebookSerializer, PageSerializer, VersionSerializer
from rest_framework import permissions
from django.db import transaction

# Create your views here.
class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id'

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
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
    lookup_field = 'page_id'