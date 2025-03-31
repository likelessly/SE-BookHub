from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile
from django.contrib.auth import authenticate
from django.core.mail import send_mail

class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get("identifier")
        password = data.get("password")

        # Check if identifier is email or username
        if "@" in identifier:
            try:
                user = User.objects.get(email=identifier)
                username = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError({"non_field_errors": ["Invalid credentials"]})
        else:
            username = identifier

        # Try to authenticate
        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError({"non_field_errors": ["Invalid credentials"]})
        if not user.is_active:
            raise serializers.ValidationError({"non_field_errors": ["Please verify your email address to activate your account."]})
    
        data["user"] = user
        return data

class SignupReaderSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True}
        }

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False  # Set user as inactive until email verification
        )
        return user
    
    def _send_verification_email(self, email, verification_code):
        """Helper method to send verification email"""
        try:
            send_mail(
                'Your Verification Code',
                f'Your verification code is: {verification_code}',
                'bookhub.noreply@gmail.com',  # อีเมล Gmail ของคุณ
                [email],
                fail_silently=False,
            )
        except Exception as e:
            raise serializers.ValidationError(f"Failed to send verification email: {str(e)}")

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
        except Profile.DoesNotExist:
            raise serializers.ValidationError("User profile is missing")

        if profile.verification_code != code:
            raise serializers.ValidationError("Invalid verification code")

        return data

    def save(self, **kwargs):
        email = self.validated_data["email"]
        user = User.objects.get(email=email)
        
        # Activate account
        user.is_active = True
        user.save()

        # Clear verification code
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

    def validate_name(self, value):
        # Add username validation since we use the name as username
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Publisher name already exists")
        return value

    def create(self, validated_data):
        # Create user with inactive status
        user = User.objects.create_user(
            username=validated_data["name"],
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data["name"],
            is_active=False  # Pending admin approval
        )
        
        # Get the profile created by signal and update it to be a publisher profile
        Profile.objects.filter(user=user).update(
            user_type='publisher',
            id_card=validated_data["id_card"]
        )
        
        # Send admin notification
        self._send_admin_notification(validated_data["email"])
        return user
    
    def _send_admin_notification(self, publisher_email):
        """Helper method to send admin notification"""
        try:
            send_mail(
                'New Publisher Signup',
                f'A new publisher has registered with email: {publisher_email}. Please review and activate the account.',
                'bookhub.noreply@gmail.com',  # อีเมล Gmail ของคุณ
                ['s6604062630099@email.kmutnb.ac.th'],  # อีเมลผู้ดูแลระบบ
                fail_silently=False,
            )
        except Exception as e:
            raise serializers.ValidationError(f"Failed to send admin notification: {str(e)}")

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            User.objects.get(email=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address.")

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(min_length=8, write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        return data