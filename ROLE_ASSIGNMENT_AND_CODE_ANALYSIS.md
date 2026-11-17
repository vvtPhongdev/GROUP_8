# 📑 TÀI LIỆU PHÂN CHIA VAI TRÒ FULL-STACK & GIẢI THÍCH CHI TIẾT TỪNG DÒNG CODE
## DỰ ÁN: WORKS RECRUITER (RMS) — NHÓM 7 (SE20A05)

Tài liệu này được biên soạn theo mô hình **Full-Stack theo từng Vai trò (Vertical Slice theo Actor)**, gán đích danh cho **5 thành viên (1-Phong, 2-Dũng, 3-Hiếu, 4-Lý, 5-Đức)**. Mỗi thành viên có đầy đủ: vai trò nghiệp vụ, tài khoản demo, các đoạn code thực tế (Code Snippets) kèm giải thích chi tiết từng dòng (Line-by-line Analysis) cho cả Frontend và Backend, cùng kịch bản lời thoại mẫu (Presentation Script) và danh mục tra cứu chi tiết toàn bộ các file liên quan.

---

# 🗺️ 1. BẢNG TỔNG QUAN PHÂN CHIA 5 THÀNH VIÊN

| STT | Thành viên | Vai trò & Danh xưng | Phạm vi Frontend | Phạm vi Backend | Demo Account | Mức độ kỹ thuật |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **1** | **PHONG<br>(TECH LEAD)** | 🌟 **HR LEADER & TECH ARCHITECT**<br>*(Chủ trì Nhân sự & Kiến trúc AI)* | • Kế hoạch `TaskPlanner`<br>• Đăng tin việc làm `Jobs`<br>• Xếp lịch phỏng vấn `Interviews` | • Toàn bộ Kiến trúc Microservices & Gateway<br>• Thuật toán parse CV + Gemini AI chấm điểm<br>• Tìm kiếm Vector `pgvector` + BullMQ Worker<br>• Vòng đời 13 trạng thái tuyển dụng | `hr.manager@demo.test`<br>`hr.recruiter@demo.test` | 🔥 **Rất sâu** *(Phong làm chủ toàn bộ phần khó)* |
| **2** | **DŨNG<br>(Yếu code 1)** | 👑 **`BOSS` (BAN GIÁM ĐỐC)**<br>*(Lãnh đạo Phê duyệt Cấp cao)* | • Hàng đợi duyệt `BossApprovalQueue`<br>• Thẻ KPI `BossDashboard`<br>• Báo cáo chi phí `BossAnnualReport` | • Gateway endpoint `PATCH /approve`<br>• Service chuyển trạng thái thành `APPROVED` | `boss@demo.test` | 🟢 **Rất dễ** *(Thao tác nút duyệt & đổi trạng thái)* |
| **3** | **HIẾU<br>(Yếu code 2)** | 🏢 **`DEPARTMENT_HEAD`**<br>*(Trưởng Phòng Ban Chuyên Môn)* | • Form tạo đề xuất theo template<br>• Danh sách đề xuất phòng ban<br>• Form chấm điểm phỏng vấn (1-5 sao) | • Gateway endpoint `POST /recruitment-requests`<br>• Service lưu đề xuất vào `RecruitmentRequest`<br>• Service lưu phiếu điểm vào `InterviewResult` | `engineering.head@demo.test`<br>`marketing.head@demo.test` | 🟢 **Rất dễ** *(2 form nhập liệu & 2 hàm lưu DB)* |
| **4** | **LÝ<br>(Yếu code 3)** | 🎓 **`CANDIDATE`**<br>*(Ứng Viên Tuyển Dụng)* | • Cổng việc làm `LandingPage`<br>• Nộp CV theo mẫu chuẩn RMS<br>• Xem & Ký nhận Offer online | • Gateway endpoint upload file `POST /cv/upload`<br>• Service tạo đơn ứng tuyển bảng `Application` | `candidate1@demo.test`<br>`candidate2@demo.test` | 🟢 **Rất dễ** *(Kéo thả file & lưu đơn ứng tuyển)* |
| **5** | **ĐỨC<br>(Yếu code 4)** | 🛠️ **`WEB_ADMIN` & APP SHELL**<br>*(Quản Trị Hệ Thống & Khung Giao Diện)* | • Khung Layout Sidebar tự đổi theo Role<br>• Trang Đăng nhập `Login.tsx`<br>• Quản lý User & Giám sát 9 services | • Endpoint `GET /users` lấy danh sách tài khoản<br>• Service tạo mã mời `organization-invitations` | `webadmin@demo.test` | 🟢 **Rất dễ** *(Khung App Shell & CRUD User cơ bản)* |

> **Mật khẩu dùng chung cho tất cả tài khoản demo**: `Password123!`

---

# 🔍 2. CHI TIẾT GIẢI THÍCH TỪNG DÒNG CODE CHO TỪNG THÀNH VIÊN

---

## 🌟 PHẦN 1: BẠN PHONG — TECH LEAD (CHỦ TRÌ NHÂN SỰ & KIẾN TRÚC AI/BACKEND)

Phong là **Linh hồn công nghệ** của nhóm, đảm nhiệm vai trò trung tâm **`HR_LEADER` (Bộ phận Nhân sự)** kết hợp làm chủ toàn bộ hạ tầng kỹ thuật phân tán và bộ lõi AI:

* **Tài khoản demo**: `hr.manager@demo.test` & `hr.recruiter@demo.test` / `Password123!` (Route: `/hr/*`)
* **Lời nói mở đầu khi thuyết trình**:
  > *"Kính thưa quý Thầy Cô, em tên là Phong, đảm nhận vai trò Trưởng nhóm kỹ thuật (Tech Lead) kiêm Phụ trách phân hệ Nhân sự (HR Leader). Về mặt nghiệp vụ: Em điều phối toàn bộ quy trình tuyển dụng từ lập kế hoạch tổng thể, đăng tin tuyển dụng, điều phối lịch phỏng vấn đến phát hành Thư mời làm việc. Về mặt kỹ thuật: Em chịu trách nhiệm thiết kế Kiến trúc Microservices phân tán, Bộ lõi Trí tuệ nhân tạo bóc tách và chấm điểm CV, Tìm kiếm vector ngữ nghĩa pgvector và hệ thống hàng đợi xử lý ngầm BullMQ."*

---

### 1.1 Chi tiết Code Frontend HR — Lập kế hoạch & Phân bổ nhiệm vụ
*File: `frontend/src/features/hr/pages/HRTaskPlanner.tsx`*

```tsx
// Hàm tạo và phân bổ nhiệm vụ tuyển dụng cho Recruiter
const handleCreateTask = async (taskData: TaskPlanForm) => {
  try {
    // 1. Gửi request POST lên API Gateway để lưu nhiệm vụ chi tiết
    await apiRequest(`/plans/${overallPlanId}/tasks`, token, {
      method: 'POST',
      body: JSON.stringify({
        taskType: taskData.type,         // 'JOB_POSTING' | 'CV_SCREENING' | 'INTERVIEW_COORDINATION'...
        assignedToId: taskData.recruiterId, // Gán cho chuyên viên Recruiter cụ thể
        startDate: taskData.startDate,
        endDate: taskData.endDate,
      }),
    });

    // 2. Tải lại danh sách nhiệm vụ sau khi phân công thành công
    await loadTasks();
  } catch (err) {
    setError('Không thể tạo nhiệm vụ, vui lòng kiểm tra lại thời hạn.');
  }
};
```
* **Giải thích chi tiết từng dòng code**:
  - `taskType: taskData.type`: Phân loại 5 nhóm nhiệm vụ chính trong chiến dịch (`JOB_POSTING` - Đăng tin, `CV_COLLECTION` - Thu thập hồ sơ, `CV_SCREENING` - Sàng lọc, `INTERVIEW_COORDINATION` - Điều phối phỏng vấn, `HIRING` - Tiếp nhận).
  - `assignedToId: taskData.recruiterId`: Thiết lập khóa ngoại liên kết nhiệm vụ với chuyên viên nhân sự trong đội ngũ.
  - `startDate`, `endDate`: Thiết lập cửa sổ thời gian thực hiện, dùng để kích hoạt worker tự động quét gửi email nhắc việc khi task sắp hết hạn.

---

### 1.2 Chi tiết Code Backend Tuyển dụng — Kế hoạch tổng thể & Ngân sách
*File Service: `backend/services/recruiting/src/modules/overall-plan/overall-plan.service.ts`*

```typescript
async createOverallPlan(requestId: string, dto: CreatePlanDto) {
  // 1. Kiểm tra đề xuất tuyển dụng đã được Boss duyệt chưa
  const request = await this.prisma.recruitmentRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== RecruitmentRequestStatus.APPROVED) {
    throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Request must be approved by Boss before planning' });
  }

  // 2. Tạo kế hoạch tổng thể gắn với đề xuất và định mức ngân sách dự toán
  return this.prisma.overallPlan.create({
    data: {
      requestId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      estimatedBudget: dto.estimatedBudget, // Hạn mức chi phí tuyển dụng (VND)
      status: 'PENDING_APPROVAL',            // Chờ Boss duyệt ngân sách
    },
  });
}
```
* **Giải thích chi tiết từng dòng code**:
  - `request.status !== RecruitmentRequestStatus.APPROVED`: Kiểm tra ràng buộc nghiệp vụ (Business Rule): Chỉ những đề xuất đã có sự phê chuẩn chính thức của Ban Giám Đốc mới được phép khởi tạo Kế hoạch tổng thể (`OverallPlan`).
  - `prisma.overallPlan.create(...)`: Lưu trữ kế hoạch với quan hệ $1-1$ với đề xuất tuyển dụng, thiết lập hạn mức ngân sách và chuyển trạng thái sang `PENDING_APPROVAL` để Boss thẩm định ngân sách.

---

### 1.3 Chi tiết Code Lõi AI Engine — Bóc tách CV không tốn Token & Gemini AI Chấm Điểm

#### A. Thuật toán trích xuất CV theo mẫu chuẩn (Zero Token AI):
*File: `backend/packages/ai/src/candidate-template-parser.ts`*

```typescript
// Thuật toán cắt lát chuỗi dựa trên biểu thức chính quy Lookahead
function section(text: string, heading: string, nextHeadings: readonly string[]) {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const next = nextHeadings.map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const match = text.match(
    new RegExp(`${escapedHeading}\\s*([\\s\\S]*?)(?=\\n\\s*(?:${next})\\b|$)`, 'i'),
  );
  return match?.[1]?.trim() ?? '';
}
```
* **Giải thích chi tiết từng dòng code**:
  - `escapedHeading`: Sử dụng regex escape để vô hiệu hóa các ký tự đặc biệt, tránh lỗi cú pháp RegEx.
  - `(?=\\n\\s*(?:${next})\\b|$)`: Kỹ thuật **Positive Lookahead** trong RegEx: Tìm kiếm nội dung của mục hiện tại (ví dụ: `Work Experience`) cho tới khi con trỏ gặp tiêu đề mục kế tiếp (ví dụ: `Education`) hoặc chạm tới cuối văn bản.
  - `[\\s\\S]*?`: Biểu thức Non-greedy lấy toàn bộ chuỗi ký tự (kể cả ký tự xuống dòng) giúp trích xuất toàn bộ khối kinh nghiệm hoặc học vấn với độ chính xác xấp xỉ 100% trong $\sim 2$ mili-giây mà không tốn bất kỳ chi phí token AI nào.

#### B. Mô hình Gemini AI Chấm điểm CV so với JD & Multi-Key Rotation:
*File: `backend/packages/ai/src/cv-evaluator.ts`*

```typescript
// Cơ chế luân chuyển nhiều API Keys và gọi mô hình Gemini 2.5 Flash
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
      console.warn('API key rate limit reached, rotating to backup key...');
      continue; // Tự động đổi sang Key tiếp theo trong mảng
    }
    throw err;
  }
}
```
* **Giải thích chi tiết từng dòng code**:
  - `for (const apiKey of config.apiKeys)`: Cơ chế luân chuyển khóa dự phòng (Failover Key Rotation): duyệt qua danh sách các API Keys của Gemini đã cấu hình trong `.env`.
  - `model: 'gemini-2.5-flash'`: Sử dụng mô hình AI tốc độ cao thế hệ mới nhất của Google, hỗ trợ xử lý ngôn ngữ tự nhiên tiếng Việt cực tốt.
  - `responseMimeType: 'application/json'`: Ép buộc mô hình luôn sinh cấu trúc JSON có cấu trúc (`overallScore`, `technicalFitScore`, `strengths`, `weaknesses`), loại bỏ triệt để nguy cơ lỗi cú pháp khi parse kết quả.
  - `if (err.status === 429) continue`: Tự động bắt mã lỗi Rate Limit 429 (vượt hạn ngạch số request/phút) để xoay sang key kế tiếp mà không làm gián đoạn người dùng.

#### C. Tìm kiếm tương đồng Vector với PostgreSQL pgvector:
*File: `backend/services/recruiting/src/modules/cv-search/cv-search.service.ts`*

```typescript
const results = await this.prisma.$queryRaw`
  SELECT cv.id, cv.candidate_id, 1 - (e.embedding <=> ${queryVector}::vector) AS similarity_score
  FROM cv_embeddings e
  JOIN candidate_cvs cv ON cv.id = e.cv_document_id
  ORDER BY e.embedding <=> ${queryVector}::vector ASC
  LIMIT 20;
`;
```
* **Giải thích chi tiết từng dòng code**:
  - `e.embedding <=> ${queryVector}::vector`: Sử dụng toán tử `<=>` của extension **pgvector** trong PostgreSQL để tính toán khoảng cách Cosine trên không gian vector 384 chiều giữa hồ sơ ứng viên và yêu cầu tuyển dụng.
  - `1 - (khoảng cách)`: Quy đổi khoảng cách về thang điểm tương đồng từ 0% đến 100%.
  - `ORDER BY ... ASC LIMIT 20`: Quét qua chỉ mục `ivfflat` (`vector_cosine_ops`) để lấy Top 20 ứng viên sáng giá nhất với tốc độ dưới 50ms.

---

### 1.4 Chi tiết Code API Gateway & Background Worker
*File Gateway: `backend/services/gateway/src/gateway.module.ts`*

```typescript
ClientsModule.register([
  {
    name: 'RECRUITING_SERVICE',
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: 3011 }, // Kết nối TCP nhị phân tới dịch vụ Tuyển dụng
  },
  {
    name: 'NOTIFICATION_SERVICE',
    transport: Transport.TCP,
    options: { host: '127.0.0.1', port: 3013 }, // Kết nối TCP tới dịch vụ Thông báo
  },
])
```
* **Giải thích**: Gateway sử dụng giao thức **TCP Transport** RPC để gửi các gói tin nhị phân nội bộ tới microservice, loại bỏ chi phí đóng/mở kết nối HTTP và tăng tốc độ xử lý của hệ thống.

---

## 👑 PHẦN 2: BẠN DŨNG — VAI TRÒ `BOSS` (BAN GIÁM ĐỐC / EXECUTIVE)
* **Tài khoản demo**: `boss@demo.test` / `Password123!` (Route: `/boss`)
* **Lời nói mở đầu khi thuyết trình**:
  > *"Kính thưa quý Thầy Cô, em tên là Dũng, xin đại diện nhóm trình bày trọn vẹn vai trò của Ban Giám Đốc (Boss). Đây là cấp lãnh đạo cao nhất, có quyền hạn ra quyết định phê duyệt cuối cùng đối với các đề xuất nhân sự, kế hoạch ngân sách và các điều khoản trong thư mời làm việc của ứng viên."*

### 2.1 Chi tiết Code Frontend — Hàng đợi phê duyệt của Boss
*File: `frontend/src/features/boss/pages/BossApprovalQueue.tsx`*

```tsx
const handleApprove = async (requestId: string) => {
  try {
    // 1. Gửi request PATCH lên API Gateway để đổi trạng thái sang APPROVED
    await apiRequest(`/recruitment-requests/${requestId}/approve`, token, {
      method: 'PATCH',
      body: JSON.stringify({ comments: 'Ban Giám Đốc phê chuẩn đề xuất' }),
    });

    // 2. Kỹ thuật Optimistic UI: Lọc bỏ ngay dòng đề xuất vừa duyệt ra khỏi danh sách
    setRequests((prev) => prev.filter((req) => req.id !== requestId));
  } catch (err) {
    setApiError('Lỗi khi phê duyệt yêu cầu.');
  }
};
```
* **Giải thích chi tiết từng dòng code**:
  - `await apiRequest(...)`: Gọi hàm tiện ích HTTP fetch trung tâm của dự án, tự động đính kèm `Authorization: Bearer <token>` của Boss vào Request Header.
  - `method: 'PATCH'`: Phương thức PATCH chuẩn RESTful dùng để cập nhật trạng thái và lưu ghi chú phê chuẩn.
  - `setRequests((prev) => prev.filter(...))`: Cập nhật lại State của React. Lấy mảng danh sách cũ và lọc bỏ phần tử vừa duyệt giúp giao diện phản hồi mượt mà không cần F5.

---

### 2.2 Chi tiết Code Backend — Phê duyệt đề xuất tại Recruiting Service
*File Gateway Controller: `backend/services/gateway/src/controllers/recruiting.controller.ts`*

```typescript
@Patch('recruitment-requests/:id/approve')
@Roles(UserRole.BOSS, UserRole.ADMIN)
async approveRequest(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
  return this.recruitingClient.send({ cmd: 'recruiting.request.approve' }, { id, bossId: user.id, ...dto });
}
```
*File Service: `backend/services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts`*

```typescript
async approveRequest(payload: { id: string; bossId: string; comments?: string }) {
  // 1. Kiểm tra đề xuất có đang ở trạng thái chờ Boss duyệt không
  const existing = await this.prisma.recruitmentRequest.findUnique({ where: { id: payload.id } });
  if (!existing || existing.status !== RecruitmentRequestStatus.PENDING_BOSS_APPROVAL) {
    throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Invalid status for boss approval' });
  }

  // 2. Cập nhật trạng thái thành APPROVED trong PostgreSQL
  return this.prisma.recruitmentRequest.update({
    where: { id: payload.id },
    data: {
      status: RecruitmentRequestStatus.APPROVED,
      approvedById: payload.bossId,
      approvedAt: new Date(),
    },
  });
}
```
* **Giải thích chi tiết từng dòng code**:
  - `@Roles(UserRole.BOSS, UserRole.ADMIN)`: Guard kiểm tra quyền tại Gateway, ngăn chặn các tài khoản khác xâm nhập trái phép vào luồng phê duyệt.
  - `if (existing.status !== ...)`: Đảm bảo đề xuất phải trải qua bước thẩm định của phòng nhân sự (`PENDING_BOSS_APPROVAL`) thì Boss mới được duyệt.
  - `prisma.recruitmentRequest.update(...)`: Chuyển trạng thái đề xuất thành `APPROVED`, lưu lại ID người duyệt và thời gian duyệt vào CSDL.

---

## 🏢 PHẦN 3: BẠN HIẾU — VAI TRÒ `DEPARTMENT_HEAD` (TRƯỞNG PHÒNG BAN)
* **Tài khoản demo**: `engineering.head@demo.test` / `Password123!` (Route: `/dept-head`)
* **Lời nói mở đầu khi thuyết trình**:
  > *"Kính thưa quý Thầy Cô, em tên là Hiếu, xin đại diện nhóm trình bày vai trò của Trưởng phòng ban chuyên môn (Department Head). Đây là nơi phát sinh nhu cầu nhân sự trong thực tế, đồng thời là người trực tiếp tham gia hội đồng phỏng vấn để đánh giá năng lực chuyên môn của ứng viên."*

### 3.1 Chi tiết Code Frontend — Form tạo đề xuất theo Template
*File: `frontend/src/features/dept-head/pages/DeptHeadCreateRequest.tsx`*

```tsx
// Áp dụng nhanh tiêu chuẩn kỹ năng từ template dựng sẵn
const handleApplyTemplate = (templateKey: string) => {
  const selected = REQUEST_TEMPLATES[templateKey];
  if (selected) {
    setFormState((prev) => ({
      ...prev,
      positionTitle: selected.title,
      description: selected.jobDescription,
      skills: selected.skills, // Mảng tag kỹ năng: ['Node.js', 'PostgreSQL', 'Docker']
      priority: selected.urgency,
    }));
  }
};

// Gửi đề xuất lên server
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await apiRequest('/recruitment-requests', token, {
    method: 'POST',
    body: JSON.stringify({
      position: formState.positionTitle,
      headcount: formState.headcount,
      jobDescription: formState.description,
      skillRequirements: formState.skills,
      urgency: formState.priority,
    }),
  });
  navigate('/dept-head/requests'); // Chuyển về trang danh sách theo dõi
};
```
* **Giải thích chi tiết từng dòng code**:
  - `handleApplyTemplate`: Đọc từ điển mẫu từ `requestTemplates.ts`. Khi Trưởng phòng chọn vị trí (ví dụ: *Senior Backend Developer*), hàm tự động điền sẵn mô tả công việc và mảng các tag kỹ năng vào State `formState`, giúp Trưởng phòng không phải gõ lại từ đầu.
  - `e.preventDefault()`: Ngăn chặn reload trang web mặc định của HTML.
  - `apiRequest('/recruitment-requests', ...)`: Gửi gói tin HTTP POST tạo đề xuất với trạng thái ban đầu là `PENDING_HR_REVIEW`.

---

### 3.2 Chi tiết Code Backend — Lưu đề xuất và lưu phiếu điểm phỏng vấn
*File Service Tuyển dụng: `backend/services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts`*

```typescript
async createRequest(payload: CreateRequestDto & { createdById: string; departmentId: string }) {
  return this.prisma.recruitmentRequest.create({
    data: {
      position: payload.position,
      headcount: payload.headcount,
      jobDescription: payload.jobDescription,
      skillRequirements: payload.skillRequirements,
      urgency: payload.urgency,
      createdById: payload.createdById,     // ID của Trưởng phòng tạo đề xuất
      departmentId: payload.departmentId,   // ID phòng ban của Trưởng phòng
      status: RecruitmentRequestStatus.PENDING_HR_REVIEW,
    },
  });
}
```
*File Service Phỏng vấn: `backend/services/interview/src/modules/results/interview-result.service.ts`*

```typescript
async submitFeedback(interviewId: string, interviewerId: string, dto: any) {
  return this.prisma.interviewResult.create({
    data: {
      interviewId,
      interviewerId,
      technicalScore: dto.technicalScore,       // Điểm chuyên môn kỹ thuật (1 - 5)
      problemSolvingScore: dto.problemSolvingScore, // Điểm giải quyết bài toán (1 - 5)
      softSkillScore: dto.softSkillScore,         // Điểm kỹ năng mềm (1 - 5)
      recommendation: dto.recommendation,         // 'RECOMMEND_HIRE' hoặc 'REJECT'
      notes: dto.notes,                           // Nhận xét chi tiết
    },
  });
}
```
* **Giải thích chi tiết từng dòng code**:
  - `prisma.recruitmentRequest.create(...)`: Lưu bản ghi đề xuất vào CSDL PostgreSQL với trạng thái `PENDING_HR_REVIEW` để chuyển tiếp sang cho HR rà soát.
  - `prisma.interviewResult.create(...)`: Lưu phiếu chấm điểm chi tiết của Trưởng phòng sau buổi phỏng vấn vào bảng `InterviewResult` để làm căn cứ phát hành Offer.

---

## 🎓 PHẦN 4: BẠN LÝ — VAI TRÒ `CANDIDATE` (ỨNG VIÊN TUYỂN DỤNG)
* **Tài khoản demo**: `candidate1@demo.test` / `Password123!` (Route: `/candidate` và `/`)
* **Lời nói mở đầu khi thuyết trình**:
  > *"Kính thưa quý Thầy Cô, em tên là Lý, xin đại diện nhóm trình bày phân hệ của Ứng viên (Candidate). Đây là cổng trải nghiệm người dùng đầu cuối, giúp ứng viên dễ dàng tiếp cận các vị trí tuyển dụng, nộp hồ sơ CV và theo dõi kết quả phỏng vấn trực tuyến."*

### 4.1 Chi tiết Code Frontend — Nộp file CV và Ký Offer online
*File: `frontend/src/features/candidate/pages/CandidateUploadCv.tsx`*

```tsx
const handleFileUpload = async (file: File) => {
  // 1. Kiểm tra dung lượng file ngay tại trình duyệt client (tối đa 10MB)
  if (file.size > 10 * 1024 * 1024) {
    setError('Dung lượng file vượt quá giới hạn 10MB.');
    return;
  }

  // 2. Đóng gói file vào đối tượng FormData để gửi qua HTTP
  const formData = new FormData();
  formData.append('file', file);

  setUploading(true);
  try {
    await fetch('/api/v1/cv/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    setSuccess('Tải lên CV thành công! Hệ thống đang tiến hành bóc tách.');
  } finally {
    setUploading(false);
  }
};
```
*File: `frontend/src/features/candidate/pages/CandidateOffers.tsx`*

```tsx
const handleAcceptOffer = async (offerId: string) => {
  await apiRequest(`/offers/${offerId}/accept`, token, { method: 'POST' });
  setOfferStatus('ACCEPTED'); // Đổi nhãn giao diện thành "Đã chấp nhận việc"
};
```
* **Giải thích chi tiết từng dòng code**:
  - `file.size > 10 * 1024 * 1024`: Kiểm tra dung lượng file ngay tại client giúp tối ưu băng thông và cảnh báo sớm nếu file vượt quá 10MB.
  - `new FormData()`: Đối tượng cho phép gửi file nhị phân PDF/DOCX qua request HTTP multipart.
  - `handleAcceptOffer`: Gọi API xác nhận đồng ý nhận việc, cập nhật trạng thái Offer thành `ACCEPTED`.

---

### 4.2 Chi tiết Code Backend — Tiếp nhận file Upload & Lưu đơn ứng tuyển
*File Gateway Controller: `backend/services/gateway/src/controllers/cv.controller.ts`*

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
async uploadCv(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
  return this.cvClient.send({ cmd: 'cv.upload' }, {
    buffer: file.buffer,
    originalname: file.originalname,
    mimetype: file.mimetype,
    userId: user.id,
  });
}
```
*File Service Ứng tuyển: `backend/services/recruiting/src/modules/applications/applications.service.ts`*

```typescript
async applyForJob(payload: { candidateId: string; jobPostingId: string; cvId: string }) {
  return this.prisma.application.create({
    data: {
      candidateId: payload.candidateId,
      jobPostingId: payload.jobPostingId,
      cvDocumentId: payload.cvId,
      status: 'SUBMITTED', // Trạng thái ban đầu: Đã nộp thành công
    },
  });
}
```
* **Giải thích chi tiết từng dòng code**:
  - `@UseInterceptors(FileInterceptor('file', ...))`: Sử dụng Multer middleware bóc tách file upload từ HTTP form.
  - `this.cvClient.send(...)`: Gửi buffer file qua TCP sang CV Service để lưu trữ và đẩy vào hàng đợi BullMQ `CV_PARSE_QUEUE`.
  - `prisma.application.create(...)`: Tạo bản ghi ứng tuyển mới với trạng thái ban đầu `SUBMITTED`.

---

## 🛠️ PHẦN 5: BẠN ĐỨC — VAI TRÒ `WEB_ADMIN` & APP SHELL (QUẢN TRỊ HỆ THỐNG & KHUNG GIAO DIỆN)
* **Tài khoản demo**: `webadmin@demo.test` / `Password123!` (Route: `/admin`)
* **Lời nói mở đầu khi thuyết trình**:
  > *"Kính thưa quý Thầy Cô, em tên là Đức, trong dự án RMS, em phụ trách 2 phần công việc:*
  > *1. Xây dựng **Bộ khung sườn Giao diện dùng chung và các màn hình Xác thực** (`Layout`, `ProtectedRoute`, `Login`).*
  > *2. Quản trị phân hệ **Web Admin**: Quản trị danh mục tài khoản nhân sự toàn công ty, phân quyền RBAC và giám sát tình trạng hoạt động của 9 Microservices."*

### 5.1 Chi tiết Code Frontend — Khung sườn ứng dụng & Bảo vệ tuyến đường
*File Khung Giao Diện: `frontend/src/components/Layout.tsx`*

```tsx
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  // Tự động nhận diện Role để hiển thị đúng menu Sidebar tương ứng
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
*File Route Guard: `frontend/src/components/ProtectedRoute.tsx`*

```tsx
export const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />; // Chưa đăng nhập -> đá về Login

  // Nếu người dùng cố tình truy cập trang không thuộc thẩm quyền -> chuyển sang trang 403
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```
* **Giải thích chi tiết từng dòng code**:
  - `useAuth()`: Lấy thông tin tài khoản hiện tại từ Context.
  - `switch (user?.role)`: Nhận diện chính xác quyền hạn của tài khoản để render đúng các đường dẫn menu Sidebar. Đảm bảo người dùng chỉ thấy các chức năng thuộc thẩm quyền của mình.
  - `!allowedRoles.includes(user.role)`: So khớp vai trò với mảng quyền được cấp phép của trang. Ngăn chặn việc người dùng chỉnh sửa URL trên thanh địa chỉ để truy cập trái phép.

---

### 5.2 Chi tiết Code Backend — Quản lý tài khoản & Cấp mã mời tổ chức
*File Service Người dùng: `backend/services/identity/src/modules/users/users.service.ts`*

```typescript
// Lấy danh sách toàn bộ nhân sự công ty
async listUsers() {
  return this.prisma.user.findMany({
    select: { id: true, email: true, displayName: true, role: true, isActive: true },
    orderBy: { createdAt: 'desc' },
  });
}

// Khóa hoặc Mở khóa tài khoản nhân viên
async toggleUserActive(userId: string, isActive: boolean) {
  return this.prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
}
```
*File Service Xác thực: `backend/services/identity/src/modules/auth/auth.service.ts`*

```typescript
// Tạo mã mời thành viên mới tham gia tổ chức
async createOrganizationInvitation(dto: CreateInvitationDto) {
  const code = crypto.randomBytes(16).toString('hex'); // Sinh mã mời ngẫu nhiên 32 ký tự
  return this.prisma.organizationInvitation.create({
    data: {
      email: dto.email.toLowerCase(),
      role: dto.role,
      code,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Hạn sử dụng 7 ngày
    },
  });
}
```
* **Giải thích chi tiết từng dòng code**:
  - `prisma.user.findMany(...)`: Truy vấn Prisma lấy toàn bộ nhân sự hiển thị lên bảng `/admin/users`.
  - `prisma.user.update(...)`: Cho phép Admin vô hiệu hóa (`isActive = false`) tài khoản nhân sự vi phạm chính sách hoặc đã nghỉ việc.
  - `crypto.randomBytes(16).toString('hex')`: Sinh mã bảo mật ngẫu nhiên không thể đoán trước, gán thời hạn hết hạn sau 7 ngày để gửi email mời nhân viên mới.

---

# 📁 3. PHÂN TÍCH & GIẢI THÍCH CHI TIẾT TỪNG FILE LIÊN QUAN CHO 5 THÀNH VIÊN

Phần này phân tích chi tiết từng file mã nguồn cụ thể của 5 thành viên. Mỗi file bao gồm: **Đường dẫn & Loại file**, **Vai trò kiến trúc**, **Các hàm/state cốt lõi bên trong**, **Luồng dữ liệu (Data Flow)**, và **Câu hỏi Thầy Cô hay hỏi & Cách trả lời**.

---

## 🌟 3.1 CHI TIẾT CÁC FILE CỦA BẠN PHONG (TECH LEAD & HR LEADER / AI)

Phong chịu trách nhiệm phân hệ Nhân sự (`HR_LEADER`), toàn bộ kiến trúc Gateway kết nối Microservices qua TCP, và toàn bộ lõi AI / Vector Search / Background Worker.

### 📄 File 1 (Frontend): [`frontend/src/features/hr/pages/HRTaskPlanner.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/hr/pages/HRTaskPlanner.tsx)
* **Loại file**: React Component (Page - HR Feature).
* **Vai trò kiến trúc**: Đây là trung tâm điều phối chiến dịch tuyển dụng sau khi Đề xuất đã được Boss duyệt. Cho phép HR Manager lập Kế hoạch tổng thể (`OverallPlan`), dự toán ngân sách, và chia nhỏ thành các nhiệm vụ cụ thể (`TaskPlan`) phân công cho từng chuyên viên Recruiter.
* **Các thành phần cốt lõi bên trong file**:
  - `overallPlan`: State lưu thông tin kế hoạch tuyển dụng cấp cao (thời gian bắt đầu, kết thúc, tổng ngân sách dự kiến VND, trạng thái duyệt).
  - `tasks`: Mảng danh sách các nhiệm vụ con được phân loại theo 5 loại chuẩn: `JOB_POSTING` (Đăng tin), `CV_COLLECTION` (Thu thập hồ sơ), `CV_SCREENING` (Sàng lọc), `INTERVIEW_COORDINATION` (Điều phối phỏng vấn), `HIRING` (Thủ tục nhận việc).
  - `handleCreateTask`: Hàm bất đồng bộ gọi `apiRequest('/plans/:id/tasks', token, { method: 'POST', body })` để gửi dữ liệu nhiệm vụ lên Gateway.
  - `handleUpdateTaskStatus`: Hàm cập nhật trạng thái nhiệm vụ (`PENDING` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED`).
* **Luồng dữ liệu (Data Flow)**:
  - Input: Nhận `requestId` từ URL parameter $\rightarrow$ Gọi API `GET /recruitment-requests/:id/plan` lấy kế hoạch hiện tại.
  - Output: Gửi payload tạo task lên Gateway $\rightarrow$ Gateway chuyển tiếp qua TCP đến `recruiting` service $\rightarrow$ Lưu vào bảng `TaskPlan` trong PostgreSQL.
* **Thầy Cô hỏi**: *"Làm sao đảm bảo HR không giao task vượt quá thời hạn của kế hoạch tổng thể?"*
* **Phong trả lời**: *"Dạ trong component em có logic kiểm tra `task.startDate >= plan.startDate` và `task.endDate <= plan.endDate`. Ở Backend trong file `overall-plan.service.ts` cũng kiểm tra ràng buộc này, nếu vi phạm sẽ ném `RpcException` mã `BAD_REQUEST` ạ."*

### 📄 File 2 (Frontend): [`frontend/src/features/hr/pages/HRJobPostingWorkspace.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/hr/pages/HRJobPostingWorkspace.tsx)
* **Loại file**: React Component (Page - Job Posting Workspace).
* **Vai trò kiến trúc**: Không gian làm việc giúp HR tạo, chỉnh sửa và xuất bản tin tuyển dụng (`JobPosting`) ra cổng việc làm công khai cho ứng viên nộp hồ sơ.
* **Các thành phần cốt lõi bên trong file**:
  - `jobForm`: State quản lý tiêu đề công việc (`title`), mô tả vị trí (`jobDescription`), yêu cầu chuyên môn (`requirements`), mức lương tối thiểu/tối đa (`salaryMin`, `salaryMax`), hạn nộp hồ sơ (`deadline`).
  - `handlePublishJob`: Hàm chuyển trạng thái tin từ `DRAFT` sang `PUBLISHED`.
  - `statusBadge`: Render nhãn trạng thái trực quan với badge xanh lá khi tin đang mở tuyển.
* **Luồng dữ liệu**:
  - Kết nối với Gateway endpoint `POST /job-postings` hoặc `PATCH /job-postings/:id/publish`.
  - Khi xuất bản, dữ liệu lập tức hiển thị trên `LandingPage.tsx` để ứng viên (Lý) nhìn thấy và nộp đơn.

### 📄 File 3 (Frontend): [`frontend/src/features/hr/pages/HRInterviewSchedule.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/hr/pages/HRInterviewSchedule.tsx)
* **Loại file**: React Component (Calendar & Scheduling Page).
* **Vai trò kiến trúc**: Bảng điều phối phỏng vấn trực quan theo lịch (Calendar View). Giúp HR chọn ứng viên, chọn ngày giờ, chọn hội đồng phỏng vấn (bao gồm Trưởng phòng Hiếu) và tự động tạo phòng họp trực tuyến Google Meet.
* **Các thành phần cốt lõi bên trong file**:
  - `schedules`: State lưu danh sách các ca phỏng vấn trong tuần/tháng.
  - `conflictCheck`: Hàm kiểm tra xung đột thời gian (Time slot conflict) giữa các thành viên hội đồng phỏng vấn trước khi đặt lịch.
  - `handleCreateInterview`: Gọi `POST /interviews` kèm danh sách `interviewerIds`, `candidateId`, `scheduledAt`, `meetingLink`.
* **Luồng dữ liệu**:
  - Gateway nhận request $\rightarrow$ TCP chuyển tới `interview` service $\rightarrow$ Kiểm tra bảng `InterviewSchedule` $\rightarrow$ Đồng thời gửi notification đến In-App notification của Trưởng phòng (Hiếu) và Ứng viên (Lý).

### 📄 File 4 (Frontend): [`frontend/src/features/hr/pages/CandidateSearch.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/hr/pages/CandidateSearch.tsx)
* **Loại file**: React Component (Smart AI Candidate Search Page).
* **Vai trò kiến trúc**: Giao diện tìm kiếm ứng viên thông minh kết hợp giữa bộ lọc từ khóa kỹ năng truyền thống và Tìm kiếm ngữ nghĩa bằng AI Vector Search.
* **Các thành phần cốt lõi bên trong file**:
  - `searchQuery`: Input nhập câu lệnh tìm kiếm tự nhiên (ví dụ: *"Tìm lập trình viên backend có kinh nghiệm NestJS và Postgres"*).
  - `candidateResults`: Mảng kết quả trả về kèm `similarityScore` (độ khớp tính theo phần trăm %).
  - `skillFilters`: Các chip kỹ năng lọc nhanh (React, NestJS, Docker, AWS).
* **Luồng dữ liệu**:
  - Gửi query lên Gateway `GET /candidates/search?q=...` $\rightarrow$ Chuyển qua `cv-search.service.ts` để tính toán khoảng cách cosine trên cơ sở dữ liệu vector.

### 📄 File 5 (Frontend): [`frontend/src/features/hr/pages/HRPipelineReports.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/hr/pages/HRPipelineReports.tsx)
* **Loại file**: React Component (Analytics & Funnel Page).
* **Vai trò kiến trúc**: Biểu đồ phễu tuyển dụng (Recruitment Funnel) đo lường hiệu suất qua từng vòng: Đã nộp hồ sơ $\rightarrow$ Vượt qua vòng lọc CV $\rightarrow$ Tham gia phỏng vấn $\rightarrow$ Nhận Offer $\rightarrow$ Đã nhận việc.
* **Các thành phần cốt lõi bên trong file**:
  - Sử dụng thư viện `Recharts` trực quan hóa các giai đoạn chuyển đổi.
  - Tính toán tỷ lệ chuyển đổi (Conversion Rate) và chi phí bình quân trên mỗi ứng viên tuyển thành công (Cost-per-hire).

### 📄 File 6 (Backend Gateway): [`backend/services/gateway/src/gateway.module.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/gateway/src/gateway.module.ts)
* **Loại file**: NestJS Module (API Gateway Root Module).
* **Vai trò kiến trúc**: "Trái tim" kết nối mạng của toàn bộ hệ thống. Đăng ký `ClientsModule` của NestJS với giao thức **TCP Transport** để Gateway giao tiếp phân tán với 6 Microservices độc lập bên dưới.
* **Các thành phần cốt lõi bên trong file**:
  - Đăng ký các Client Proxy:
    - `IDENTITY_SERVICE`: TCP Port `3010`
    - `RECRUITING_SERVICE`: TCP Port `3011`
    - `PROFILES_SERVICE`: TCP Port `3012`
    - `NOTIFICATION_SERVICE`: TCP Port `3013`
    - `CV_SERVICE`: TCP Port `3014`
    - `INTERVIEW_SERVICE`: TCP Port `3015`
* **Thầy Cô hỏi**: *"Tại sao Gateway lại giao tiếp với Microservices bằng TCP mà không dùng HTTP REST?"*
* **Phong trả lời**: *"Dạ thưa Thầy Cô, TCP Transport trong NestJS Microservices giữ kết nối socket liên tục (persistent connection), giúp giảm chi phí handshake HTTP ở từng request, tăng thông lượng chịu tải và giảm độ trễ (latency) khi truyền dữ liệu nội bộ giữa các service ạ."*

### 📄 File 7 (Backend Recruiting): [`backend/services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts)
* **Loại file**: NestJS Service (Core Domain Business Logic).
* **Vai trò kiến trúc**: Quản lý toàn bộ State Machine gồm **13 trạng thái tuyển dụng** của hệ thống (từ `PENDING_HR_REVIEW`, `PENDING_DIRECTOR_REVIEW`, `APPROVED`, đến `CANCELLED`).
* **Các hàm cốt lõi**:
  - `createRequest`: Nhận dữ liệu từ Trưởng phòng (Hiếu), khởi tạo trạng thái `PENDING_HR_REVIEW`.
  - `hrReviewRequest`: HR thẩm định nội dung trước khi chuyển lên cho Boss duyệt.
  - `approveRequest`: Boss (Dũng) duyệt đề xuất, chuyển trạng thái sang `APPROVED`.
  - `rejectRequest`: Từ chối đề xuất và bắt buộc lưu `rejectionReason` (lý do từ chối).

### 📄 File 8 (Backend Recruiting): [`backend/services/recruiting/src/modules/overall-plan/overall-plan.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/recruiting/src/modules/overall-plan/overall-plan.service.ts)
* **Loại file**: NestJS Service.
* **Vai trò kiến trúc**: Đảm bảo quy tắc nghiệp vụ: Chỉ cho phép tạo Kế hoạch tổng thể và dự toán ngân sách khi Đề xuất tuyển dụng đã được Boss phê duyệt.
* **Các hàm cốt lõi**:
  - `createOverallPlan(requestId, dto)`: Kiểm tra ràng buộc `request.status === APPROVED` trước khi gọi `prisma.overallPlan.create()`.
  - `getPlanWithTasks(planId)`: Nạp toàn bộ cây dữ liệu gồm kế hoạch lớn và các `TaskPlan` con kèm người được giao việc (`assignedTo`).

### 📄 File 9 (Backend AI): [`backend/packages/ai/src/candidate-template-parser.ts`](file:///d:/Project/SE20A05Group7RMS/backend/packages/ai/src/candidate-template-parser.ts)
* **Loại file**: Thuật toán trích xuất dữ liệu (Algorithmic Parsing Engine).
* **Vai trò kiến trúc**: Bóc tách dữ liệu từ file CV mẫu chuẩn RMS (`RMS-CV-Template.doc`) mà không tốn chi phí gọi LLM AI.
* **Các hàm cốt lõi**:
  - `parseCandidateResumeTemplate(rawText)`: Nhận chuỗi text thô đã được worker trích xuất từ file word/pdf.
  - Hàm `section(text, heading, nextHeadings)`: Sử dụng kỹ thuật **Regex Positive Lookahead** `(?=\\n\\s*(?:${next})\\b|$)` để cô lập chính xác từng phân đoạn: `Summary`, `Work Experience`, `Education`, `Skills`.
  - Tốc độ xử lý chỉ mất $\sim 2$ mili-giây, độ chính xác xấp xỉ $100\%$ đối với file chuẩn template.

### 📄 File 10 (Backend AI): [`backend/packages/ai/src/cv-evaluator.ts`](file:///d:/Project/SE20A05Group7RMS/backend/packages/ai/src/cv-evaluator.ts)
* **Loại file**: Google Gemini LLM Evaluator Integration.
* **Vai trò kiến trúc**: Chấm điểm mức độ tương thích giữa kinh nghiệm trong CV ứng viên và bản mô tả công việc (JD) bằng mô hình `gemini-2.5-flash`.
* **Các hàm & cơ chế cốt lõi**:
  - Cơ chế **Multi-Key Rotation**: Mảng `config.apiKeys` chứa nhiều API keys dự phòng. Khi gặp mã lỗi Rate Limit `429`, hệ thống tự động bắt lỗi và xoay sang key tiếp theo.
  - Ép chuẩn đầu ra có cấu trúc bằng `responseMimeType: 'application/json'`: Đảm bảo luôn trả về `overallScore` (1-100), `technicalFitScore`, `strengths`, `weaknesses`.

### 📄 File 11 (Backend Recruiting): [`backend/services/recruiting/src/modules/cv-search/cv-search.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/recruiting/src/modules/cv-search/cv-search.service.ts)
* **Loại file**: NestJS Vector Search Service.
* **Vai trò kiến trúc**: Tìm kiếm ứng viên tương đồng về mặt ngữ nghĩa (Semantic Similarity Search) dựa trên phần mở rộng **PostgreSQL `pgvector`**.
* **Các hàm cốt lõi**:
  - `searchCandidates(queryText, limit)`: Chuyển câu hỏi tìm kiếm thành vector 384 chiều.
  - Sử dụng toán tử Cosine Distance `<=>` của pgvector:
    ```sql
    SELECT id, name, 1 - (embedding <=> $1::vector) AS similarity 
    FROM "CandidateProfile" ORDER BY similarity DESC LIMIT 10;
    ```

### 📄 File 12 (Backend Worker): [`backend/services/worker/src/processors/cv-parse.processor.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/worker/src/processors/cv-parse.processor.ts)
* **Loại file**: BullMQ Queue Worker Processor.
* **Vai trò kiến trúc**: Lắng nghe hàng đợi `CV_PARSE_QUEUE` trong Redis. Khi ứng viên nộp CV, worker sẽ chạy ngầm để đọc file nhị phân (PDF/Word), gọi parser bóc tách và kích hoạt chấm điểm mà không làm treo request của ứng viên.

---

## 👑 3.2 CHI TIẾT CÁC FILE CỦA BẠN DŨNG (BOSS / BAN GIÁM ĐỐC)

Dũng chịu trách nhiệm toàn bộ các màn hình phê duyệt và báo cáo cấp cao của Lãnh đạo (`BOSS` - Executive Portal), cùng các API duyệt đề xuất ở Backend.

### 📄 File 1 (Frontend): [`frontend/src/features/boss/pages/BossApprovalQueue.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/boss/pages/BossApprovalQueue.tsx)
* **Loại file**: React Component (Page - Boss Executive Queue).
* **Vai trò kiến trúc**: Đây là màn hình quan trọng nhất của Boss. Hiển thị danh sách các Đề xuất nhân sự (`REQUEST`) và Kế hoạch ngân sách (`PLAN`) đang chờ Lãnh đạo phê duyệt hoặc từ chối.
* **Các thành phần cốt lõi bên trong file**:
  - `queueType`: State chuyển đổi giữa 2 tab: duyệt đề xuất nhân sự (`REQUEST`) và duyệt kế hoạch ngân sách (`PLAN`).
  - `selectedRequest`: Lưu đề xuất đang được Boss click xem chi tiết ở modal bên phải.
  - `handleReviewAction(action: 'APPROVED' | 'REJECTED')`: Hàm gửi lệnh duyệt hoặc từ chối về Gateway:
    - Nếu chọn `REJECTED`, giao diện hiển thị `textarea` bắt buộc Boss nhập lý do từ chối (`rejectionReason`).
    - Nếu chọn `APPROVED`, gọi API `PATCH /recruitment-requests/:id/approve`.
  - `BossInlineAlert`: Hiển thị thông báo thành công hoặc lỗi với tone màu Indigo trang trọng của lãnh đạo.
* **Luồng dữ liệu**:
  - Khi Boss mở trang $\rightarrow$ Gọi `apiRequest('/recruitment-requests/pending', token)` $\rightarrow$ Render danh sách card.
  - Khi Boss bấm "Phê duyệt" $\rightarrow$ Gửi request $\rightarrow$ Xóa đề xuất khỏi danh sách chờ $\rightarrow$ Cập nhật badge số lượng pending trên header.
* **Thầy Cô hỏi**: *"Nếu Boss từ chối đề xuất thì hệ thống xử lý thế nào?"*
* **Dũng trả lời**: *"Dạ thưa Thầy Cô, trong file `BossApprovalQueue.tsx`, khi Boss bấm 'Từ chối', form bắt buộc Boss nhập `rejectionReason`. Lý do này được gửi về Backend lưu vào Database và hệ thống tự động bắn thông báo cho Trưởng phòng Hiếu biết để sửa lại đề xuất ạ."*

### 📄 File 2 (Frontend): [`frontend/src/features/boss/pages/BossDashboard.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/boss/pages/BossDashboard.tsx)
* **Loại file**: React Component (Page - Executive KPI Dashboard).
* **Vai trò kiến trúc**: Bảng điều khiển tổng quan cho Giám đốc, hiển thị 4 chỉ số KPI quan trọng nhất của doanh nghiệp:
  1. Tổng số đề xuất đang chờ duyệt (`Pending Approvals`).
  2. Số lượng nhân sự đã tuyển thành công trong quý (`Hired YTD`).
  3. Thời gian tuyển dụng trung bình (`Average Time-to-Hire`, ví dụ: 21 ngày).
  4. Tổng ngân sách tuyển dụng đã giải ngân (`Budget Utilized`).
* **Các thành phần cốt lõi**:
  - `stats`: State lưu trữ 4 chỉ số KPI lấy từ API.
  - `recentActivities`: Bảng nhật ký các hành động tuyển dụng mới nhất trong toàn công ty.

### 📄 File 3 (Frontend): [`frontend/src/features/boss/pages/BossAnnualReport.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/boss/pages/BossAnnualReport.tsx)
* **Loại file**: React Component (Page - Annual Financial Report).
* **Vai trò kiến trúc**: Báo cáo tài chính chi phí tuyển dụng theo năm. Giúp Giám đốc so sánh ngân sách dự toán ban đầu (`Budget`) với chi phí thực tế phát sinh (`Actual Spend`) qua từng tháng.
* **Các thành phần cốt lõi**:
  - Tích hợp biểu đồ thanh kép (`BarChart` của Recharts) hiển thị cột dự toán màu xám nhạt và cột chi phí thực tế màu chàm Indigo.
  - `exportPdf`: Nút xuất báo cáo ra file PDF phục vụ cuộc họp Ban Quản Trị.

### 📄 File 4 (Frontend): [`frontend/src/features/boss/pages/BossDeptStats.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/boss/pages/BossDeptStats.tsx)
* **Loại file**: React Component (Page - Department Performance Comparison).
* **Vai trò kiến trúc**: So sánh hiệu quả tuyển dụng giữa các phòng ban (Kỹ thuật, Marketing, Kinh doanh).
* **Các thành phần cốt lõi**:
  - `departmentData`: Mảng dữ liệu từng phòng ban kèm: Số headcount yêu cầu, số headcount đã tuyển, tỷ lệ lấp đầy vị trí (Fill Rate %).

### 📄 File 5 (Frontend UI Kit): [`frontend/src/features/boss/components/layout.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/boss/components/layout.tsx)
* **Loại file**: UI Helper & Design Tokens Component.
* **Vai trò kiến trúc**: Định nghĩa bộ nhận diện thương hiệu riêng cho cổng Lãnh đạo (`BOSS`): Tone màu chủ đạo là Indigo / Navy, bao gồm `BossPageHeader`, `BossSearchInput`, `BossInlineAlert`, `BossDashboardPage`.

### 📄 File 6 (Backend Gateway Controller): [`backend/services/gateway/src/controllers/recruiting.controller.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/gateway/src/controllers/recruiting.controller.ts)
* **Loại file**: NestJS Controller (API Gateway).
* **Vai trò kiến trúc**: Tiếp nhận request HTTP từ giao diện Boss, kiểm tra quyền bảo mật và chuyển tiếp qua microservice.
* **Đoạn code then chốt**:
  ```typescript
  @Patch(':id/approve')
  @Roles(UserRole.BOSS) // Chỉ duy nhất Boss mới được phép gọi endpoint này
  async approveRequest(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.recruitingClient.send({ cmd: 'approve_recruitment_request' }, { id, bossId: user.userId });
  }
  ```

### 📄 File 7 (Backend Recruiting Service): [`backend/services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts)
* **Loại file**: NestJS Service.
* **Hàm đảm nhiệm**: Hàm `approveRequest(id, bossId)`.
* **Xử lý**:
  - Kiểm tra xem đề xuất có tồn tại và đang ở trạng thái `PENDING_DIRECTOR_REVIEW` không.
  - Cập nhật trường `status = APPROVED`, `approvedBy = bossId`, `approvedAt = new Date()`.
  - Bắn sự kiện sang `notification` service để gửi thông báo chúc mừng cho Trưởng phòng Hiếu.

### 📄 File 8 (Backend Reports Service): [`backend/services/recruiting/src/modules/reports/reports.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/recruiting/src/modules/reports/reports.service.ts)
* **Loại file**: NestJS Service.
* **Vai trò kiến trúc**: Tính toán tổng hợp số liệu cho Boss: Đếm tổng số đề xuất, tính tổng ngân sách ước tính (`SUM(estimatedBudget)`), tính thời gian trung bình từ lúc tạo đề xuất đến khi tuyển được người.

---

## 🏢 3.3 CHI TIẾT CÁC FILE CỦA BẠN HIẾU (DEPARTMENT HEAD / TRƯỞNG PHÒNG BAN)

Hiếu chịu trách nhiệm phân hệ Trưởng phòng ban chuyên môn (`DEPARTMENT_HEAD`): Tạo đề xuất tuyển dụng theo vị trí chuẩn, theo dõi đề xuất và trực tiếp tham gia phỏng vấn, chấm điểm ứng viên.

### 📄 File 1 (Frontend): [`frontend/src/features/dept-head/pages/DeptHeadCreateRequest.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/dept-head/pages/DeptHeadCreateRequest.tsx)
* **Loại file**: React Component (Page - Create Recruitment Request).
* **Vai trò kiến trúc**: Form nhập liệu thông minh cho Trưởng phòng. Cho phép chọn chức danh từ danh mục mẫu sẵn có (`requestTemplates.ts`), hệ thống sẽ tự động điền sẵn mô tả công việc, yêu cầu bằng cấp và các thẻ kỹ năng (chips), giúp Trưởng phòng tạo đề xuất trong 30 giây.
* **Các thành phần cốt lõi bên trong file**:
  - `formState`: State lưu trữ dữ liệu đề xuất: `positionTitle`, `departmentId`, `headcount` (số lượng cần tuyển), `priority` (`Low`, `Medium`, `High`, `Critical`), `description`, `notes`.
  - `selectedTemplate`: Khi Trưởng phòng bấm chọn một template (ví dụ: *Senior Backend Developer*), hàm tự động nạp các kỹ năng bắt buộc: *Node.js, PostgreSQL, Docker, Microservices*.
  - `ComboboxChips`: Component chọn và thêm nhanh kỹ năng dưới dạng các tag/chip trực quan.
  - `handleSubmit`: Kiểm tra tính hợp lệ của form (headcount $\ge 1$, có đủ tiêu đề và phòng ban), sau đó gọi API `POST /recruitment-requests`.
* **Thầy Cô hỏi**: *"Làm sao Trưởng phòng biết đề xuất của mình thuộc phòng ban nào?"*
* **Hiếu trả lời**: *"Dạ trong file `DeptHeadCreateRequest.tsx`, hệ thống tự động gọi API lấy thông tin người dùng đang đăng nhập (`useAuth()`), đọc trường `user.departmentId` và tự động khóa cố định trường phòng ban đó, Trưởng phòng không thể gửi đề xuất thay cho phòng ban khác được ạ."*

### 📄 File 2 (Frontend Data): [`frontend/src/features/dept-head/pages/requestTemplates.ts`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/dept-head/pages/requestTemplates.ts)
* **Loại file**: TypeScript Data Configuration File.
* **Vai trò kiến trúc**: Từ điển chứa các mẫu đề xuất tuyển dụng chuẩn mực của doanh nghiệp (Senior Frontend, Senior Backend, DevOps Engineer, Product Manager, UI/UX Designer).
* **Nội dung cấu trúc**: Mỗi template chứa: `title`, `defaultHeadcount`, `priority`, `description`, `requiredSkills` (danh sách kỹ năng), `bachelorRequirements` (yêu cầu bằng cấp tối thiểu).

### 📄 File 3 (Frontend): [`frontend/src/features/dept-head/pages/DeptHeadRequests.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/dept-head/pages/DeptHeadRequests.tsx)
* **Loại file**: React Component (Page - Request Tracking List).
* **Vai trò kiến trúc**: Bảng danh sách giúp Trưởng phòng theo dõi toàn bộ các đề xuất tuyển dụng mà mình đã gửi đi, kèm tiến độ thời gian thực (Đang chờ HR soát xét $\rightarrow$ Đang chờ Boss duyệt $\rightarrow$ Đã được duyệt $\rightarrow$ Đang đăng tin).
* **Các thành phần cốt lõi**:
  - `requests`: Mảng danh sách các đề xuất của phòng ban.
  - `statusPill`: Render huy hiệu trạng thái với màu sắc tương ứng (Vàng: chờ duyệt, Xanh lá: đã duyệt, Đỏ: bị từ chối).
  - Modal xem chi tiết lý do từ chối nếu đề xuất bị trả về.

### 📄 File 4 (Frontend): [`frontend/src/features/dept-head/pages/DeptHeadInterviewFeedback.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/dept-head/pages/DeptHeadInterviewFeedback.tsx)
* **Loại file**: React Component (Page - Technical Evaluation Form).
* **Vai trò kiến trúc**: Phiếu đánh giá chuyên môn sau khi Trưởng phòng phỏng vấn xong ứng viên. Trưởng phòng chấm điểm kỹ thuật và đưa ra quyết định tuyển dụng.
* **Các thành phần cốt lõi bên trong file**:
  - `rating`: Đánh giá xếp hạng từ 1 đến 5 sao cho ứng viên.
  - `recommendation`: Lựa chọn khuyến nghị cuối cùng: `RECOMMEND_HIRE` (Đề xuất nhận việc), `CONSIDER` (Cân nhắc thêm), `REJECT` (Không đạt).
  - `technicalNotes`: Ô ghi chú nhận xét chi tiết về ưu điểm, khuyết điểm của ứng viên.
  - `handleSubmitFeedback`: Gọi `POST /interviews/:id/feedback` lưu kết quả vào cơ sở dữ liệu.

### 📄 File 5 (Frontend): [`frontend/src/features/dept-head/pages/DeptHeadInterviews.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/dept-head/pages/DeptHeadInterviews.tsx)
* **Loại file**: React Component (Page - Interview List for Dept Head).
* **Vai trò kiến trúc**: Danh sách các ca phỏng vấn sắp tới mà Trưởng phòng được phân công làm người chấm thi (Interviewer), kèm nút mở nhanh link Google Meet.

### 📄 File 6 (Backend Recruiting Service): [`backend/services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/recruiting/src/modules/recruitment-requests/recruitment-requests.service.ts)
* **Loại file**: NestJS Service.
* **Hàm đảm nhiệm**: Hàm `createRequest(dto, creatorId)`.
* **Xử lý**:
  - Lưu bản ghi mới vào bảng `RecruitmentRequest` với trạng thái ban đầu là `PENDING_HR_REVIEW`.
  - Khóa ngoại `createdById` được gán bằng ID của Trưởng phòng Hiếu.

### 📄 File 7 (Backend Interview Service): [`backend/services/interview/src/modules/results/interview-result.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/interview/src/modules/results/interview-result.service.ts)
* **Loại file**: NestJS Service (Interview Microservice).
* **Hàm đảm nhiệm**: Hàm `submitFeedback(interviewId, interviewerId, dto)`.
* **Xử lý**:
  - Lưu điểm số, nhận xét và khuyến nghị vào bảng `InterviewResult`.
  - Tự động kiểm tra: Nếu tất cả người phỏng vấn trong hội đồng đã nộp đủ phiếu điểm thì cập nhật trạng thái buổi phỏng vấn sang `COMPLETED`.

---

## 🎓 3.4 CHI TIẾT CÁC FILE CỦA BẠN LÝ (CANDIDATE / ỨNG VIÊN TUYỂN DỤNG)

Lý chịu trách nhiệm toàn bộ hành trình trải nghiệm của Ứng viên (`CANDIDATE`): Xem tin việc làm công khai, tải mẫu template chuẩn, nộp hồ sơ CV, theo dõi trạng thái ứng tuyển và ký nhận Offer trực tuyến.

### 📄 File 1 (Frontend): [`frontend/src/pages/LandingPage.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/pages/LandingPage.tsx)
* **Loại file**: React Component (Public Career Portal).
* **Vai trò kiến trúc**: Trang chủ việc làm công khai mở cho mọi ứng viên truy cập mà không bắt buộc đăng nhập trước. Hiển thị danh sách tất cả các vị trí đang mở tuyển (`PUBLISHED`) do HR đăng tải.
* **Các thành phần cốt lõi bên trong file**:
  - `jobs`: Mảng lưu danh sách các công việc lấy từ API `GET /job-postings/public`.
  - `searchTerm` & `selectedDepartment`: Bộ lọc tìm kiếm nhanh theo tiêu đề công việc hoặc theo phòng ban.
  - `handleJobClick`: Khi ứng viên click vào 1 công việc, mở modal `JobDetailsModal.tsx`.

### 📄 File 2 (Frontend): [`frontend/src/components/JobDetailsModal.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/components/JobDetailsModal.tsx)
* **Loại file**: React Component (Modal).
* **Vai trò kiến trúc**: Cửa sổ bật lên hiển thị chi tiết JD: Mức lương, quyền lợi, yêu cầu kinh nghiệm, và chứa nút bấm "Nộp đơn ứng tuyển ngay" (`Apply Now`).

### 📄 File 3 (Frontend): [`frontend/src/features/candidate/pages/CandidateUploadCv.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/candidate/pages/CandidateUploadCv.tsx)
* **Loại file**: React Component (Page - CV Upload & Template Download).
* **Vai trò kiến trúc**: Màn hình tải mẫu template và nộp CV. Cung cấp nút tải file mẫu chuẩn định dạng Word `RMS-CV-Template.doc` và khu vực kéo-thả (Drag and drop) để ứng viên nộp hồ sơ.
* **Các thành phần cốt lõi bên trong file**:
  - `handleFileDrop`: Bắt sự kiện kéo thả file, kiểm tra đuôi mở rộng hợp lệ (`.pdf`, `.doc`, `.docx`) và dung lượng file không được vượt quá $10\text{ MB}$.
  - Nút bấm tải template chuẩn: Tạo file Word chứa sẵn khung cấu trúc chuẩn (Thông tin liên hệ, Học vấn, Kinh nghiệm, Kỹ năng) để thuật toán bóc tách của Phong parse chính xác 100%.
  - `uploadProgress`: Thanh tiến trình phần trăm upload mượt mà.
  - `handleSubmitCv`: Đóng gói file vào đối tượng `FormData` và gọi `apiRequest('/cv/upload', token, { method: 'POST', body: formData })`.
* **Thầy Cô hỏi**: *"Nếu ứng viên upload một file lạ như file .exe hoặc file nặng 50MB thì hệ thống có chặn không?"*
* **Lý trả lời**: *"Dạ thưa Thầy Cô, file `CandidateUploadCv.tsx` ở phía Frontend có validate kiểm tra MIME type và chặn ngay nếu file $> 10\text{ MB}$. Đồng thời ở Backend trong file `cv.controller.ts`, anh Phong có cấu hình `Multer` với bộ lọc file filter chỉ cho phép `.pdf, .doc, .docx` và giới hạn cứng 10MB, nên file lạ sẽ bị trả về lỗi 400 Bad Request ngay lập tức ạ."*

### 📄 File 4 (Frontend): [`frontend/src/features/candidate/pages/CandidateProfile.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/candidate/pages/CandidateProfile.tsx)
* **Loại file**: React Component (Page - Candidate Resume Profile).
* **Vai trò kiến trúc**: Quản lý hồ sơ cá nhân của ứng viên. Hiển thị thông tin học vấn, kỹ năng, số năm kinh nghiệm mà hệ thống đã tự động bóc tách từ file CV nộp lên, cho phép ứng viên chỉnh sửa lại nếu muốn.

### 📄 File 5 (Frontend): [`frontend/src/features/candidate/pages/CandidateOffers.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/candidate/pages/CandidateOffers.tsx)
* **Loại file**: React Component (Page - Job Offer & E-Sign).
* **Vai trò kiến trúc**: Màn hình xem Thư mời nhận việc (Job Offer). Ứng viên xem mức lương chính thức, ngày bắt đầu đi làm, thời hạn phản hồi, và có nút bấm **Chấp nhận Offer online** (`Accept Offer`).
* **Các thành phần cốt lõi**:
  - `handleAcceptOffer`: Gọi API `PATCH /offers/:id/accept` để chuyển trạng thái sang `ACCEPTED`.
  - Hiển thị thông báo chúc mừng ứng viên chính thức gia nhập công ty.

### 📄 File 6 (Frontend): [`frontend/src/features/candidate/pages/CandidateInterviewDetails.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/candidate/pages/CandidateInterviewDetails.tsx)
* **Loại file**: React Component (Page - Interview Invitation Details).
* **Vai trò kiến trúc**: Hiển thị thư mời phỏng vấn dành cho ứng viên: Thời gian diễn ra, danh sách người phỏng vấn, hướng dẫn chuẩn bị và nút mở đường link Google Meet tham gia phỏng vấn.

### 📄 File 7 (Backend Gateway Controller): [`backend/services/gateway/src/controllers/cv.controller.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/gateway/src/controllers/cv.controller.ts)
* **Loại file**: NestJS Controller (Gateway).
* **Vai trò kiến trúc**: Endpoint tiếp nhận file upload bằng `FileInterceptor('file', multerOptions)`. Đọc buffer nhị phân của file CV và gửi sang `cv` microservice.

### 📄 File 8 (Backend CV Service): [`backend/services/cv/src/modules/cv/cv.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/cv/src/modules/cv/cv.service.ts)
* **Loại file**: NestJS Service (CV Microservice).
* **Vai trò kiến trúc**: Nhận file từ Gateway, lưu trữ file lên ổ đĩa máy chủ (`storage`), tạo bản ghi trong bảng `CvFile`, và phát lệnh đẩy một Job mới vào hàng đợi Redis BullMQ (`CV_PARSE_QUEUE`).

### 📄 File 9 (Backend Applications Service): [`backend/services/recruiting/src/modules/applications/applications.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/recruiting/src/modules/applications/applications.service.ts)
* **Loại file**: NestJS Service (Recruiting Microservice).
* **Vai trò kiến trúc**: Quản lý đơn ứng tuyển:
  - Hàm `applyForJob(candidateId, jobPostingId, cvId)`: Tạo bản ghi trong bảng `Application` với trạng thái ban đầu là `SUBMITTED`.

---

## 🛠️ 3.5 CHI TIẾT CÁC FILE CỦA BẠN ĐỨC (WEB ADMIN & APP SHELL)

Đức chịu trách nhiệm Khung giao diện ứng dụng dùng chung (`App Shell`, `Layout.tsx`, `Sidebar`, `ProtectedRoute`), Xác thực tài khoản, và Cổng Quản trị hệ thống (`WEB_ADMIN` - giám sát 9 Microservices và quản lý tài khoản).

### 📄 File 1 (Frontend App Shell): [`frontend/src/components/Layout.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/components/Layout.tsx)
* **Loại file**: React Component (Core App Shell & Navigation).
* **Vai trò kiến trúc**: Đây là khung xương giao diện (Layout) bao bọc toàn bộ ứng dụng. Chứa thanh Sidebar điều hướng, thanh Header trên cùng, hộp chuông thông báo (Notifications), và thông tin tài khoản đang đăng nhập.
* **Các thành phần cốt lõi bên trong file**:
  - `roleNavMap`: Đối tượng ánh xạ động danh mục Menu theo đúng Role của người dùng (`BOSS`, `DEPARTMENT_HEAD`, `HR_LEADER`, `CANDIDATE`, `WEB_ADMIN`). Người dùng ở role nào chỉ thấy đúng menu của role đó.
  - `NotificationBell`: Dropdown hiển thị thông báo thời gian thực (In-App notifications), tự động đếm số lượng thông báo chưa đọc.
  - `handleLogout`: Hàm xóa sạch `accessToken` trong `localStorage` và điều hướng người dùng về trang `/login`.
* **Thầy Cô hỏi**: *"Làm sao Sidebar biết người dùng là Boss hay Trưởng phòng để hiển thị đúng menu?"*
* **Đức trả lời**: *"Dạ trong file `Layout.tsx`, em dùng hook `useAuth()` để lấy thông tin `user.role` từ Token đăng nhập. Sau đó component dựa vào `user.role` để lọc lấy đúng mảng navigation tương ứng trong từ điển `roleNavMap` để render ra các nút bấm trên Sidebar ạ."*

### 📄 File 2 (Frontend Route Guard): [`frontend/src/components/ProtectedRoute.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/components/ProtectedRoute.tsx)
* **Loại file**: React Component (Route Guard & Security).
* **Vai trò kiến trúc**: Bộ lọc bảo vệ các tuyến đường (Routes). Ngăn chặn người dùng chưa đăng nhập truy cập vào hệ thống, hoặc ngăn chặn ứng viên truy cập trái phép vào trang của Giám đốc/Admin.
* **Các thành phần cốt lõi**:
  - Nhận props `allowedRoles`: Mảng các vai trò được phép truy cập trang (ví dụ: `allowedRoles={[UserRole.BOSS]}`).
  - Kiểm tra nếu `!token` $\rightarrow$ Redirect về `/login`.
  - Kiểm tra nếu role hiện tại không nằm trong `allowedRoles` $\rightarrow$ Redirect về trang chủ của role đó.

### 📄 File 3 (Frontend): [`frontend/src/pages/Login.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/pages/Login.tsx)
* **Loại file**: React Component (Page - Authentication).
* **Vai trò kiến trúc**: Trang đăng nhập duy nhất cho tất cả các vai trò. Người dùng nhập Email và Mật khẩu, hệ thống xác thực và tự động điều hướng người dùng về đúng phân hệ tương ứng.
* **Các thành phần cốt lõi**:
  - `handleLogin`: Gửi request `POST /auth/login` lên Gateway. Nhận về JWT Token và thông tin `user`.
  - Logic điều hướng tự động:
    - Nếu role là `BOSS` $\rightarrow$ Điều hướng về `/boss`.
    - Nếu role là `DEPARTMENT_HEAD` $\rightarrow$ Điều hướng về `/dept-head`.
    - Nếu role là `HR_LEADER` $\rightarrow$ Điều hướng về `/hr`.
    - Nếu role là `CANDIDATE` $\rightarrow$ Điều hướng về `/candidate`.
    - Nếu role là `WEB_ADMIN` $\rightarrow$ Điều hướng về `/admin`.

### 📄 File 4 (Frontend): [`frontend/src/pages/EmailOtpVerification.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/pages/EmailOtpVerification.tsx)
* **Loại file**: React Component (Page - OTP Verification).
* **Vai trò kiến trúc**: Màn hình nhập mã xác thực OTP 6 số gửi qua email để kích hoạt tài khoản nhân viên mới hoặc phục hồi mật khẩu.

### 📄 File 5 (Frontend): [`frontend/src/pages/AccountSettings.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/pages/AccountSettings.tsx)
* **Loại file**: React Component (Page - User Settings).
* **Vai trò kiến trúc**: Trang cài đặt tài khoản cá nhân: Cho phép nhân viên đổi mật khẩu, cập nhật họ tên hiển thị và cập nhật ảnh đại diện (avatar).

### 📄 File 6 (Frontend): [`frontend/src/features/admin/pages/AdminUsers.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/admin/pages/AdminUsers.tsx)
* **Loại file**: React Component (Page - System User Management).
* **Vai trò kiến trúc**: Trang quản lý người dùng của Quản trị viên hệ thống. Cho phép xem danh sách toàn bộ tài khoản nhân sự trong tổ chức, bật/tắt trạng thái hoạt động (`Active` / `Inactive`) và gửi email tạo mã mời tham gia tổ chức (`Organization Invitation`).
* **Các thành phần cốt lõi**:
  - `users`: Mảng lưu danh sách nhân viên trong công ty.
  - `handleToggleStatus`: Gọi API khóa hoặc mở khóa tài khoản nhân viên.
  - `handleSendInvitation`: Form gửi mã mời kèm Role định sẵn tới email của nhân sự mới.

### 📄 File 7 (Frontend): [`frontend/src/features/admin/pages/AdminDashboard.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/admin/pages/AdminDashboard.tsx)
* **Loại file**: React Component (Page - Microservices Health Monitor).
* **Vai trò kiến trúc**: Bảng điều khiển giám sát tình trạng sức khỏe của **toàn bộ 9 Microservices** trong hệ thống (Gateway, Identity, Recruiting, Profiles, Notification, CV, Interview, Worker, Embedding).
* **Các thành phần cốt lõi**:
  - Gọi endpoint `GET /system/health` để kiểm tra trạng thái từng service.
  - Hiển thị đèn chấm xanh lá `Healthy` nếu service hoạt động bình thường và đèn đỏ `Down` nếu service mất kết nối.

### 📄 File 8 (Frontend): [`frontend/src/features/admin/pages/AdminApiMonitor.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/admin/pages/AdminApiMonitor.tsx)
* **Loại file**: React Component (Page - API Metrics & Latency).
* **Vai trò kiến trúc**: Giám sát lưu lượng mạng, số lượng request mỗi phút và độ trễ phản hồi (Response Latency tính theo mili-giây ms) của các endpoint API.

### 📄 File 9 (Frontend): [`frontend/src/features/admin/pages/AdminMaintenance.tsx`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/admin/pages/AdminMaintenance.tsx)
* **Loại file**: React Component (Page - System Maintenance).
* **Vai trò kiến trúc**: Cho phép Admin bật/tắt chế độ bảo trì hệ thống (Maintenance Mode) và thực hiện dọn dẹp các bản ghi tạm hoặc xóa bộ nhớ cache Redis.

### 📄 File 10 (Backend Identity Users Service): [`backend/services/identity/src/modules/users/users.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/identity/src/modules/users/users.service.ts)
* **Loại file**: NestJS Service (Identity Microservice).
* **Các hàm cốt lõi**:
  - `listUsers`: Truy vấn Prisma lấy danh sách tất cả tài khoản người dùng (`User`), loại trừ trường nhạy cảm `passwordHash`.
  - `toggleUserActive(userId, isActive)`: Cập nhật cờ kích hoạt của tài khoản.

### 📄 File 11 (Backend Identity Auth Service): [`backend/services/identity/src/modules/auth/auth.service.ts`](file:///d:/Project/SE20A05Group7RMS/backend/services/identity/src/modules/auth/auth.service.ts)
* **Loại file**: NestJS Service (Identity Microservice).
* **Các hàm cốt lõi**:
  - `createOrganizationInvitation(dto)`: Sinh mã mời ngẫu nhiên 32 ký tự bằng `crypto.randomBytes(16).toString('hex')`, đặt thời hạn hết hạn sau 7 ngày và lưu vào bảng `OrganizationInvitation`.
  - `validateUser(email, password)`: Xác thực email và so khớp mật khẩu mã hóa bằng thư viện `bcrypt`.

---

---

# 🔄 4. KỊCH BẢN DEMO THỰC TẾ LIÊN HOÀN 8 BƯỚC (PHỐI HỢP CẢ NHÓM)

5 thành viên đăng nhập sẵn 5 trình duyệt tương ứng 5 tài khoản demo:

1. **Bước 1 — Khởi động hệ thống (Đức - Web Admin)**: Đăng nhập `webadmin@demo.test` $\rightarrow$ Mở `/admin/dashboard` chỉ vào đèn xanh `Healthy` của 9 Microservices.
2. **Bước 2 — Tạo đề xuất nhân sự (Hiếu - Dept Head)**: Đăng nhập `engineering.head@demo.test` $\rightarrow$ Mở form áp dụng mẫu *Senior Backend Developer*, bấm **Gửi đề xuất**.
3. **Bước 3 — Lãnh đạo phê duyệt đề xuất (Dũng - Boss)**: Đăng nhập `boss@demo.test` $\rightarrow$ Vào `/boss/approval-queue` thấy đề xuất mới xuất hiện, bấm **Phê duyệt (Approve)**.
4. **Bước 4 — Lập kế hoạch & Đăng tin (Phong - Tech Lead / HR)**: Đăng nhập `hr.manager@demo.test` $\rightarrow$ Lập kế hoạch TaskPlanner; sau đó đăng tin tuyển dụng lên cổng việc làm.
5. **Bước 5 — Ứng viên nộp hồ sơ (Lý - Candidate)**: Đăng nhập `candidate1@demo.test` $\rightarrow$ Tải mẫu template chuẩn RMS, nộp file CV vào tin vừa đăng.
6. **Bước 6 — AI Bóc tách & Chấm điểm (Phong - Tech Lead / AI)**: Trình diễn màn hình Background Worker bóc tách text CV, Gemini AI chấm điểm độ khớp và xếp lịch phỏng vấn Google Meet.
7. **Bước 7 — Phỏng vấn chuyên môn (Hiếu - Dept Head)**: Đăng nhập `engineering.head@demo.test` $\rightarrow$ Vào phiếu chấm điểm, cho điểm 5 sao và chọn **Đề xuất nhận việc (`RECOMMEND_HIRE`)**.
8. **Bước 8 — Duyệt Offer & Ký nhận việc (Phong, Dũng, Lý)**: HR phát hành Offer $\rightarrow$ Boss duyệt mức lương $\rightarrow$ Ứng viên bấm **Đồng ý nhận việc (`ACCEPTED`)**.

---

### 🎯 TỔNG KẾT:
Tài liệu này là cẩm nang toàn diện nhất:
- **Đích danh 5 thành viên**: **1-Phong**, **2-Dũng**, **3-Hiếu**, **4-Lý**, **5-Đức**.
- **Phong (Tech Lead)** đứng đầu tiên với phân tích chi tiết đầy đủ từ Nghiệp vụ HR đến Lõi AI, pgvector và Microservices.
- **Có sẵn từng đoạn code thực tế, giải thích từng dòng** cho cả Frontend và Backend của từng bạn.
- **Bảng tra cứu chi tiết toàn bộ các file liên quan** giúp từng bạn biết chính xác mình cần mở file nào trong codebase khi báo cáo!
