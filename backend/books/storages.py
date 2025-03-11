from storages.backends.s3boto3 import S3Boto3Storage
import os
from django.conf import settings

class PublicMediaStorage(S3Boto3Storage):
    location = 'covers'  # หรือคุณอาจเปลี่ยนเป็น subfolder ภายใน bucket ถ้าต้องการ
    default_acl = 'public-read'
    file_overwrite = False

    bucket_name = os.environ.get('AWS_STORAGE_BUCKET_NAME_MEDIA')  # ใช้ bucket สำหรับ media

class PrivateMediaStorage(S3Boto3Storage):
    location = 'pdfs'  # หรือ subfolder สำหรับ pdf
    default_acl = 'private'
    file_overwrite = False
    custom_domain = False

    bucket_name = os.environ.get('AWS_STORAGE_BUCKET_NAME_PDF')  # ใช้ bucket สำหรับ PDF
