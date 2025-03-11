from django.db import models
from django.contrib.auth.models import User
from datetime import timedelta
from django.utils import timezone
from .storages import PublicMediaStorage, PrivateMediaStorage

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Book(models.Model):
    publisher = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="published_books"
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    cover_image = models.ImageField(storage=PublicMediaStorage(), upload_to='')
    pdf_file = models.FileField(storage=PrivateMediaStorage(), upload_to='', blank=True, null=True)
    lending_period = models.PositiveIntegerField(default=14)  # จำนวนวันให้ยืม
    max_borrowers = models.PositiveIntegerField(default=1)    # จำนวนคนที่สามารถยืมได้พร้อมกัน
    tags = models.ManyToManyField('Tag', through='BookTag', blank=True)
    borrow_count = models.PositiveIntegerField(default=0)      # สำหรับสถิติการยืม
    
    # def current_borrows(self):
    #     """ คำนวณจำนวนที่ถูกยืมไปแล้ว (เฉพาะที่ยังไม่คืน) """
    #     return self.borrow_set.filter(returned_at__isnull=True).count()

    # @property
    # def remaining_borrows(self):
    #     """ จำนวนที่ยังสามารถยืมได้ """
    #     return max(0, self.max_borrowers - self.current_borrows())

    # @property
    # def is_available(self):
    #     """ คืนค่า True ถ้ายังมีให้ยืม """
    #     return self.remaining_borrows > 0
    
    def remaining_borrows(self):
        # นับจำนวน BookBorrow ที่ยังมีอยู่ (ยังไม่คืน)
        current_borrows = self.borrows.count()
        remaining = self.max_borrowers - current_borrows
        return remaining

    def __str__(self):
        return self.title

class BookTag(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.book.title} - {self.tag.name}"

class BookBorrow(models.Model):
    book = models.ForeignKey(
        Book, on_delete=models.CASCADE, related_name="borrows"
    )
    reader = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="borrowed_books"
    )
    borrow_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()

    @property
    def is_returned(self):
        """ ตรวจสอบว่าคืนหนังสือแล้วหรือยัง """
        return self.returned_at is not None
    
    def save(self, *args, **kwargs):
        if not self.pk:
            self.due_date = timezone.now() + timedelta(days=self.book.lending_period)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reader.username} borrowed {self.book.title}"
