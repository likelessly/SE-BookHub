# model
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import random

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class Profile(models.Model):
    USER_TYPE_CHOICES = (
        ('reader', 'Reader'),
        ('publisher', 'Publisher'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='reader')  # ตั้ง default เป็น 'reader'
    id_card = models.CharField(max_length=50, blank=True, null=True)
    verification_code = models.CharField(max_length=6, blank=True, null=True, default=None)


    def __str__(self):
        return f"{self.user.username} Profile"
