# books/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from .models import Book, BookBorrow
from .serializers import BookSerializer, BookBorrowSerializer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.http import FileResponse
from django.http import HttpResponse
from .models import Tag
from .serializers import TagSerializer
from rest_framework.parsers import MultiPartParser, FormParser

# from supabase import create_client

# SUPABASE_URL = "https://your-supabase-url"
# SUPABASE_KEY = "your-supabase-key"
# supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
def home(request):
    return HttpResponse("Welcome to Books API!")

class TagListView(generics.ListAPIView):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]  # ปรับตามที่ต้องการ

# สำหรับหน้า Main: แสดงรายการหนังสือทั้งหมด
class BookListView(generics.ListAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]

# แสดงรายละเอียดหนังสือ (รวมเวลายืมได้)
class BookDetailView(generics.RetrieveAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]


# Reader ยืมหนังสือ
class BorrowBookView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.profile.user_type != 'reader':
            return Response({"error": "Only readers can borrow books."},
                            status=status.HTTP_403_FORBIDDEN)
        book_id = request.data.get('book_id')
        book = get_object_or_404(Book, id=book_id)
        if not book.is_available:
            return Response({"error": "Book is not available."},
                            status=status.HTTP_400_BAD_REQUEST)
        borrow = BookBorrow.objects.create(user=request.user, book=book)
        return Response({'message': 'Book borrowed successfully!', 'borrow_id': borrow.id},
                        status=status.HTTP_201_CREATED)
# Reader คืนหนังสือ
class ReturnBookView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, borrow_id):
        user = request.user
        borrow_entry = get_object_or_404(BookBorrow, id=borrow_id, reader=user)
        book = borrow_entry.book
        book.is_available = True
        book.save()
        borrow_entry.delete()
        return Response({"message": "Book returned successfully."},
                        status=status.HTTP_200_OK)

# Publisher เพิ่มหนังสือ
class AddBookView(generics.CreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]  # รองรับไฟล์ upload

    def perform_create(self, serializer):
        serializer.save(publisher=self.request.user)  # บันทึกหนังสือกับ Publisher

# Publisher ลบหนังสือ (เฉพาะหนังสือของตัวเอง)
class RemoveBookView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, book_id):
        user = request.user
        book = get_object_or_404(Book, id=book_id, publisher=user)
        book.delete()
        return Response({"message": "Book removed successfully."},
                        status=status.HTTP_200_OK)
    # def remove_book(request, book_id):
    #     book = get_object_or_404(Book, id=book_id)

    #     # ลบไฟล์ใน Supabase Storage
    #     if book.cover_image:
    #         supabase.storage.from_("books").remove([book.cover_image])
    #     if book.pdf_file:
    #         supabase.storage.from_("books").remove([book.pdf_file])

    #     # ลบจาก Database
    #     book.delete()
    #     return Response({"message": "Book removed successfully"}, status=204)

    

# ข้อมูล account สำหรับ Reader
class ReaderAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.profile.user_type != 'reader':
            return Response({"error": "Not authorized."},
                            status=status.HTTP_403_FORBIDDEN)
        borrowed = BookBorrow.objects.filter(reader=user)
        from .serializers import BookBorrowSerializer  # ใช้ serializer ที่สร้างไว้
        borrow_serializer = BookBorrowSerializer(borrowed, many=True)
        data = {
            "user": {
                "name": user.username,
                "email": user.email,
                "role": user.profile.user_type,
                "registered_at": user.date_joined,
                "borrow_count": borrowed.count(),
                "profile_image": "",  # เพิ่ม field รูปโปรไฟล์หากมี
            },
            "borrowed_books": borrow_serializer.data
        }
        return Response(data, status=status.HTTP_200_OK)

# ข้อมูล account สำหรับ Publisher
class PublisherAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.profile.user_type != 'publisher':
            return Response({"error": "Not authorized."},
                            status=status.HTTP_403_FORBIDDEN)
        published_books = Book.objects.filter(publisher=user)
        serializer = BookSerializer(published_books, many=True)
        data = {
            "user": {
                "name": user.first_name,
                "email": user.email,
                "role": user.profile.user_type,
                "registered_at": user.date_joined,
                "book_count": published_books.count(),
                "profile_image": "",  # เพิ่ม field รูปโปรไฟล์หากมี
            },
            "published_books": serializer.data
        }
        return Response(data, status=status.HTTP_200_OK)

class ReadBookView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, borrow_id):
        # ดึง borrow entry สำหรับผู้ใช้ที่ล็อกอินอยู่
        borrow_entry = get_object_or_404(BookBorrow, id=borrow_id, reader=request.user)
        now = timezone.now()
        if now > borrow_entry.due_date:
            # หากหมดเวลา ให้ลบ entry และแจ้งให้ทราบว่าไม่สามารถเข้าถึงได้อีก
            borrow_entry.delete()
            return Response({"error": "Borrow period expired. This book is no longer accessible."},
                            status=status.HTTP_403_FORBIDDEN)
        book = borrow_entry.book
        if not book.pdf_file:
            return Response({"error": "PDF not available."},
                            status=status.HTTP_404_NOT_FOUND)
        # ส่งไฟล์ PDF เป็น inline content (ไม่ให้ดาวน์โหลดโดยตรง)
        response = FileResponse(book.pdf_file.open('rb'), content_type='application/pdf')
        response['Content-Disposition'] = 'inline; filename="{}"'.format(book.pdf_file.name)
        return response