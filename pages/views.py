from django.shortcuts import render, get_object_or_404, redirect

def main(request):
    return render(request, 'pages/main.html')

def home(request):
    books = [
        {"id": 1, "title": "หนังสือ A", "image_url": "https://via.placeholder.com/150"},
        {"id": 2, "title": "หนังสือ B", "image_url": "https://via.placeholder.com/150"},
        {"id": 3, "title": "หนังสือ C", "image_url": "https://via.placeholder.com/150"},
        {"id": 4, "title": "หนังสือ D", "image_url": "https://via.placeholder.com/150"},
    ]   
    return render(request, "pages/home.html", {"books": books})


def book(request, book_id):
    # สำหรับตอนนี้ส่งข้อมูลแบบ static
    context = {'book_id': book_id}
    return render(request, 'pages/book.html', context)

def login_page(request):
    return render(request, 'pages/login.html')

def signup(request):
    return render(request, 'pages/signup.html')

def account_reader(request):
    books = [
        {"id": 1, "title": "หนังสือ A"},
        {"id": 2, "title": "หนังสือ B"},
    ]
    return render(request, "pages/account_reader.html", {"books": books})

def account_publisher(request):
    books = [
        {"id": 1, "title": "หนังสือ A"},
        {"id": 2, "title": "หนังสือ B"},
        {"id": 3, "title": "หนังสือ C"},
    ]
    return render(request, "pages/account_publisher.html", {"books": books})

def edit_book(request):
    return render(request, 'pages/edit_book.html')

def add_book(request):
    return render(request, 'pages/add_book.html')

