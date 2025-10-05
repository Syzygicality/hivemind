from rest_framework import serializers
from .models import User, Notebook, Page, Version, Draft, Post, Vote

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class NotebookSerializer(serializers.ModelSerializer):
    admin_id = UserSerializer(read_only=True)
    user_ids = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Notebook
        fields = ['notebook_id', 'admin_id', 'title', 'user_ids', 'merge_threshold', 'created_at', 'updated_at']
    
class VersionSerializer(serializers.ModelSerializer):
    user_id = UserSerializer(read_only=True)
    content = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Version
        fields = ['version_id', 'user_id', 'page_id', 'previous_version', 'content', 'created_at']

class PageSerializer(serializers.ModelSerializer):
    notebook_id = NotebookSerializer(read_only=True)
    latest_version = VersionSerializer(read_only=True)

    class Meta:
        model = Page
        fields = ['page_id', 'notebook_id', 'title', 'latest_version', 'created_at', 'updated_at']

class DraftSerializer(serializers.ModelSerializer):
    user_id = UserSerializer(read_only=True)
    page_id = PageSerializer(read_only=True)
    content = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Draft
        fields = ['draft_id', 'user_id', 'page_id', 'content', 'created_at', 'updated_at']

class PostSerializer(serializers.ModelSerializer):
    user_id = UserSerializer(read_only=True)
    page_id = PageSerializer(read_only=True)
    voted = serializers.SerializerMethodField()
    content = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Post
        fields = ['post_id', 'user_id', 'page_id', 'draft_id', 'content', 'votes', 'created_at', 'updated_at', 'voted']
    
    def get_voted(self, obj):
        user = self.context['request'].user
        if not user or user.is_anonymous:
            return False
        return Vote.objects.filter(post_id=obj, user_id=user).exists()