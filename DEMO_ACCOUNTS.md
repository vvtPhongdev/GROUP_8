# 🔑 Danh Sách Tài Khoản Demo — Works Recruiter (RMS)

Tài liệu tổng hợp toàn bộ các tài khoản dùng thử (Demo Accounts) được khởi tạo sẵn trong cơ sở dữ liệu hệ thống **Works Recruiter (RMS)** phục vụ quá trình phát triển, kiểm thử và nghiệm thu các tính năng (Sprints 1, 2, 3).

---

## 🔐 1. Thông Tin Đăng Nhập Chung

> **Mật khẩu dùng chung cho TẤT CẢ tài khoản demo**:  
> ### `Password123!`

- **Địa chỉ ứng dụng Web (Frontend)**: [http://localhost:3000](http://localhost:3000)
- **API Gateway (Swagger Docs)**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **Lệnh nạp lại dữ liệu mẫu**: `npm run db:seed`

---

## 👥 2. Danh Sách Tài Khoản Chi Tiết Theo Vai Trò

### 👑 A. Lãnh đạo Cấp cao (Executive / C-Level)

| Vai trò | Họ tên | Email đăng nhập | Route mặc định | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- | :--- |
| **`BOSS`** | **Demo Boss** | `boss@demo.test` | `/boss` | • Phê duyệt Đề xuất tuyển dụng từ Trưởng phòng<br>• Phê duyệt Kế hoạch tổng thể & Ngân sách từ HR<br>• Phê duyệt thư mời nhận việc (Offer Letter)<br>• Xem Báo cáo năm & Thống kê phòng ban |

---

### 🛠️ B. Quản trị viên Kỹ thuật (System Administrator)

| Vai trò | Họ tên | Email đăng nhập | Route mặc định | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- | :--- |
| **`WEB_ADMIN`** | **Demo Web Admin** | `webadmin@demo.test` | `/admin` | • Quản lý người dùng (Tạo, cấp quyền, khóa/mở khóa)<br>• Quản lý mã mời tham gia tổ chức<br>• Giám sát thời gian thực 9 microservices (`/admin/api-monitor`)<br>• Bật/Tắt chế độ bảo trì hệ thống (`/admin/maintenance`)<br>• Cấu hình phòng ban & tiêu chuẩn tuyển dụng |

---

### 🏢 C. Trưởng Phòng Ban (Department Heads)

| Vai trò | Phòng ban | Họ tên | Email đăng nhập | Route mặc định | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`DEPARTMENT_HEAD`** | **Engineering** (Kỹ thuật) | **Sarah Chen** | `engineering.head@demo.test` | `/dept-head` | • Tạo Đề xuất tuyển dụng (Vị trí, số lượng, kỹ năng)<br>• Theo dõi trạng thái duyệt đề xuất<br>• Tham gia hội đồng phỏng vấn ứng viên<br>• Nhập điểm đánh giá phỏng vấn (Kỹ thuật, Văn hóa) |
| **`DEPARTMENT_HEAD`** | **Marketing** | **Marcus Johnson** | `marketing.head@demo.test` | `/dept-head` | • Tạo đề xuất tuyển dụng phòng Marketing<br>• Phỏng vấn ứng viên Marketing & nộp phiếu điểm |

---

### 📋 D. Bộ Phận Nhân Sự (HR Manager & Recruiters)

| Vai trò | Chức danh | Họ tên | Email đăng nhập | Route mặc định | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`HR_LEADER`** | **HR Manager** | **Emily Wong** | `hr.manager@demo.test` | `/hr` | • Xem xét đề xuất tuyển dụng trước khi chuyển Boss duyệt<br>• Lập Kế hoạch tuyển dụng tổng thể (`OverallPlan`)<br>• Phân công kế hoạch chi tiết (`TaskPlan`) cho Recruiter<br>• Đưa ra khuyến nghị tuyển dụng cuối cùng |
| **`HR_LEADER`** | **Lead Recruiter** | **Lisa Thompson** | `hr.recruiter@demo.test` | `/hr` | • Đăng tin tuyển dụng (`JobPosting`)<br>• Thu thập CV ứng viên (`CV Collection`)<br>• Sàng lọc & Kích hoạt AI chấm điểm CV (`AI Screening`)<br>• Đặt lịch phỏng vấn & gửi thư mời Offer |
| **`HR_LEADER`** | **Technical Recruiter** | **Nina Patel** | `hr.recruiter2@demo.test` | `/hr` | • Phụ trách tìm kiếm & sàng lọc ứng viên kỹ thuật<br>• Điều phối hội đồng phỏng vấn |
| **`HR_LEADER`** | **Talent Acquisition** | **David Kim** | `hr.recruiter3@demo.test` | `/hr` | • Tìm kiếm nhân tài qua Talent Pool & Vector Search |
| **`HR_LEADER`** | **Sourcing Specialist**| **An Tran** | `hr.recruiter4@demo.test` | `/hr` | • Nhận nhiệm vụ thu thập hồ sơ ứng viên theo chiến dịch |

---

### 🎓 E. Ứng Viên Tuyển Dụng (Candidates / Job Applicants)

Mỗi ứng viên mẫu đều được tạo sẵn **Hồ sơ năng lực (`CandidateProfile`)** và **File CV thực tế (`CandidateCV`)** có thể tải về / xem trước:

| Họ tên Ứng viên | Email đăng nhập | Vị trí chuyên môn | Năm KN | Trạng thái mẫu | Route mặc định |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Alex Rivera** | `candidate1@demo.test` | Senior TypeScript Engineer | 8 năm | Đang phỏng vấn (`INTERVIEWING`) | `/candidate` |
| **Priya Sharma** | `candidate2@demo.test` | Backend Engineer (Go/Kubernetes) | 6 năm | Đang sàng lọc (`SCREENING`) | `/candidate` |
| **Tomas Garcia** | `candidate3@demo.test` | DevOps & Cloud Platform Engineer | 7 năm | Đã nộp hồ sơ (`SUBMITTED`) | `/candidate` |
| **Mina Nguyen** | `candidate4@demo.test` | Frontend Engineer (React/Tailwind) | 5 năm | Đã nộp hồ sơ (`SUBMITTED`) | `/candidate` |
| **Jordan Lee** | `candidate5@demo.test` | QA Automation Engineer | 4 năm | Đang sàng lọc (`SCREENING`) | `/candidate` |

*Chức năng của ứng viên:*
- Xem danh sách việc làm đang mở & ứng tuyển trực tiếp.
- Tải mẫu CV chuẩn của hệ thống (`RMS-CV-Template.doc`).
- Tải lên CV cá nhân (hệ thống tự động dùng thuật toán bóc tách thông tin).
- Xem lịch phỏng vấn đã được HR xếp.
- Nhận và phản hồi Thư mời nhận việc (Chấp nhận / Từ chối Offer).

---

## 🔄 3. Kịch Bản Kiểm Thử Nhanh (End-to-End Workflow)

Bạn có thể đăng nhập luân phiên giữa các tài khoản để trải nghiệm toàn bộ vòng đời tuyển dụng:

1. **Bước 1**: Đăng nhập bằng `engineering.head@demo.test` $\rightarrow$ Vào `/dept-head/create-request` để **tạo đề xuất tuyển dụng mới** (VD: Tuyển 2 Senior Backend Developer).
2. **Bước 2**: Đăng nhập bằng `boss@demo.test` $\rightarrow$ Vào `/boss/approval-queue` để **duyệt đề xuất**.
3. **Bước 3**: Đăng nhập bằng `hr.manager@demo.test` $\rightarrow$ Vào `/hr/campaigns` để **lập kế hoạch tổng thể & phân công nhiệm vụ** (đăng tin, lọc CV, phỏng vấn).
4. **Bước 4**: Đăng nhập bằng `boss@demo.test` $\rightarrow$ Vào `/boss/approval-queue` để **duyệt kế hoạch & ngân sách tuyển dụng**.
5. **Bước 5**: Đăng nhập bằng `hr.recruiter@demo.test` $\rightarrow$ Đăng tin tuyển dụng và mở nhận hồ sơ.
6. **Bước 6**: Đăng nhập bằng `candidate1@demo.test` $\rightarrow$ Nộp CV vào vị trí vừa đăng.
7. **Bước 7**: Hệ thống tự động dùng **Thuật toán parse CV** và kích hoạt **Gemini AI chấm điểm/sàng lọc** tự động.
8. **Bước 8**: Đăng nhập bằng `hr.recruiter@demo.test` $\rightarrow$ Vào `/hr/interviews` xếp lịch phỏng vấn với `Sarah Chen` và `Marcus Johnson`.
9. **Bước 9**: Đăng nhập bằng `engineering.head@demo.test` $\rightarrow$ Nhập điểm đánh giá kỹ thuật sau phỏng vấn.
10. **Bước 10**: Đăng nhập bằng `hr.manager@demo.test` $\rightarrow$ Phát hành thư mời nhận việc (Offer Letter).
11. **Bước 11**: Đăng nhập bằng `candidate1@demo.test` $\rightarrow$ Vào `/candidate` chấp nhận Offer.

---

## 🛠️ 4. Khôi Phục Dữ Liệu Mẫu

Nếu trong quá trình thao tác kiểm thử dữ liệu bị xáo trộn hoặc cần cài đặt lại trạng thái ban đầu, chạy lệnh sau tại thư mục gốc:

```bash
npm run db:seed
```

Toàn bộ 14 tài khoản trên cùng các bảng phòng ban, kỹ năng, tin tuyển dụng và hồ sơ mẫu sẽ được làm mới sạch sẽ trong vài giây.

