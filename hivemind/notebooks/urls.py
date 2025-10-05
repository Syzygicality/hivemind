from .views import UserListCreateView, UserDetailView, NotebookListCreateView, NotebookDetailView, PageListCreateView, PageDetailView, VersionListView, VersionSingleView, DraftListCreateView, DraftDetailView, PostListCreateView, PostDetailView, PostVoteView
from django.urls import path

urlpatterns = [
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<uuid:id>/', UserDetailView.as_view(), name='user-detail'),
    path('notebooks/', NotebookListCreateView.as_view(), name='notebook-list-create'),
    path('notebooks/<uuid:notebook_id>/', NotebookDetailView.as_view(), name='notebook-detail'),
    path('notebooks/<uuid:notebook_id>/pages/', PageListCreateView.as_view(), name='page-list-create'),
    path('notebooks/<uuid:notebook_id>/pages/<uuid:page_id>/', PageDetailView.as_view(), name='page-detail'),
    path('notebooks/<uuid:notebook_id>/pages/<uuid:page_id>/versions/', VersionListView.as_view(), name='version-list'),
    path('notebooks/<uuid:notebook_id>/pages/<uuid:page_id>/versions/<uuid:version_id>/', VersionSingleView.as_view(), name='version-single'),
    path('notebooks/<uuid:notebook_id>/drafts/', DraftListCreateView.as_view(), name='draft-list-create'),
    path('notebooks/<uuid:notebook_id>/drafts/<uuid:draft_id>', DraftDetailView.as_view(), name='draft-detail'),
    path('notebooks/<uuid:notebook_id>/pages/<uuid:page_id>/posts/', PostListCreateView.as_view(), name='post-list-create'),
    path('notebooks/<uuid:notebook_id>/pages/<uuid:page_id>/posts/<uuid:post_id>/', PostDetailView.as_view(), name='post-detail'),
    path('vote/post/', PostVoteView.as_view(), name='vote-post'),
]