# SE-BookHub

SE-BookHub เป็นระบบจัดการหนังสือออนไลน์ที่พัฒนาด้วย Django (Backend) และ React (Frontend) โดยมีการเชื่อมต่อกับฐานข้อมูล PostgreSQL และใช้ Supabase สำหรับการจัดเก็บไฟล์

---

## **System Architecture**

- **Frontend**: พัฒนาโดยใช้ React และ Vite พร้อมการ deploy บน Vercel
- **Backend**: พัฒนาโดยใช้ Django และ Django REST Framework พร้อมการ deploy บน Render
- **Database**: ใช้ PostgreSQL บน Supabase
- **Storage**: ใช้ Supabase Storage สำหรับจัดเก็บไฟล์ เช่น รูปภาพและ PDF

BookHub/
│── backend/    
│   ├── admin_dashboard/    
│   │   └── templates/admin_dashboard    
│   ├── bookhub/ 
│   │   │   └── settings.py    
│   ├── books/  
│   │   └── views.py   
│   │   └── storages.py   
│   ├── users/
│   ├── venv/                  
│   ├── manage.py        
│   ├── requirements.txt 
│   ├── .env             
│   ├── Dockerfile      
│   ├── .gitignore   
│   └── Procfile          
│
│── frontend/            
│   ├── src/             
│   │   ├── pages/       
│   │   │   ├── Account.css
│   │   │   ├── AccountPublisher.jsx 
│   │   │   ├── AccountReader.jsx 
│   │   │   ├── Auth.css
│   │   │   ├── BooksDetails.jsx
│   │   │   ├── Home.jsx 
│   │   │   ├── Home.css
│   │   │   ├── Login.jsx
│   │   │   ├── MainPage.jsx 
│   │   │   ├── MainPage.css
│   │   │   ├── ReadBookWaarpper.jsx
│   │   │   ├── ReadBook.jsx 
│   │   │   ├── SignupPublisher.jsx
│   │   │   └── SignupReader.jsx 
│   │   ├── api.js 
│   │   ├── App.css      
│   │   ├── App.jsx      
│   │   ├── main.jsx     
│   │   ├── index.css    
│   ├── public/
│   ├── dist/
│   ├── node_modules/
│   ├── .gitignore
│   ├── Dockerfile
│   ├── eslint.config.js       
│   ├── index.html   
│   ├── package-lock.json     
│   ├── package.json            
│   ├── vite.config.js   
│   └── yarn.lock
│── README.md     
│── docker-compose.yml       
│── requirements.txt 
└── .gitignore           

#if frontend have a problem
npm install 
npm run dev

---

## **Backend**

### **Tech Stack**
- **Framework**: Django + Django REST Framework
- **Authentication**: Token-based Authentication
- **CORS**: รองรับการเชื่อมต่อกับ Frontend ผ่าน `django-cors-headers`
- **Static Files**: ใช้ Whitenoise สำหรับ static files ใน production
- **Deployment**: Render

### **Features**
- RESTful API สำหรับการจัดการผู้ใช้, หนังสือ, และแท็ก
- ระบบรีเซ็ตรหัสผ่านผ่านอีเมล
- ระบบจัดการไฟล์ (เช่น รูปภาพปกหนังสือ) บน Supabase Storage
- ระบบจัดการผู้ใช้ (Reader/Publisher/Admin)
- ระบบจัดการแท็กในหน้า Admin Dashboard

### **Design Patterns**
- **MVC (Model-View-Controller)**: Django ใช้ pattern นี้ในการจัดการโครงสร้างโค้ด
- **Serializer Pattern**: ใช้ Django REST Framework Serializers สำหรับการแปลงข้อมูลระหว่าง Model และ API
- **Service Layer**: แยก logic ที่ซับซ้อนออกจาก Views เพื่อให้ง่ายต่อการทดสอบและบำรุงรักษา

---

## **Frontend**

### **Tech Stack**
- **Framework**: React
- **Build Tool**: Vite
- **Routing**: React Router
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Deployment**: Vercel

### **Features**
- หน้าเว็บสำหรับผู้ใช้ Reader และ Publisher
- ระบบ Authentication (Login/Signup)
- ระบบรีเซ็ตรหัสผ่าน
- ระบบอ่านหนังสือ (PDF Viewer)
- ระบบจัดการบัญชีผู้ใช้
- ระบบค้นหาและแสดงรายละเอียดหนังสือ

### **Design Patterns**
- **Component-Based Architecture**: React ใช้ component-based design เพื่อแยกส่วน UI ออกเป็นชิ้นส่วนที่นำกลับมาใช้ใหม่ได้
- **Custom Hooks**: ใช้ hooks สำหรับการจัดการ state และ logic ที่ซับซ้อน
- **Atomic Design**: แบ่ง component ออกเป็น Atoms, Molecules, และ Organisms

---

## **Database**

### **Tech Stack**
- **Database**: PostgreSQL
- **Hosting**: Supabase
- **ORM**: Django ORM

### **Schema Overview**
- **Users**: จัดเก็บข้อมูลผู้ใช้ เช่น ชื่อ, อีเมล, ประเภทผู้ใช้ (Reader/Publisher)
- **Books**: จัดเก็บข้อมูลหนังสือ เช่น ชื่อ, ผู้แต่ง, หมวดหมู่, รูปภาพปก, และไฟล์ PDF
- **Tags**: จัดเก็บแท็กที่เกี่ยวข้องกับหนังสือ
- **PasswordReset**: จัดเก็บ token สำหรับการรีเซ็ตรหัสผ่าน

---

## **Setup Instructions**

### **Backend**
1. Clone repository:
      git clone https://github.com/your-repo/se-bookhub.git
   cd se-bookhub/backend
   reate a virtual environment:
      python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
3. ll dellies:
    ll -r requirements.txt
   
4. Set up .env file:
      DEBU   SECRET_   -secret-key
   DATABASE_NAME=your-db-name
   DATABASE_USER=your-db-user
   DATABASE_PASSWORD=your-db-password
   DATABASE_HOST=your-db-host
   DATABASE_PORT=5432
   
5. Runations:
      python manage.py migrate
   
6. Start thelopment server:
      python manage.py runserver
   
### **Frontend**
1. Navigate to the frontend directory:
      cd ../frontend
   2. Install dependencies:
      npm install
   3. Start the development s
   npm run dev
   
#### **Backend**
- Deploy on Render
- Use gunicorn as the WSGI server
- Configure environment variables in Render's dashboard

#### **Frontend**
- Deploy on Vercel
- Configure environment variables in Vercel's dashboard

