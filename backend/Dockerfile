# ใช้ Python 3.12 เป็น Base Image
FROM python:3.12

# ตั้งค่า working directory
WORKDIR /app

# คัดลอกไฟล์ทั้งหมดเข้า container
COPY . .

# ติดตั้ง dependencies
RUN pip install -r requirements.txt

# รัน Django server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
