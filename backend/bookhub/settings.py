"""
Django settings for bookhub project.

Generated by 'django-admin startproject' using Django 5.1.7.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/5.1/ref/settings/
"""

from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-#54x6t*cin_7-301e+9vw+&8fxc558*7nm1ruiz$*034ja)b)q'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

LOGIN_URL = '/adminpanel/login/'  # กำหนด URL ของหน้า login สำหรับ admin
LOGIN_REDIRECT_URL = '/adminpanel/dashboard/'  # หลังจาก login สำเร็จให้ redirect ไปที่ dashboard
# Application definition

# bookhub/settings.py
INSTALLED_APPS = [
    # แอปหลักของ Django
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # แอปของบุคคลที่สาม
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # แอปของโปรเจค
    'users',
    'books',             # <-- ต้องมีแอปนี้
    'admin_dashboard',   # <-- ถ้ามี
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# อนุญาตให้ทุก origin เชื่อมต่อ (สำหรับพัฒนา)
CORS_ALLOW_ALL_ORIGINS = True

CSRF_TRUSTED_ORIGINS = [
    "https://se-project-beta-backend.onrender.com",
    "https://se-project-beta-frontend-git-master-oakjkpgs-projects.vercel.app",
    "https://se-project-beta-frontend.vercel.app",
]

CORS_ALLOWED_ORIGINS = [
    "https://se-project-beta-frontend.vercel.app",
    "http://localhost:8000",
]

CORS_ORIGIN_ALLOW_ALL = True  # หรือจะระบุ URL ที่อนุญาตให้เชื่อมต่อจาก React โดยเฉพาะ
# ตั้งค่า Email (สำหรับ demo ส่งไปที่ console)
# ตั้งค่า Email Backend (ใช้ SMTP)
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"

# SMTP Configuration (ตัวอย่างใช้ Gmail)
EMAIL_HOST = "smtp.gmail.com"       # SMTP Server ของ Gmail
EMAIL_PORT = 587                    # ใช้ Port 587 สำหรับ TLS
EMAIL_USE_TLS = True                # เปิดใช้งาน TLS
EMAIL_HOST_USER = "bookhub.noreply@gmail.com"  # อีเมลของคุณ
EMAIL_HOST_PASSWORD = "asyi watf scne bjav" # รหัสผ่าน หรือ App Password (ดูข้อ 2)
DEFAULT_FROM_EMAIL = "BookHub <bookhub.noreply@gmail.com>"  # ชื่อผู้ส่ง (เปลี่ยนได้)


# ตั้งค่า REST Framework (ตัวอย่าง)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
}

ROOT_URLCONF = 'bookhub.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bookhub.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.1/ref/settings/#databases

#database
import os
import environ

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'postgres.csqtsflaklabqsnjlioy',
        'PASSWORD': 'bookhubgroup10',
        'HOST': 'aws-0-ap-southeast-1.pooler.supabase.com',
        'PORT': '6543',
    }
}

# ด้านบนไฟล์ settings.py
import os
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# ...

# เพิ่มการตั้งค่า Storage ของ S3 (สำหรับ Supabase)
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = 'd4f5b4d6ea21398b564a724e48e84a6e'
AWS_SECRET_ACCESS_KEY = '11315d5a3fde55fbfd230bae63125d2bc802bdc5f5dd0f559786d3e23326aa9a'
AWS_STORAGE_BUCKET_NAME = 'Bookhub_media'  # Default bucket name
AWS_STORAGE_BUCKET_NAME_MEDIA = 'Bookhub_media'
AWS_STORAGE_BUCKET_NAME_PDF = 'Bookhub_pdf'
AWS_S3_ENDPOINT_URL = 'https://csqtsflaklabqsnjlioy.supabase.co/storage/v1/s3'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_S3_REGION_NAME = 'ap-southeast-1'  # เพิ่ม Region

# Password validation
# https://docs.djangoproject.com/en/5.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Bangkok'  # ตั้งค่า Timezone ให้ถูกต้อง

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'


# Default primary key field type
# https://docs.djangoproject.com/en/5.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'






