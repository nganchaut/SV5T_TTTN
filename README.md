# Hệ Thống Quản Lý Sinh Viên 5 Tốt (SV5T)

Chào mừng bạn đến với dự án **Hệ thống Quản lý Sinh viên 5 Tốt**. Đây là một ứng dụng fullstack hoàn chỉnh giúp quản lý và xét duyệt hồ sơ sinh viên dựa trên các tiêu chí chuẩn.

## 🚀 Tính năng chính
- **Admin Dashboard:** Quản trị người dùng, duyệt hồ sơ, cấu hình tiêu chí hệ thống/thủ công.
- **Student Dashboard:** Nộp hồ sơ, khai báo điểm số (GPA, DRL...), tải minh chứng.
- **Hệ thống Tiêu chí:** Tự động phân loại tiêu chí "Hệ thống" (tự động tính điểm) và "Thủ công" (cần nộp file).
- **Quản lý Minh chứng:** Hỗ trợ tải file, xét duyệt theo cấp độ và loại chứng nhận.

---

## 🛠 Hướng dẫn cài đặt nhanh

### 1. Cấu hình Backend (Django)
Yêu cầu: Python 3.10+

1. Di chuyển vào thư mục backend: `cd backend`
2. Tạo môi trường ảo: `python -m venv venv`
3. Kích hoạt: `.\venv\Scripts\activate` (Windows)
4. Cài đặt thư viện: `pip install -r requirements.txt`
5. **Khởi tạo dữ liệu (Quan trọng):**
   ```powershell
   python manage.py migrate
   python manage.py seed_criteria
   python manage.py createsuperuser
   ```
6. Chạy server: `python manage.py runserver`

### 2. Cấu hình Frontend (React + Vite)
Yêu cầu: Node.js 18+

1. Di chuyển vào thư mục frontend: `cd frontend`
2. Cài đặt thư viện: `npm install`
3. Chạy demo: `npm run dev`

---

## 📂 Cấu trúc dự án
- `/backend`: Django REST Framework API.
- `/frontend`: React + TypeScript + Vite + Tailwind CSS.
- `/brain`: Tài liệu phân tích và kế hoạch triển khai của AI.

## ✍️ Tác giả & Ghi chú
Dự án được thực hiện nhằm hỗ trợ quy trình xét duyệt danh hiệu Sinh viên 5 Tốt một cách minh bạch và hiệu quả.

**Ghi chú:** File cơ sở dữ liệu `db.sqlite3` không được đẩy lên Git vì lý do bảo mật. Vui lòng chạy lệnh `seed_criteria` để có bộ khung tiêu chí hoàn chỉnh.
