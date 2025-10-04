from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid
# Create your models here.
class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    def __str__(self):
        return self.username

class Notebook(models.Model):
    notebook_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='notebooks')
    title = models.CharField(max_length=255)
    user_ids = models.ManyToManyField(User, related_name='user_notebooks', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Version(models.Model):
    version_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='versions')
    page_id = models.ForeignKey('Page', on_delete=models.CASCADE, null=True, related_name='page')
    previous_version = models.ForeignKey('self', on_delete=models.CASCADE, null=True, related_name='prev_version')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Version {self.version_id} by {self.user_id}"

class Page(models.Model):
    page_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notebook_id = models.ForeignKey(Notebook, on_delete=models.CASCADE, related_name='pages')
    title = models.CharField(max_length=255)
    latest_version = models.ForeignKey(Version, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Draft(models.Model):
    draft_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name='creator')
    page_id = models.ForeignKey(Page, on_delete=models.CASCADE, null=True, related_name='origin')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Draft {self.draft_id} by {self.user_id}"

class Post(models.Model):
    post_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name='poster')
    page_id = models.ForeignKey(Page, on_delete=models.CASCADE, null=True, related_name='page_to_update')
    draft_id = models.ForeignKey(Draft, on_delete=models.CASCADE, null=True, related_name='draft')
    votes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Post {self.post_id} by {self.user_id}"
    
class Vote(models.Model):
    vote_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, null=True, related_name='user')
    post_id = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, related_name='post')
    agree = models.BooleanField()

    def __str__(self):
        return f"{self.agree}"
