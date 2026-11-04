# ⚙️ RMS Back-End Architecture & Guidelines

> 💡 **Xem giải thích chi tiết code và vai trò từng file tại:** [CODEBASE_EXPLANATION.md](file:///d:/Project/SE20A05Group7RMS/CODEBASE_EXPLANATION.md)

Dự án Back-End được tổ chức tập trung trong thư mục [backend/](file:///d:/Project/SE20A05Group7RMS/backend). Hệ thống được thiết kế theo kiến trúc **Microservices** hướng sự kiện (Event-driven / TCP RPC) kết hợp hàng đợi bất đồng bộ **BullMQ + Redis**, cơ sở dữ liệu **PostgreSQL (pgvector)** và ORM **Prisma**.

---

## 📁 1. Cấu Trúc Thư Mục `backend/`

```
backend/
├── services/                   # 9 Microservices độc lập
│   ├── gateway/                # API Gateway (NestJS, Port 3001) - Swagger, Auth Guard, Proxy
│   ├── identity/               # Dịch vụ Quản lý người dùng, tổ chức, phòng ban, JWT/Redis auth
│   ├── recruiting/             # Dịch vụ Quản lý quy trình tuyển dụng (Request, Plan, Job, Decision)
│   ├── interview/              # Dịch vụ Lên lịch phỏng vấn, gửi lời mời và đánh giá kết quả
│   ├── cv/                     # Dịch vụ Nhận upload CV và phát sinh sự kiện phân tích
│   ├── profiles/               # Dịch vụ Quản lý hồ sơ ứng viên và tài liệu bổ trợ
│   ├── notification/           # Dịch vụ Thông báo thời gian thực (SSE) và Email
│   ├── worker/                 # BullMQ Background Worker (Parse CV, Embedding, Mailer SMTP, Reminders)
│   └── embedding/              # Dịch vụ tạo vector embedding (Node.js, Port 8000)
│
└── packages/                   # Các thư viện & module nghiệp vụ cốt lõi
    ├── ai/                     # Trích xuất CV (PDF/DOCX), đồ thị kỹ năng (Skill Graph), NLP
    ├── ai-models/              # Local ONNX model (intfloat/multilingual-e5-small) + Tokenizer
    ├── config/                 # Trình nạp và xác thực biến môi trường .env
    ├── contracts/              # Data Contracts chung (Zod schemas, DTOs, Enums, TypeScript Types)
    ├── database/               # Prisma schema, PostgreSQL + pgvector migrations & Seed logic
    ├── logger/                 # Module Logging chuẩn hóa (Pino/Winston)
    ├── queue/                  # Cấu hình kết nối Redis & BullMQ Queues
    ├── storage/                # Tiện ích lưu trữ file tài liệu
    ├── typescript-config/      # Base TypeScript configs (base, nestjs, react, node)
    └── ui/                     # Primitives CSS design tokens dùng cho giao diện
```

---

## 🌐 2. Danh Sách 9 Microservices & Cổng Chạy

| Service | Port / Protocol | Nhiệm vụ chính |
| :--- | :--- | :--- |
| **gateway** | HTTP `3001` | Điểm tiếp nhận request duy nhất từ Frontend. Đảm nhận xác thực JWT, phân quyền Guards, upload file, và forward qua TCP tới các internal services. |
| **identity** | TCP Internal | Đăng ký, đăng nhập, cấp phát JWT pair (Access 1h + Refresh Token lưu Redis), quản lý Department, Organization, User. |
| **recruiting** | TCP Internal | Quản lý vòng đời tuyển dụng 13 trạng thái: Đề xuất tuyển dụng -> Phê duyệt -> Kế hoạch -> Đăng tin -> Ứng tuyển -> Sàng lọc CV -> Ra quyết định tuyển dụng. |
| **interview** | TCP Internal | Tạo lịch phỏng vấn, phòng họp, liên kết hội đồng phỏng vấn, ghi nhận feedback chấm điểm (PASS/FAIL). |
| **cv** | TCP Internal | Nhận file CV (PDF/DOCX), lưu trữ tạm thời, gửi job vào BullMQ để bóc tách. |
| **profiles** | TCP Internal | Quản lý thông tin ứng viên (CandidateProfile), học vấn, kinh nghiệm và chứng chỉ đính kèm. |
| **notification** | TCP Internal | Bắn thông báo real-time qua SSE (`/api/v1/notifications/stream`) và hàng đợi gửi email. |
| **worker** | BullMQ Processor | Background worker chạy nền xử lý: CV text extraction (`pdf-parse`, `mammoth`), vector embedding, email SMTP transporter, cron nhắc lịch. |
| **embedding** | HTTP `8000` | Microservice AI chạy mô hình ONNX nội bộ (384 chiều) phục vụ Semantic Search & Match điểm CV. |

---

## 🗄️ 3. Cơ Sở Dữ Liệu & Vector Search

- **Hệ quản trị CSDL:** PostgreSQL 16 tích hợp extension `pgvector`.
- **Bảng chính:** `User`, `Department`, `Organization`, `RecruitmentRequest`, `OverallPlan`, `TaskPlan`, `Interview`, `InterviewResult`, `CandidateProfile`, `CvDocument`, `CvEmbedding`.
- **Vector Search:** Cột `embedding vector(384)` trên bảng `CvEmbedding` kết hợp tìm kiếm khoảng cách Cosine (`<=>`) cho phép đối sánh mức độ phù hợp giữa CV và Job Description.

---

## 🚀 4. Lệnh Vận Hành & Khởi Động Back-End

```bash
# 1. Khởi động Docker (Postgres pgvector & Redis)
npm run docker:up

# 2. Sinh Prisma Client & Đồng bộ Schema
npm run db:generate
npm run db:push

# 3. Nạp dữ liệu mẫu ban đầu
npm run db:seed

# 4. Khởi chạy từng microservice (nếu muốn debug riêng):
npm run dev:gateway
npm run dev:identity
npm run dev:recruiting
npm run dev:interview
npm run dev:cv
npm run dev:profiles
npm run dev:notification
npm run dev:worker

# Hoặc khởi chạy toàn bộ qua Turborepo:
npm run dev
```
