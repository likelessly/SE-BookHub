from django.shortcuts import render, get_object_or_404, redirect
from .db_config import book_collection, user_collection
from .models import Book
from .forms import BookForm
from bson import ObjectId
from datetime import datetime
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate, login
from django.contrib.admin.views.decorators import staff_member_required

User = get_user_model()

def main(request):
    return render(request, 'api/main.html')

def home(request):
    books = book_collection.find()
    book_list = []

    for book in books:
        book['id'] = str(book['_id'])  # แปลง ObjectId เป็น string และเก็บใน 'id'
        del book['_id']  # ลบ '_id' ออก
        book_list.append(book)

    return render(request, 'api/home.html', {'books': book_list})

def login_view(request):
    if request.method == "POST":
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = user_collection.find_one({"username": username, "password": password})

        if user:
            request.session['username'] = username
            request.session['role'] = user.get('role')
            next_url = request.GET.get('next', 'home') 
            return redirect(next_url)
        else:
            error_message = "Username หรือ Password ไม่ถูกต้อง"
            return render(request, 'api/login.html', {"error": error_message})

    return render(request, "api/login.html")

def logout_view(request):
    request.session.flush()
    return redirect('login')

def signup(request):
    if request.method == "POST":
        role = request.POST.get("role")
        username = request.POST.get("username")
        password = request.POST.get("password")
        password2 = request.POST.get("password2")

        if password != password2:
            error_message = "รหัสผ่านไม่ตรงกัน"
            form_type = role
            return render(request, "api/signup.html", {"error": error_message, "form": form_type})

        if role == "publisher" and not request.POST.get("idcard"):
            error_message = "กรุณากรอกรหัสปชช. ให้ครบถ้วน"
            return render(request, "api/signup.html", {"error": error_message, "form": role})

        registration_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        borrowed_books = []

        user_data = {
            "username": username,
            "password": password,  # หมายเหตุ: ควรแฮชรหัสผ่านในโปรดักชันจริง
            "role": role,
            "registration_date": registration_date,
            "borrowed_books": borrowed_books,
        }
        
        if role == "publisher":
            user_data["idcard"] = request.POST.get("idcard")
        
        if user_collection.find_one({"username": username}):
            error_message = "Username นี้มีอยู่ในระบบแล้ว"
            return render(request, "api/signup.html", {"error": error_message, "form": role})
        
        user_collection.insert_one(user_data)
        return redirect("login")

    return render(request, "api/signup.html")

@login_required
def account_reader(request):
    username = request.session.get('username')
    user = user_collection.find_one({"username": username, "role": "reader"})
    if not user:
        return redirect('login')

    registration_date = user.get("registration_date", "N/A")
    borrowed_books_ids = user.get("borrowed_books", [])
    borrowed_count = len(borrowed_books_ids)

    borrowed_books = []
    for book_id in borrowed_books_ids:
        book = book_collection.find_one({"_id": ObjectId(book_id)})
        if book:
            book['id'] = str(book['_id'])
            del book['_id']
            borrowed_books.append(book)

    context = {
        "user": user,
        "registration_date": registration_date,
        "borrowed_count": borrowed_count,
        "books": borrowed_books,
    }

    return render(request, "api/account_reader.html", context)

@login_required
def account_publisher(request):
    username = request.session.get("username")
    user = user_collection.find_one({"username": username, "role": "publisher"})
    if not user:
        return redirect("login")

    publisher_books = list(book_collection.find({"publisher": username}))

    for book in publisher_books:
        book["id"] = str(book["_id"])

    context = {
        "user": user,
        "registration_date": user.get("registration_date", "N/A"),
        "book_count": len(publisher_books),
        "books": publisher_books,
    }
    return render(request, "api/account_publisher.html", context)

@login_required
def borrow_book(request, book_id):
    username = request.session.get('username')
    user = user_collection.find_one({"username": username})
    if not user or user.get("role") != "reader":
        messages.error(request, "เฉพาะ Reader เท่านั้นที่สามารถยืมหนังสือได้")
        return redirect("book", book_id=book_id)
    
    book = book_collection.find_one({"_id": ObjectId(book_id)})
    if not book:
        messages.error(request, "ไม่พบหนังสือ")
        return redirect("home")

    if book_id not in user.get("borrowed_books", []):
        borrowed_books = user.get("borrowed_books", [])
        borrowed_books.append(book_id)
        user_collection.update_one(
            {"username": user["username"]},
            {"$set": {"borrowed_books": borrowed_books}}
        )
        messages.success(request, f"คุณยืมหนังสือ '{book['title']}' เรียบร้อยแล้ว!")

    next_url = request.GET.get('next', 'account_reader')
    return redirect(next_url)

@login_required
def return_book(request, book_id):
    username = request.session.get('username')
    user = user_collection.find_one({"username": username})
    if not user or user.get("role") != "reader":
        messages.error(request, "คุณไม่มีสิทธิ์คืนหนังสือ")
        return redirect("account_reader")
    
    borrowed_books = user.get("borrowed_books", [])
    if book_id in borrowed_books:
        user_collection.update_one(
            {"username": username},
            {"$pull": {"borrowed_books": book_id}}
        )
        messages.success(request, "คืนหนังสือเรียบร้อยแล้ว!")
    else:
        messages.error(request, "หนังสือดังกล่าวไม่อยู่ในบัญชีของคุณ")

    return redirect("account_reader")

@login_required
def add_book(request):
    username = request.session.get("username")
    if not username:
        return redirect("login")

    if request.method == "POST":
        form = BookForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data["title"]
            description = form.cleaned_data["description"]
            image_url = form.cleaned_data["image_url"]

            new_book = {
                "title": title,
                "description": description,
                "image_url": image_url,
                "publisher": username,
                "added_date": datetime.now(),
            }
            book_collection.insert_one(new_book)

            return redirect("account_publisher")

    else:
        form = BookForm()

    return render(request, "api/add_book.html", {"form": form})

@staff_member_required
def custom_admin(request):
    users = list(user_collection.find())
    readers = [user for user in users if user.get("role") == "reader"]
    publishers = [user for user in users if user.get("role") == "publisher"]

    books_cursor = book_collection.find()
    books = []
    for book in books_cursor:
        book['id'] = str(book['_id'])
        del book['_id']
        books.append(book)

    context = {
        "readers": readers,
        "publishers": publishers,
        "books": books,
    }
    return render(request, "api/custom_admin.html", context)
