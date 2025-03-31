from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from .serializers import (
    LoginSerializer,
    SignupReaderSerializer,
    ReaderVerificationSerializer,
    SignupPublisherSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Profile, PasswordReset  # ✅ Import Profile and PasswordReset
from .serializers import serializers
from google.oauth2 import id_token
from google.auth.transport import requests
import os
from django.core.mail import send_mail
import random
from django.conf import settings
from django.template.loader import render_to_string

class LoginView(APIView):
    def post(self, request):
        identifier = request.data.get('identifier')
        password = request.data.get('password')

        try:
            if '@' in identifier:
                user = User.objects.get(email=identifier)
            else:
                user = User.objects.get(username=identifier)
                
            if not user.is_active:
                return Response({"error": "Please verify your email address to activate your account."}, 
                                status=status.HTTP_400_BAD_REQUEST)

            if user.check_password(password):
                token, created = Token.objects.get_or_create(user=user)
                profile, _ = Profile.objects.get_or_create(user=user)
                
                return Response({
                    "token": token.key,
                    "role": profile.user_type,
                    "userId": user.id  # Add userId to the response
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_400_BAD_REQUEST)


class SignupReaderView(APIView):
    def post(self, request):
        serializer = SignupReaderSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # สร้าง verification code
            verification_code = str(random.randint(100000, 999999))

            # ดึง Profile ที่ถูกสร้างโดย Signal
            profile = Profile.objects.get(user=user)
            profile.verification_code = verification_code
            profile.save()

            # ส่ง email
            send_mail(
                'Verify your account',
                f'Your verification code is: {verification_code}',
                'bookhub.noreply@gmail.com',
                [user.email],
                fail_silently=False,
            )

            return Response({"message": "Verification code sent."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReaderVerificationView(APIView):
    def post(self, request):
        serializer = ReaderVerificationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Email verified successfully. Your account is now active."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SignupPublisherView(APIView):
    def post(self, request):
        serializer = SignupPublisherSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Registration submitted for admin verification."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(APIView):
    def post(self, request):
        try:
            # Get token from request
            token = request.data.get('token')
            if not token:
                return Response({'detail': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Verify token with Google
            client_id = '922387380789-081ufgcic0l05iivp0lnqqu694cs6sbl.apps.googleusercontent.com'
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
            
            # Get user email from verified token
            gmail = idinfo['email']
            name = idinfo.get('name', '')
            
            # Check if user exists
            user, created = User.objects.get_or_create(
                email=gmail,
                defaults={
                    'username': gmail.split('@')[0],
                    'first_name': name.split(' ')[0] if ' ' in name else name,
                    'last_name': name.split(' ')[-1] if ' ' in name else '',
                }
            )
            
            # Ensure username is unique if user was just created
            if created and User.objects.filter(username=user.username).exists():
                user.username = f"{user.username}{User.objects.count()}"
                user.save()
            
            # Get or create profile
            profile, _ = Profile.objects.get_or_create(
                user=user,
                defaults={'user_type': 'reader'}
            )
            
            # Get token
            token, _ = Token.objects.get_or_create(user=user)
            
            # Always use reader role for Google login
            role = 'reader'
            
            return Response({
                'token': token.key,
                'userId': user.id,
                'role': role,
                'name': user.get_full_name() or user.username
            })
            
        except ValueError as e:
            return Response({'detail': f'Invalid token: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'detail': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ForgotPasswordView(APIView):
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            try:
                email = serializer.validated_data['email']
                user = User.objects.get(email=email)
                
                # Create password reset token
                reset_token = PasswordReset.objects.create(user=user)
                
                # Get frontend URL from settings
                frontend_url = settings.FRONTEND_URL.rstrip('/')
                reset_url = f"{frontend_url}/reset-password/{reset_token.token}"
                
                # Send email with HTML template
                subject = 'รีเซ็ตรหัสผ่าน BookHub'
                html_message = f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="color: #ff6b00; margin-bottom: 10px;">BookHub - รีเซ็ตรหัสผ่าน</h2>
                        <p style="color: #666;">ระบบได้รับคำขอรีเซ็ตรหัสผ่านของคุณ</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p>สวัสดี {user.username},</p>
                        <p>เราได้รับคำขอรีเซ็ตรหัสผ่านของคุณ คลิกที่ปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" 
                           style="background-color: #ff6b00; 
                                  color: white; 
                                  padding: 12px 24px; 
                                  text-decoration: none; 
                                  border-radius: 4px;
                                  display: inline-block;
                                  font-weight: bold;">
                            ตั้งรหัสผ่านใหม่
                        </a>
                    </div>

                    <div style="background-color: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #e65100; margin: 0;">
                            ⚠️ ลิงก์นี้จะหมดอายุภายใน 24 ชั่วโมง
                        </p>
                    </div>

                    <p style="color: #666;">
                        หากคุณไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาละเว้นอีเมลนี้
                    </p>

                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">

                    <div style="text-align: center;">
                        <p style="color: #666; font-size: 12px; margin: 5px 0;">
                            ขอแสดงความนับถือ<br>
                            ทีมงาน BookHub
                        </p>
                    </div>
                </div>
                """
                
                try:
                    send_mail(
                        subject,
                        "กรุณาใช้อีเมลไคลเอนต์ที่รองรับ HTML เพื่อดูข้อความนี้",
                        'bookhub.noreply@gmail.com',
                        [email],
                        fail_silently=False,
                        html_message=html_message
                    )
                    return Response({
                        "message": "ระบบได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว"
                    })
                except Exception as e:
                    return Response({
                        "error": f"ไม่สามารถส่งอีเมลได้: {str(e)}"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                    
            except User.DoesNotExist:
                # ส่งข้อความเดียวกันเพื่อป้องกัน user enumeration
                return Response({
                    "message": "ระบบได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว หากมีบัญชีผู้ใช้อยู่ในระบบ"
                })
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    def post(self, request, token):
        try:
            reset_token = PasswordReset.objects.get(
                token=token,
                is_used=False
            )
            
            if not reset_token.is_valid():
                return Response(
                    {"error": "Password reset link has expired."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate passwords
            new_password = request.data.get('new_password')
            confirm_password = request.data.get('confirm_password')

            if not new_password or not confirm_password:
                return Response(
                    {"error": "Both password fields are required."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            if new_password != confirm_password:
                return Response(
                    {"error": "Passwords do not match."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                # Validate password strength
                validate_password(new_password, reset_token.user)
            except ValidationError as e:
                return Response(
                    {"error": list(e.messages)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update password
            user = reset_token.user
            user.set_password(new_password)
            user.save()

            # Mark token as used
            reset_token.is_used = True
            reset_token.save()

            return Response({
                "message": "Password has been reset successfully."
            })

        except PasswordReset.DoesNotExist:
            return Response(
                {"error": "Invalid or expired password reset link."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ValidateResetTokenView(APIView):
    def get(self, request, token):
        try:
            reset_token = get_object_or_404(PasswordReset, token=token, is_used=False)
            
            if not reset_token.is_valid():
                return Response({
                    "error": "Password reset link has expired"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            return Response({
                "message": "Token is valid",
                "user": reset_token.user.username
            })
            
        except Exception as e:
            return Response({
                "error": "Invalid or expired reset token"
            }, status=status.HTTP_400_BAD_REQUEST)
