from .views import UserListCreateView, UserDetailView, NotebookListCreateView, NotebookDetailView, PageListCreateView, PageDetailView
from django.urls import path

urlpatterns = [
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<uuid:id>/', UserDetailView.as_view(), name='user-detail'),
    path('notebooks/', NotebookListCreateView.as_view(), name='notebook-list-create'),
    path('notebooks/<uuid:notebook_id>/', NotebookDetailView.as_view(), name='notebook-detail'),
    path('pages/', PageListCreateView.as_view(), name='page-list-create'),
    path('pages/<uuid:page_id>', PageDetailView.as_view(), name='page-detail'),
]