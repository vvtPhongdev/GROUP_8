# 🎨 RMS Front-End Architecture & Guidelines

> 💡 **Xem giải thích chi tiết code và vai trò từng file tại:** [CODEBASE_EXPLANATION.md](file:///d:/Project/SE20A05Group7RMS/CODEBASE_EXPLANATION.md)

Dự án Front-End được tổ chức tập trung trong thư mục [frontend/](file:///d:/Project/SE20A05Group7RMS/frontend). Đây là ứng dụng Single Page Application (SPA) xây dựng bằng **React 19**, **Vite**, **TailwindCSS**, và **Radix UI**.

---

## 📁 1. Cấu Trúc Thư Mục `frontend/`

```
frontend/
├── public/                     # Static assets (logo, icons, images)
│   ├── logo.svg
│   ├── logo-offical.svg
│   └── logo-with-text.svg
├── src/
│   ├── App.tsx                 # App Shell & Router mapping 4 role portals
│   ├── main.tsx                # Entry point React DOM
│   ├── index.css               # Global styles & design tokens
│   ├── metadata.json           # Thông tin metadata & routes
│   │
│   ├── components/             # Components chung (Layout, ProtectedRoute, Modal, etc.)
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── JobDetailsModal.tsx
│   │   └── ui/                 # Atomic UI primitives (Button, Input, Sidebar, Sheet, etc.)
│   │
│   ├── context/                # React Context (AuthContext quản lý token, role, user state)
│   │   └── AuthContext.tsx
│   │
│   ├── features/               # Các module phân theo 4 Vai trò (Roles)
│   │   ├── admin/              # Module dành cho System Admin
│   │   │   ├── components/
│   │   │   └── pages/          # Admin Dashboard, Users, Approval Queue, Reports, Settings
│   │   ├── dept-head/          # Module dành cho Department Head (Trưởng phòng ban)
│   │   │   ├── components/
│   │   │   └── pages/          # Tạo đề xuất tuyển dụng, Đánh giá phỏng vấn, Requests
│   │   ├── hr/                 # Module dành cho HR Manager / HR Leader
│   │   │   ├── components/
│   │   │   └── pages/          # Campaign, Lập kế hoạch (Task/Overall Plan), Sàng lọc CV, Phỏng vấn, Offer
│   │   └── candidate/          # Module dành cho Candidate (Ứng viên)
│   │       ├── components/
│   │       └── pages/          # Ứng tuyển, Upload CV, Hồ sơ năng lực, Lịch phỏng vấn, Offers
│   │
│   ├── hooks/                  # Custom React hooks (use-mobile, v.v.)
│   ├── lib/                    # API client, Supabase client, utils helper
│   │   ├── api.ts              # Fetch wrapper gọi về API Gateway (:3001)
│   │   ├── auth.ts             # Lưu trữ/đọc access token trong localStorage
│   │   ├── supabase.ts         # Supabase client (nếu có dùng realtime/storage)
│   │   └── utils.ts
│   │
│   └── pages/                  # Trang công khai & Xác thực (Landing, Login, SignUp, ResetPassword, ...)
│
├── package.json                # Định danh package: @wr/webapp
├── vite.config.ts              # Cấu hình Vite, port 3000, alias & proxy sang API Gateway
├── tsconfig.json               # Cấu hình TypeScript cho React
└── index.html                  # HTML template chính
```

---

## 🔑 2. Cổng & Luồng Giao Tiếp API

- **Cổng chạy Local:** `http://127.0.0.1:3000`
- **Giao tiếp Backend:** Mọi request dữ liệu từ `frontend/` đều đi qua **API Gateway** (`http://127.0.0.1:3001/api/v1`).
- **Proxy trong Vite:**
  - `/api` được tự động chuyển hướng tới `http://localhost:3001`.
  - Giúp tránh các lỗi CORS trong quá trình phát triển cục bộ.

---

## 👥 3. 5 Phân Hệ Chức Năng Theo Role

1. **BOSS** (`/boss`) — *Chủ doanh nghiệp / Ban lãnh đạo*:
   - Duyệt hoặc từ chối đề xuất tuyển dụng cấp cao (`PENDING_BOSS_APPROVAL`) và kế hoạch tổng thể (`OverallPlan`).
   - Theo dõi toàn bộ yêu cầu tuyển dụng (`All Requests`), kết quả phỏng vấn cuối cùng (`Interview Results`).
   - Xem báo cáo hiệu suất tuyển dụng hàng năm (`Annual Report`) và thống kê phòng ban (`Dept Stats`).

2. **WEB_ADMIN** (`/admin`) — *Quản trị viên Web & Kỹ thuật*:
   - Giám sát trạng thái thời gian thực, độ trễ và tính sẵn sàng của API Gateway và các Microservices (`/admin/api-monitor`).
   - Bật/tắt chế độ bảo trì toàn trang (Maintenance Mode), cấu hình thông báo bảo trì (`/admin/maintenance`).
   - Quản lý tài khoản người dùng, tạo lời mời và phân quyền (`/admin/users`).
   - Quản trị cấu hình kỹ thuật hệ thống (`/admin/settings`).

3. **DEPARTMENT_HEAD** (`/dept-head`):
   - Tạo đề xuất nhu cầu tuyển dụng mới (`RecruitmentRequest`).
   - Tham gia hội đồng phỏng vấn, điền form đánh giá kết quả ứng viên.

4. **HR_LEADER** (`/hr`):
   - Tiếp nhận đề xuất tuyển dụng, xây dựng kế hoạch và phân bổ nhiệm vụ tuyển dụng.
   - Quản lý tin tuyển dụng, sàng lọc CV ứng viên bằng AI / Semantic Search.
   - Điều phối lịch phỏng vấn, gửi thư mời và gửi thư mời làm việc (Offer Letter).

5. **CANDIDATE** (`/candidate`):
   - Tìm kiếm việc làm, gửi hồ sơ ứng tuyển, upload và phân tích CV.
   - Nhận phản hồi lịch phỏng vấn và phản hồi thư nhận việc trực tuyến.

---

## 🚀 4. Lệnh Khởi Động Front-End

```bash
# Khởi động riêng biệt Front-End
npm run dev:webapp

# Hoặc khởi động từ thư mục gốc thông qua Turborepo
npm run dev
```
