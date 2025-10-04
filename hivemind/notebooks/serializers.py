from rest_framework import serializers
from .models import User, Notebook, Page, Version

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class NotebookSerializer(serializers.ModelSerializer):
    admin_id = UserSerializer(read_only=True)
    user_ids = UserSerializer(many=True, read_only=True)

    class Meta:
        model = Notebook
        fields = ['notebook_id', 'admin_id', 'title', 'user_ids', 'created_at', 'updated_at']
    
class VersionSerializer(serializers.ModelSerializer):
    user_id = UserSerializer(read_only=True)

    class Meta:
        model = Version
        fields = ['version_id', 'user_id', 'page_id', 'previous_version', 'content', 'created_at']

class PageSerializer(serializers.ModelSerializer):
    notebook = NotebookSerializer(read_only=True)
    latest_version = VersionSerializer(read_only=True)

    class Meta:
        model = Page
        fields = ['page_id', 'notebook_id', 'title', 'latest_version', 'created_at', 'updated_at']