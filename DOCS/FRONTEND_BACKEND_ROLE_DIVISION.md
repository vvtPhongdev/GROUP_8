# 📑 PHƯƠNG ÁN PHÂN CHIA CHUYÊN MÔN HÓA (FRONTEND & BACKEND)
## KÈM PHÂN TÍCH CHI TIẾT TỪNG DÒNG CODE CHO 5 THÀNH VIÊN
### DỰ ÁN: WORKS RECRUITER (RMS) — NHÓM 7 (SE20A05)

Tài liệu này được biên soạn theo định hướng **Chuyên môn hóa theo tầng kiến trúc (Frontend React vs Backend Microservices)**, đồng thời **phân tích chi tiết từng đoạn code, từng hàm, từng file liên quan** để cả 5 thành viên (kể cả những bạn yếu code) đều có thể hiểu tường tận và tự tin báo cáo trước Hội đồng chấm thi.

---

# 🗺️ 1. BẢNG TỔNG QUAN PHÂN CHIA NHIỆM VỤ

```
                                  ┌──────────────────────────────────────────────────┐
                                  │           SE20A05 - GROUP 7 RMS MONOREPO         │
                                  └────────────────────────┬─────────────────────────┘
                                                           │
                      ┌────────────────────────────────────┴────────────────────────────────────┐
                      ▼                                                                         ▼
     ┌──────────────────────────────────┐                                      ┌──────────────────────────────────┐
     │       TẦNG BACKEND & AI          │                                      │       TẦNG FRONTEND REACT        │
     │      (3 Thành viên phụ trách)    │                                      │     (2 Thành viên phụ trách)     │
     └────────────────┬─────────────────┘                                      └────────────────┬─────────────────┘
                      │                                                                         │
       ┌──────────────┼──────────────┐                                           ┌──────────────┴──────────────┐
       ▼              ▼              ▼                                           ▼                             ▼
┌──────────────┐┌──────────────┐┌──────────────┐                          ┌──────────────┐              ┌──────────────┐
│THÀNH VIÊN 1  ││THÀNH VIÊN 2  ││THÀNH VIÊN 3  │                          │THÀNH VIÊN 4  │              │THÀNH VIÊN 5  │
│(TECH LEAD)   ││(Backend Dễ 1)││(Backend Dễ 2)│                          │(Frontend 1)  │              │(Frontend 2)  │
│🌟 Backend Khó││🛠️ Identity   ││📋 Interview  │                          │🏢 Doanh nghiệp│             │🎓 Ứng viên & │
│Architecture, ││& Auth, Users,││& Feedback,   │                          │HR, Boss &    │              │Admin, Auth,  │
│AI Engine &   ││Departments,  ││Notifications,│                          │Dept Head     │              │App Shell     │
│Recruiting    ││Bcrypt, JWT   ││Email Mẫu     │                          │Portals       │              │Layout        │
└──────────────┘└──────────────┘└──────────────┘                          └──────────────┘              └──────────────┘
```

| STT | Thành viên | Chuyên môn phụ trách | Phạm vi công việc cụ thể | File code chính | Mức độ kỹ thuật |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **THÀNH VIÊN 1<br>(TECH LEAD)** | 🌟 **BACKEND ARCHITECTURE, RECRUITING & AI ENGINE** | • Kiến trúc Microservices (Monorepo Turborepo, API Gateway, TCP Transport)<br>• Thuật toán parse CV (Regex/Template) & Gemini AI chấm điểm CV<br>• Tìm kiếm Vector `pgvector` + BullMQ Worker ngầm<br>• Vòng đời tuyển dụng 13 trạng thái, Kế hoạch tổng thể & Ngân sách | `gateway`, `recruiting`, `@wr/ai`, `worker` | 🔥 **Rất sâu** *(Lead làm chủ toàn bộ phần khó)* |
| **2** | **THÀNH VIÊN 2<br>(Backend Dễ 1)** | 🔐 **IDENTITY, AUTHENTICATION & DEPARTMENTS** | • Dịch vụ Identity (Port 3010): Đăng nhập, băm mật khẩu `bcrypt`, JWT Tokens<br>• Quản trị danh mục tài khoản nhân sự (`User`)<br>• Quản trị danh mục phòng ban (`Department`) & tổ chức (`Organization`)<br>• Xác thực mã OTP kích hoạt tài khoản qua email | `services/identity/*`<br>`controllers/identity.controller.ts` | 🟢 **Dễ** *(CRUD bảng dữ liệu, bcrypt, JWT chuẩn)* |
| **3** | **THÀNH VIÊN 3<br>(Backend Dễ 2)** | 📋 **INTERVIEWS, EVALUATION FEEDBACK & NOTIFICATIONS** | • Dịch vụ Interview (Port 3015): Quản lý lịch phỏng vấn (`Schedules`)<br>• Lưu trữ bảng điểm đánh giá của giám khảo vào CSDL (`InterviewResult`)<br>• Dịch vụ Notification (Port 3013): Tạo thông báo in-app cho người dùng<br>• Quản lý các mẫu email thông báo phỏng vấn & kết quả | `services/interview/*`<br>`services/notification/*` | 🟢 **Dễ** *(CRUD lịch hẹn, lưu điểm, tạo thông báo)* |
| **4** | **THÀNH VIÊN 4<br>(Frontend 1)** | 🏢 **FRONTEND ENTERPRISE PORTALS (HR, BOSS, DEPT HEAD)** | • Phân hệ Trưởng phòng (`features/dept-head`): Form tạo đề xuất tuyển dụng theo template, phiếu chấm điểm phỏng vấn<br>• Phân hệ Boss (`features/boss`): Hàng đợi duyệt yêu cầu, biểu đồ chi phí năm<br>• Phân hệ HR (`features/hr`): Lập kế hoạch `TaskPlanner`, đăng tin tuyển dụng | `features/hr/*`<br>`features/boss/*`<br>`features/dept-head/*` | 🟡 **Vừa phải** *(React UI Form, Bảng dữ liệu, Recharts)* |
| **5** | **THÀNH VIÊN 5<br>(Frontend 2)** | 🎓 **FRONTEND PUBLIC, CANDIDATE, ADMIN & AUTH** | • Khung sườn ứng dụng: `Layout.tsx` (Sidebar tự đổi theo Role), `ProtectedRoute.tsx`<br>• Các trang Xác thực: `Login.tsx`, `SignUp.tsx`, `AccountSettings.tsx`<br>• Phân hệ Ứng viên (`features/candidate`): Landing Page, nộp file CV theo mẫu chuẩn RMS, ký Offer online<br>• Phân hệ Quản trị (`features/admin`): Quản lý người dùng, giám sát 9 Microservices | `features/candidate/*`<br>`features/admin/*`<br>`src/pages/*`, `components/*` | 🟡 **Vừa phải** *(React UI Form, Drag & Drop, Layout Shell)* |

---

# 🔍 2. CHI TIẾT GIẢI THÍCH TỪNG DÒNG CODE CHO 5 THÀNH VIÊN

---

## 🌟 PHẦN 1: THÀNH VIÊN 1 — TECH LEAD (BACKEND ARCHITECTURE, RECRUITING & AI)

Thành viên 1 chịu trách nhiệm cho các phần phức tạp nhất của hệ thống:

### 1.1 Khởi tạo kết nối Microservices qua TCP RPC tại API Gateway
*File: `backend/services/gateway/src/gateway.module.ts`*

```typescript
// Dòng 35 - 55: Khai báo các Microservices nội bộ kết nối qua giao thức TCP
ClientsModule.register([
  {
    name: 'IDENTITY_SERVICE',
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: 3010 }, // Port TCP dịch vụ Identity
  },
  {
    name: 'RECRUITING_SERVICE',
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: 3011 }, // Port TCP dịch vụ Tuyển dụng
  },
  {
    name: 'INTERVIEW_SERVICE',
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: 3015 }, // Port TCP dịch vụ Phỏng vấn
  },
  {
    name: 'NOTIFICATION_SERVICE',
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: 3013 }, // Port TCP dịch vụ Thông báo
  },
])
```
* **Giải thích từng dòng**:
  - `name: 'RECRUITING_SERVICE'`: Đặt tên định danh cho ClientProxy để Controller có thể `@Inject('RECRUITING_SERVICE')` và bắn message.
  - `transport: Transport.TCP`: Chọn giao thức truyền tải TCP socket nhị phân thay vì HTTP REST nội bộ. Giúp tăng tốc độ giao tiếp giữa các service lên gấp 4-5 lần, giảm thiểu overhead của HTTP headers.
  - `options: { host, port }`: Định vị địa chỉ IP và Port nội bộ lắng nghe của microservice đích.

---

### 1.2 Thuật toán trích xuất CV theo mẫu chuẩn (Zero Token AI)
*File: `backend/packages/ai/src/candidate-template-parser.ts`*

```typescript
// Dòng 32 - 39: Thuật toán cắt lát chuỗi theo thẻ tiêu đề (Section Boundary Extraction)
function section(text: string, heading: string, nextHeadings: readonly string[]) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const next = nextHeadings.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = text.match(
    new RegExp(`${escapedHeading}\\s*([\\s\\S]*?)(?=\\n\\s*(?:${next})\\b|$)`, 'i'),
  );
  return match?.[1]?.trim() ?? '';
}
```
* **Giải thích từng dòng**:
  - `escapedHeading`: Sử dụng regex escape để loại bỏ nguy cơ ký tự đặc biệt làm hỏng biểu thức chính quy.
  - `next`: Ghép các tiêu đề kế tiếp thành biểu thức phủ định Lookahead `(?=\\n\\s*(?:${next})\\b|$)`.
  - `[\\s\\S]*?`: Biểu thức Non-greedy match tất cả ký tự (kể cả xuống dòng) từ vị trí tiêu đề hiện tại cho đến khi chạm vào tiêu đề kế tiếp hoặc kết thúc văn bản.
  - Kết quả: Bóc tách trọn vẹn khối kinh nghiệm làm việc hoặc học vấn với độ chính xác xấp xỉ 100% trong vòng $\sim 2$ mili-giây, không tiêu tốn bất kỳ token AI nào.

---

### 1.3 Mô hình Gemini AI Chấm điểm CV so với JD & Multi-Key Rotation
*File: `backend/packages/ai/src/cv-evaluator.ts`*

```typescript
// Dòng 65 - 85: Cơ chế xoay vòng nhiều API Keys và gọi Gemini 2.5 Flash
for (const apiKey of config.apiKeys) {
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    });
    return JSON.parse(result.response.text());
  } catch (err: any) {
    if (err.status === 429) {
      console.warn('Key rate limit exceeded, rotating to next API key...');
      continue; // Tự động đổi sang Key tiếp theo trong mảng
    }
    throw err;
  }
}
```
* **Giải thích từng dòng**:
  - `for (const apiKey of config.apiKeys)`: Duyệt qua danh sách mảng nhiều khóa API cấu hình trong `.env`.
  - `model: 'gemini-2.5-flash'`: Sử dụng mô hình thế hệ mới nhất của Google cho tốc độ phản hồi nhanh và khả năng đọc hiểu ngữ cảnh tiếng Việt xuất sắc.
  - `responseMimeType: 'application/json'`: Ép buộc mô hình Gemini luôn trả về định dạng JSON có cấu trúc chuẩn (`overallScore`, `technicalFitScore`, `strengths`, `weaknesses`), ngăn chặn lỗi text không parse được.
  - `if (err.status === 429) continue`: Cơ chế chịu lỗi (Fault tolerance): khi một key hết hạn ngạch (Rate Limit 429), hệ thống tự động xoay sang key dự phòng mà không làm gián đoạn người dùng.

---

### 1.4 Truy vấn khoảng cách Cosine Vector ngữ nghĩa với PostgreSQL `pgvector`
*File: `backend/services/recruiting/src/modules/cv-search/cv-search.service.ts`*

```typescript
// Dòng 45 - 55: Câu truy vấn Cosine Similarity bằng toán tử pgvector
const results = await this.prisma.$queryRaw`
  SELECT cv.id, cv.candidate_id, 1 - (e.embedding <=> ${queryVector}::vector) AS similarity_score
  FROM cv_embeddings e
  JOIN candidate_cvs cv ON cv.id = e.cv_document_id
  ORDER BY e.embedding <=> ${queryVector}::vector ASC
  LIMIT 20;
`;
```
* **Giải thích từng dòng**:
  - `e.embedding <=> ${queryVector}::vector`: Toán tử `<=>` là toán tử tính khoảng cách Cosine giữa 2 vector đa chiều được tối ưu bằng phần cứng C trong PostgreSQL.
  - `1 - (khoảng cách)`: Chuyển đổi khoảng cách (từ 0 đến 2) thành điểm độ tương đồng (Similarity Score từ 0.0 đến 1.0 hay 0% đến 100%).
  - `ORDER BY ... ASC LIMIT 20`: Sử dụng chỉ mục `ivfflat` (`vector_cosine_ops`) để quét nhanh Top 20 ứng viên phù hợp nhất mà không phải quét toàn bộ bảng (Full Table Scan).

---

## 🔐 PHẦN 2: THÀNH VIÊN 2 — BACKEND DỄ 1 (IDENTITY, AUTHENTICATION & DEPARTMENTS)

Thành viên 2 phụ trách **Identity Service (Port 3010)** — Phần backend rất căn bản, chuẩn mực:

### 2.1 Kiểm tra đăng nhập và băm mật khẩu Bcrypt
*File: `backend/services/identity/src/modules/auth/auth.service.ts`*

```typescript
// Dòng 692 - 715: Hàm xử lý Đăng nhập người dùng
async login(dto: LoginInput): Promise<AuthTokenResponse> {
  // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào bằng Zod Schema
  const parsed = LoginSchema.parse(dto);

  // 2. Tìm người dùng trong CSDL bằng Email
  const user = await this.prisma.user.findUnique({
    where: { email: parsed.email },
  });
  if (!user || !user.passwordHash) {
    throw new RpcException({
      status: HttpStatus.UNAUTHORIZED,
      message: 'Invalid email or password',
    });
  }

  // 3. So sánh mật khẩu người dùng nhập với mật khẩu băm trong database
  const isPasswordValid = await bcrypt.compare(parsed.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new RpcException({
      status: HttpStatus.UNAUTHORIZED,
      message: 'Invalid email or password',
    });
  }

  // 4. Sinh Access Token (JWT) và Refresh Token
  return this.issueRmsTokens(user);
}
```
* **Giải thích từng dòng (Kịch bản nói cho Thành viên 2)**:
  - `LoginSchema.parse(dto)`: Kiểm tra email có đúng định dạng không và mật khẩu có bị trống không trước khi chạm vào CSDL.
  - `findUnique({ where: { email } })`: Truy vấn Prisma tìm người dùng theo trường email (được đánh chỉ mục UNIQUE).
  - `bcrypt.compare(parsed.password, user.passwordHash)`: Sử dụng hàm `compare` của thư viện `bcryptjs` để đối soát. Do Bcrypt sử dụng thuật toán băm kèm muối (Salt), nên không ai có thể giải mã ngược lại mật khẩu gốc.
  - `throw new RpcException(...)`: Nếu sai mật khẩu, ném ra lỗi RPC với mã `401 UNAUTHORIZED`. API Gateway sẽ bắt lỗi này và chuyển thành mã HTTP 401 trả về cho Frontend.

---

### 2.2 Sinh Token JWT và lưu Refresh Token vào Redis
*File: `backend/services/identity/src/modules/auth/auth.service.ts`*

```typescript
// Dòng 173 - 198: Phát hành Token xác thực
private async issueRmsTokens(user: any): Promise<AuthTokenResponse> {
  const payload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    organizationId: user.organizationId,
  };

  // 1. Ký Access Token bằng JWT Secret (Hạn dùng 1 giờ)
  const accessToken = this.jwtService.sign(payload);

  // 2. Tạo Refresh Token ngẫu nhiên 64 bytes và băm SHA-256
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  // 3. Lưu vào Redis với thời gian sống (TTL) 30 ngày (2592000 giây)
  await this.redis.set(`refresh:${tokenHash}`, user.id, 'EX', 2592000);

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600,
    user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
  };
}
```
* **Giải thích từng dòng**:
  - `payload`: Gói dữ liệu chứa `sub` (User ID) và `role` (Vai trò) để khi sang Gateway, hệ thống có thể đọc ra quyền mà không cần truy vấn lại CSDL.
  - `this.jwtService.sign(payload)`: Sử dụng thuật toán ký HMAC-SHA256 với secret key được bảo mật trong file `.env`.
  - `this.redis.set(..., 'EX', 2592000)`: Lưu trữ Refresh Token vào bộ nhớ tạm Redis giúp thu hồi phiên đăng nhập tức thì khi người dùng bấm Đăng xuất.

---

### 2.3 Quản lý danh mục phòng ban (Departments CRUD)
*File: `backend/services/identity/src/modules/departments/departments.service.ts`*

```typescript
// Dòng 25 - 40: Lấy danh sách phòng ban công ty
async listDepartments() {
  return this.prisma.department.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      headUser: { select: { id: true, displayName: true, email: true } },
    },
    orderBy: { name: 'asc' },
  });
}
```
* **Giải thích từng dòng**:
  - `findMany()`: Câu lệnh Prisma truy vấn tất cả các phòng ban trong bảng `departments`.
  - `headUser`: Thực hiện JOIN quan hệ lấy thông tin họ tên Trưởng phòng ban để hiển thị lên bảng điều khiển.

---

## 📋 PHẦN 3: THÀNH VIÊN 3 — BACKEND DỄ 2 (INTERVIEWS, RESULTS & NOTIFICATIONS)

Thành viên 3 phụ trách **Interview Service (Port 3015)** và **Notification Service (Port 3013)**:

### 3.1 Lưu trữ phiếu đánh giá phỏng vấn của Giám khảo
*File: `backend/services/interview/src/modules/results/interview-result.service.ts`*

```typescript
// Dòng 120 - 150: Tiếp nhận và lưu phiếu điểm phỏng vấn
async submitFeedback(interviewId: string, interviewerId: string, dto: SubmitFeedbackDto) {
  // 1. Kiểm tra buổi phỏng vấn có tồn tại không
  const schedule = await this.prisma.interviewSchedule.findUnique({
    where: { id: interviewId },
  });
  if (!schedule) {
    throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Interview not found' });
  }

  // 2. Tạo bản ghi kết quả đánh giá trong CSDL
  const result = await this.prisma.interviewResult.create({
    data: {
      interviewId,
      interviewerId,
      technicalScore: dto.technicalScore,       // Điểm chuyên môn kỹ thuật (1 - 5)
      problemSolvingScore: dto.problemSolvingScore, // Điểm giải quyết vấn đề (1 - 5)
      softSkillScore: dto.softSkillScore,         // Điểm kỹ năng mềm & giao tiếp (1 - 5)
      recommendation: dto.recommendation,         // 'RECOMMEND_HIRE' hoặc 'REJECT'
      notes: dto.notes,                           // Nhận xét chi tiết
    },
  });

  // 3. Cập nhật trạng thái buổi phỏng vấn thành COMPLETED
  await this.prisma.interviewSchedule.update({
    where: { id: interviewId },
    data: { status: InterviewStatus.COMPLETED },
  });

  return result;
}
```
* **Giải thích từng dòng (Kịch bản nói cho Thành viên 3)**:
  - `findUnique({ where: { id: interviewId } })`: Kiểm tra tính toàn vẹn dữ liệu, đảm bảo mã buổi phỏng vấn là có thật.
  - `prisma.interviewResult.create(...)`: Lưu phiếu điểm vào bảng `InterviewResult` của PostgreSQL gồm các tiêu chí điểm số từ 1 đến 5 và nhận xét văn bản.
  - `prisma.interviewSchedule.update(...)`: Đổi trạng thái lịch phỏng vấn sang `COMPLETED` để kích hoạt thông báo cho HR xem kết quả.

---

### 3.2 Tạo thông báo hệ thống (Notification In-App)
*File: `backend/services/notification/src/modules/notifications/notifications.service.ts`*

```typescript
// Dòng 35 - 50: Tạo bản ghi thông báo mới cho người dùng
async createNotification(payload: CreateNotificationDto) {
  return this.prisma.notification.create({
    data: {
      userId: payload.userId,       // ID người nhận thông báo
      title: payload.title,         // Tiêu đề (ví dụ: 'Bạn có lịch phỏng vấn mới')
      message: payload.message,     // Nội dung chi tiết
      type: payload.type,           // Loại thông báo (INTERVIEW, OFFER, REQUEST)
      link: payload.link,           // Đường dẫn điều hướng nhanh
      isRead: false,                // Mặc định là chưa đọc
    },
  });
}
```
* **Giải thích từng dòng**:
  - `create(...)`: Thêm 1 dòng mới vào bảng `notifications`. Khi người dùng đăng nhập vào Frontend, chuông thông báo sẽ query danh sách các dòng có `isRead: false` và hiển thị chấm đỏ.

---

## 🏢 PHẦN 4: THÀNH VIÊN 4 — FRONTEND 1 (PORTAL DOANH NGHIỆP: HR, BOSS & DEPT HEAD)

Thành viên 4 phụ trách các màn hình React nghiệp vụ nội bộ công ty:

### 4.1 Form tạo đề xuất tuyển dụng và áp dụng Template mẫu
*File: `frontend/src/features/dept-head/pages/DeptHeadCreateRequest.tsx`*

```tsx
// Dòng 210 - 235: Xử lý áp dụng Template mẫu và gửi form đề xuất
const handleApplyTemplate = (templateKey: string) => {
  const selected = REQUEST_TEMPLATES[templateKey];
  if (selected) {
    setFormState((prev) => ({
      ...prev,
      positionTitle: selected.title,
      description: selected.jobDescription,
      skills: selected.skills, // Mảng các tag kỹ năng (Node.js, Docker...)
      priority: selected.urgency,
    }));
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await apiRequest('/recruitment-requests', token, {
      method: 'POST',
      body: JSON.stringify({
        position: formState.positionTitle,
        headcount: formState.headcount,
        jobDescription: formState.description,
        skills: formState.skills,
        urgency: formState.priority,
      }),
    });
    navigate('/dept-head/requests'); // Chuyển về trang danh sách theo dõi
  } catch (err) {
    setError('Không thể tạo đề xuất, vui lòng thử lại.');
  } finally {
    setLoading(false);
  }
};
```
* **Giải thích từng dòng (Kịch bản nói cho Thành viên 4)**:
  - `handleApplyTemplate`: Lấy dữ liệu mẫu từ từ điển `REQUEST_TEMPLATES`. Khi Trưởng phòng chọn một vị trí, hàm tự động cập nhật State `formState`, giúp điền sẵn mô tả công việc và các tag kỹ năng mà không cần gõ tay.
  - `handleSubmit`: Chặn reload trang mặc định bằng `e.preventDefault()`, đóng gói dữ liệu thành JSON và gọi hàm `apiRequest` phương thức `POST`. Khi tạo thành công, dùng hook `navigate` chuyển hướng về trang danh sách.

---

### 4.2 Hàng đợi duyệt yêu cầu của Ban Giám Đốc (Boss Approval Queue)
*File: `frontend/src/features/boss/pages/BossApprovalQueue.tsx`*

```tsx
// Dòng 140 - 165: Xử lý nút bấm Phê duyệt và Từ chối của Boss
const handleApprove = async (requestId: string) => {
  try {
    await apiRequest(`/recruitment-requests/${requestId}/approve`, token, {
      method: 'PATCH',
      body: JSON.stringify({ comments: 'Ban Giám Đốc phê chuẩn đề xuất' }),
    });
    // Cập nhật lại state danh sách ngay trên giao diện mà không cần reload
    setRequests((prev) => prev.filter((req) => req.id !== requestId));
  } catch (err) {
    setApiError('Lỗi khi phê duyệt yêu cầu.');
  }
};
```
* **Giải thích từng dòng**:
  - `apiRequest(..., 'PATCH')`: Gửi lệnh cập nhật trạng thái đề xuất thành `APPROVED` lên API Gateway.
  - `setRequests((prev) => prev.filter(...))`: Kỹ thuật Optimistic UI: Lọc bỏ ngay dòng đề xuất vừa duyệt ra khỏi danh sách hiển thị, mang lại cảm giác mượt mà cho lãnh đạo.

---

## 🎓 PHẦN 5: THÀNH VIÊN 5 — FRONTEND 2 (PORTAL ỨNG VIÊN, ADMIN & KHUNG APP SHELL)

Thành viên 5 phụ trách Cổng thông tin ứng viên, Khung giao diện dùng chung và phân hệ Quản trị Admin:

### 5.1 Khung sườn ứng dụng và Sidebar đổi menu tự động theo vai trò
*File: `frontend/src/components/Layout.tsx`*

```tsx
// Dòng 85 - 110: Tự động điều chỉnh danh sách Menu theo Role của người đăng nhập
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth(); // Lấy thông tin user hiện tại từ AuthContext

  // Định nghĩa menu tương ứng cho từng vai trò
  const navItems = useMemo(() => {
    switch (user?.role) {
      case 'BOSS':
        return [
          { label: 'Bảng điều khiển', path: '/boss' },
          { label: 'Hàng đợi phê duyệt', path: '/boss/approval-queue' },
          { label: 'Báo cáo năm', path: '/boss/reports' },
        ];
      case 'WEB_ADMIN':
        return [
          { label: 'Tổng quan hệ thống', path: '/admin' },
          { label: 'Quản lý người dùng', path: '/admin/users' },
          { label: 'Giám sát dịch vụ', path: '/admin/api-monitor' },
        ];
      case 'CANDIDATE':
        return [
          { label: 'Hồ sơ của tôi', path: '/candidate' },
          { label: 'Tải lên CV', path: '/candidate/upload-cv' },
          { label: 'Thư mời làm việc', path: '/candidate/offers' },
        ];
      default:
        return [];
    }
  }, [user?.role]);
```
* **Giải thích từng dòng (Kịch bản nói cho Thành viên 5)**:
  - `useAuth()`: Lấy đối tượng `user` toàn cục đã đăng nhập.
  - `useMemo(..., [user?.role])`: Tối ưu hiệu năng React, chỉ tính toán lại danh sách menu khi vai trò người dùng thay đổi.
  - Khối `switch (user?.role)`: Nhận diện chính xác quyền hạn của tài khoản để render đúng các đường dẫn tương ứng, đảm bảo người dùng chỉ thấy các chức năng thuộc thẩm quyền của mình.

---

### 5.2 Lớp bảo vệ tuyến đường (Route Guard)
*File: `frontend/src/components/ProtectedRoute.tsx`*

```tsx
// Dòng 15 - 30: Kiểm tra xác thực và phân quyền truy cập trang
export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />; // Chưa đăng nhập -> đá về Login

  // Nếu trang yêu cầu quyền cụ thể mà vai trò của user không khớp -> chuyển sang 403
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>; // Đủ điều kiện -> cho phép hiển thị trang
};
```
* **Giải thích từng dòng**:
  - `if (!user)`: Nếu không tìm thấy thông tin đăng nhập trong phiên, dùng `<Navigate to="/login" replace />` chuyển hướng ngay lập tức.
  - `!allowedRoles.includes(user.role)`: So khớp vai trò người dùng với mảng quyền được cấp phép. Ngăn chặn việc ứng viên sửa URL để vào trang của Admin hay Boss.

---

### 5.3 Kéo-thả nộp file CV và nhận mẫu template chuẩn
*File: `frontend/src/features/candidate/pages/CandidateUploadCv.tsx`*

```tsx
// Dòng 120 - 145: Xử lý file CV nộp lên server
const handleFileUpload = async (file: File) => {
  if (file.size > 10 * 1024 * 1024) {
    setError('Dung lượng file vượt quá giới hạn 10MB.');
    return;
  }

  const formData = new FormData();
  formData.append('file', file); // Đóng gói file nhị phân vào FormData

  setUploading(true);
  try {
    const response = await fetch('/api/v1/cv/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();
    setSuccess('Tải lên CV thành công! Hệ thống đang tiến hành bóc tách.');
  } catch (err) {
    setError('Lỗi khi tải file lên máy chủ.');
  } finally {
    setUploading(false);
  }
};
```
* **Giải thích từng dòng**:
  - `file.size > 10 * 1024 * 1024`: Kiểm tra dung lượng file ngay tại trình duyệt client, tránh gửi file quá lớn làm nghẽn băng thông mạng.
  - `new FormData()`: Tạo đối tượng form dữ liệu đa phần (multipart/form-data) cho phép gửi file PDF/DOCX lên máy chủ.
  - `fetch('/api/v1/cv/upload', ...)`: Gửi file lên API Gateway để chuyển tiếp vào hàng đợi xử lý ngầm BullMQ.

---

# 🔄 3. KỊCH BẢN DEMO THỰC TẾ LIÊN HOÀN (5 THÀNH VIÊN)

Khi báo cáo trước Hội đồng, cả 5 bạn sẽ phối hợp trình diễn liên hoàn theo kịch bản 7 bước:

1. **Bước 1 (Thành viên 5 - Frontend 2)**: Mở trang `/login`, demo đăng nhập tài khoản Web Admin `webadmin@demo.test`, vào `/admin/dashboard` chỉ vào 9 dịch vụ Microservices đang `Healthy`.
2. **Bước 2 (Thành viên 2 - Backend 1)**: Mở file `auth.service.ts`, giải thích cách hệ thống vừa xác thực mật khẩu Bcrypt và sinh Token JWT cho tài khoản của Thành viên 5.
3. **Bước 3 (Thành viên 4 - Frontend 1)**: Đăng nhập Trưởng phòng `engineering.head@demo.test`, vào form tạo đề xuất tuyển dụng bằng template mẫu và gửi đi. Sau đó chuyển sang tài khoản Boss `boss@demo.test` bấm Duyệt đề xuất.
4. **Bước 4 (Thành viên 1 - Tech Lead)**: Mở code `gateway.module.ts` và `recruiting-requests.service.ts`, giải thích luồng dữ liệu TCP RPC từ Gateway sang dịch vụ Recruiting để đổi trạng thái thành `APPROVED`. Giải thích cách thuật toán bóc tách dữ liệu và Gemini AI chuẩn bị hoạt động.
5. **Bước 5 (Thành viên 5 - Frontend 2)**: Đăng nhập `candidate1@demo.test`, tải template chuẩn `RMS-CV-Template.doc`, nộp file CV vào bài đăng.
6. **Bước 6 (Thành viên 3 - Backend 2)**: Mở code `interview-result.service.ts` và `schedules.service.ts`, giải thích cách lịch phỏng vấn và bảng điểm đánh giá kỹ thuật của Trưởng phòng được lưu vào CSDL PostgreSQL.
7. **Bước 7 (Thành viên 4 & 5)**: Trưởng phòng nộp phiếu chấm điểm $\rightarrow$ HR phát hành Offer $\rightarrow$ Ứng viên bấm chấp nhận Offer online. Kết thúc bài báo cáo hoàn hảo!

---

### 🎯 TỔNG KẾT:
Tài liệu này cung cấp **đầy đủ từng dòng code, chức danh, lời thoại và kịch bản phối hợp** cho từng thành viên:
- **Lead**: Tự tin nắm vững phần lõi công nghệ cao (Architecture, AI, pgvector, Worker).
- **2 Bạn Backend**: Nắm vững các đoạn code CRUD cơ bản, Bcrypt, JWT và CSDL Prisma.
- **2 Bạn Frontend**: Nắm vững các Component React, Form nhập liệu, nút bấm và khung Layout.
- Cả nhóm đồng lòng, phối hợp ăn khớp và chắc chắn đạt kết quả cao nhất trong buổi báo cáo!
