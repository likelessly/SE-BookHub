from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('login/', views.AdminLoginView.as_view(), name='admin_login'),  # เปลี่ยนจาก 'adminpanel/login'
    path('dashboard/', views.admin_dashboard, name='admin_dashboard'),
    path('publisher/<int:user_id>/approve/', views.approve_publisher, name='approve_publisher'),
    path('publisher/<int:user_id>/reject/', views.reject_publisher, name='reject_publisher'),
    path('logout/', views.custom_logout, name='admin_logout'),  # เพิ่ม logout view
]
