# users/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    LoginSerializer,
    SignupReaderSerializer,
    ReaderVerificationSerializer,
    SignupPublisherSerializer,
)
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from .models import Profile  # ✅ Import Profile
from .serializers import serializers
from google.oauth2 import id_token
from google.auth.transport import requests
import os

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
        print("📥 Signup Request Data:", request.data)  # ✅ Debug request ที่ส่งมา
        serializer = SignupReaderSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            print("✅ User Created:", user)  # ✅ Debug ว่ามี user สร้างขึ้นไหม
            return Response({"message": "Verification code sent."}, status=status.HTTP_201_CREATED)
        
        print("❌ Signup Errors:", serializer.errors)  # ✅ Debug ว่ามี error อะไร
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
            try:
                user = User.objects.get(email=gmail)
                
                # Get or create profile
                profile, created = Profile.objects.get_or_create(
                    user=user,
                    defaults={'user_type': 'reader'}
                )
                
            except User.DoesNotExist:
                # Create new user
                username = gmail.split('@')[0]
                # Ensure username is unique
                if User.objects.filter(username=username).exists():
                    username = f"{username}{User.objects.count()}"
                    
                user = User.objects.create_user(
                    username=username,
                    email=gmail,
                    first_name=name.split(' ')[0] if ' ' in name else name,
                    last_name=name.split(' ')[-1] if ' ' in name else ''
                )
                
                # Create profile for new user
                profile = Profile.objects.create(
                    user=user,
                    user_type='reader'
                )
            
            # Get token
            token, _ = Token.objects.get_or_create(user=user)
            
            # Always use reader role for Google login
            role = 'reader'
            
            # Update profile type if needed
            if profile.user_type != 'reader':
                profile.user_type = 'reader'
                profile.save()
            
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

