# users/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile
from django.contrib.auth import authenticate
from django.core.mail import send_mail
import random

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # รับได้ทั้ง email หรือ username
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get("identifier")  # อาจเป็น email หรือ username
        password = data.get("password")

        # 🔹 ตรวจสอบว่าเป็น email หรือไม่
        if "@" in identifier:
            try:
                user = User.objects.get(email=identifier)
                username = user.username  # ดึง username มาใช้ authenticate
            except User.DoesNotExist:
                raise serializers.ValidationError({"non_field_errors": ["Invalid credentials"]})
        else:
            username = identifier  # ใช้ username โดยตรง

        # 🔹 ลอง authenticate
        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError({"non_field_errors": ["Invalid credentials"]})
        if not user.is_active:
            raise serializers.ValidationError({"non_field_errors": ["Please verify your email address to activate your account."]})
    
        data["user"] = user
        return data

class SignupReaderSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value
    
    def create(self, validated_data):
        name = validated_data["name"]
        user = User.objects.create_user(
            username=name,
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["name"]
        )
        user.is_active = False  # รอการยืนยันอีเมล
        user.save()

        # สร้างรหัสยืนยัน (6 หลัก)
        verification_code = str(random.randint(100000, 999999))

        # ตรวจสอบว่า Profile มีอยู่แล้วหรือไม่ ถ้าไม่มีให้สร้าง
        Profile.objects.create(user=user, user_type='reader', verification_code=verification_code)
        print(f"📌 DB: Profile for {user.email} → verification_code={profile.verification_code}")

        # ส่งอีเมลยืนยัน
        send_mail(
            'Your Verification Code',
            f'Your verification code is: {verification_code}',
            'bookhub.noreply@gmail.com',
            [validated_data["email"]],
            fail_silently=False,
        )
        return user



class ReaderVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    verification_code = serializers.CharField(max_length=6)

    def validate(self, data):
        email = data.get("email")
        code = data.get("verification_code")
        try:
            user = User.objects.get(email=email)
            profile = user.profile
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")

        # ตรวจสอบว่า verification_code ตรงกันไหม
        if profile.verification_code != code:
            raise serializers.ValidationError("Invalid verification code")

        return data

    def save(self, **kwargs):
        email = self.validated_data["email"]
        user = User.objects.get(email=email)
        
        # ตั้งค่า is_active เป็น True เพื่อเปิดใช้งานบัญชี
        user.is_active = True
        user.save()

        # ลบ verification_code หลังจากการยืนยัน
        profile = user.profile
        profile.verification_code = ""
        profile.save()

        return user


class SignupPublisherSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    id_card = serializers.CharField(max_length=50)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        username = validated_data["name"]
        user = User.objects.create_user(
            username=username,
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["name"]
        )
        user.is_active = False  # รอการตรวจสอบจาก admin
        user.save()
        
        # สร้าง Profile และตั้งค่า user_type เป็น 'publisher'
        Profile.objects.create(user=user, user_type='publisher', id_card=validated_data["id_card"])
        
        # ส่งอีเมลแจ้ง admin ให้ตรวจสอบ (ในที่นี้ส่งไปที่ admin@bookhub.com)
        send_mail(
            'New Publisher Signup',
            f'A new publisher has registered with email: {validated_data["email"]}. Please review and activate the account.',
            'bookhub.noreply@gmail.com',
            ['s6604062630099@email.kmutnb.ac.th'],
            fail_silently=False,
        )
        return user

