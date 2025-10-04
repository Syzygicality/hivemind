from rest_framework import viewsets
from .models import User, Notebook, Page, Version
from .serializers import UserSerializer, NotebookSerializer, PageSerializer, VersionSerializer

# Create your views here.
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id'

class NotebookViewSet(viewsets.ModelViewSet):
    queryset = Notebook.objects.all()
    serializer_class = NotebookSerializer
    lookup_field = 'notebook_id'
    filterset_fields = ['admin_id__id', 'user_ids__id']

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    lookup_field = 'page_id'
    filterset_fields = ['notebook__notebook_id']

class VersionViewSet(viewsets.ModelViewSet):
    queryset = Version.objects.all()
    serializer_class = VersionSerializer
    lookup_field = 'version_id'
    filterset_fields = ['user_id__id', 'previous_version__version_id']
