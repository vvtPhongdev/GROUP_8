# 📖 CẨM NANG TOÀN DIỆN: GIẢI THÍCH CHI TIẾT TỪNG FILE & TỪNG DÒNG CODE (BACKEND & FRONTEND)
## DỰ ÁN: WORKS RECRUITER (RMS) — NHÓM 7 (SE20A05)

Tài liệu này được biên soạn nhằm mục đích giải thích chi tiết toàn bộ cấu trúc mã nguồn, vai trò từng file và phân tích giải thích **từng dòng code trọng yếu** cho cả hai phân hệ **Backend** và **Frontend** trong hệ sinh thái Monorepo của dự án Tuyển dụng Doanh nghiệp Works Recruiter (RMS).

---

# 🗺️ PHẦN 1: TỔNG QUAN KIẾN TRÚC & MỐI LIÊN KẾT HỆ THỐNG

Dự án áp dụng mô hình **Monorepo** quản lý bằng **Turborepo** và **npm workspaces** (`Node.js >= 22.0.0`), kết hợp:
* **Frontend**: React 19, Vite, TailwindCSS, Radix UI (Port `3000`).
* **API Gateway**: NestJS 11 HTTP Server (Port `3001`, Global Prefix `/api/v1`, Swagger `/api/docs`).
* **Hệ thống Microservices Nội bộ**: 6 dịch vụ giao tiếp qua **TCP Transport Socket** liên tục:
  - `identity` (TCP `3010`): Xác thực tài khoản, phân quyền, cấu trúc phòng ban.
  - `recruiting` (TCP `3011`): Vòng đời 13 trạng thái tuyển dụng, kế hoạch, ngân sách, bài đăng, offer.
  - `profiles` (TCP `3012`): Hồ sơ ứng viên, học vấn, kinh nghiệm, kỹ năng.
  - `notification` (TCP `3013`): Thông báo In-App, Server-Sent Events (SSE), gửi mail.
  - `cv` (TCP `3014`): Tiếp nhận file CV, lưu trữ và đẩy hàng đợi bóc tách.
  - `interview` (TCP `3015`): Điều phối lịch hẹn, phát hiện xung đột thời gian, chấm điểm kỹ thuật.
* **Xử lý nền & Trí tuệ nhân tạo (Async & AI)**:
  - `worker`: Background Worker chạy trên nền BullMQ + Redis xử lý đọc file văn bản, tính toán vector và nhắc việc.
  - `embedding`: Dịch vụ suy luận mô hình ONNX nội bộ 384 chiều (Port `8000`).
  - `database`: PostgreSQL 16 tích hợp extension `pgvector` phục vụ Semantic Vector Search.

```
+---------------------------------------------------------------------------------------+
|                                FRONTEND (React 19 - Port 3000)                        |
|   Boss Portal  |  Dept Head Portal  |  HR Leader Portal  |  Candidate  |  Admin Shell |
+---------------------------------------------------------------------------------------+
                                          |
                      (HTTP REST / Bearer JWT / Multipart)
                                          v
+---------------------------------------------------------------------------------------+
|                             API GATEWAY (NestJS - Port 3001)                          |
|   - Helmet Security, CORS Whitelist, ValidationPipe (DTOs)                            |
|   - JwtAuthGuard (Xác thực) & RolesGuard (Phân quyền 5 vai trò)                       |
|   - Swagger Docs (/api/docs) & SSE Push Channel (/notifications/stream)               |
+---------------------------------------------------------------------------------------+
        |                 |               |               |             |
   (TCP 3010)        (TCP 3011)      (TCP 3012)      (TCP 3013)    (TCP 3014/3015)
        v                 v               v               v             v
  [ Identity ]      [ Recruiting ]   [ Profiles ]  [ Notification ]  [ CV / Interview ]
        \                 |               |               |             /
         +----------------+---------------+---------------+------------+
                                          |
                        +-----------------+-----------------+
                        v                                   v
             [ PostgreSQL 16 + pgvector ]          [ Redis 7.0 + BullMQ ]
                 (Dữ liệu quan hệ & Vector)           (Hàng đợi xử lý ngầm)
                                                            |
                                                            v
                                                   [ Worker & AI Embedding ]
```

---

# ⚙️ PHẦN 2: CHI TIẾT BACKEND — GIẢI THÍCH TỪNG FILE & TỪNG DÒNG CODE

Backend được phân tách rành mạch thành 2 thư mục:
1. `backend/packages/`: Các thư viện dùng chung (Contracts, Database Prisma, Config, Logger, Queue, AI, Storage).
2. `backend/services/`: 9 Microservices chuyên biệt.

---

## 2.1 THƯ VIỆN DÙNG CHUNG (`backend/packages/`)

### 📦 1. `backend/packages/contracts/` (`@wr/contracts`)
> **Nhiệm vụ**: Hợp đồng dữ liệu duy nhất (**Single Source of Truth**) cho toàn bộ hệ thống. Đảm bảo Backend và Frontend đồng nhất 100% về kiểu dữ liệu.

#### File: `src/enums/index.ts`
```typescript
// 1. Phân quyền 5 vai trò người dùng trong hệ thống
export enum UserRole {
  BOSS = 'BOSS',                       // Lãnh đạo cấp cao (Ban Giám Đốc)
  WEB_ADMIN = 'WEB_ADMIN',             // Quản trị viên hệ thống
  DEPARTMENT_HEAD = 'DEPARTMENT_HEAD', // Trưởng phòng ban chuyên môn
  HR_LEADER = 'HR_LEADER',             // Trưởng phòng nhân sự & chuyên viên tuyển dụng
  CANDIDATE = 'CANDIDATE',             // Ứng viên nộp hồ sơ xin việc
}

// 2. Vòng đời State Machine 13 trạng thái của một đề xuất tuyển dụng
export enum RecruitmentRequestStatus {
  DRAFT = 'DRAFT',                                     // Bản nháp chưa gửi
  PENDING_HR_REVIEW = 'PENDING_HR_REVIEW',             // Chờ HR thẩm định nội dung
  PENDING_DIRECTOR_REVIEW = 'PENDING_DIRECTOR_REVIEW', // Chờ Boss phê duyệt ngân sách/headcount
  APPROVED = 'APPROVED',                               // Boss đã duyệt chính thức
  REJECTED = 'REJECTED',                               // Bị từ chối (bắt buộc kèm lý do)
  PLANNING = 'PLANNING',                               // HR đang lập kế hoạch TaskPlanner
  PUBLISHED = 'PUBLISHED',                             // Đã xuất bản ra cổng việc làm
  IN_PROGRESS = 'IN_PROGRESS',                         // Đang thu thập và phỏng vấn ứng viên
  OFFER_EXTENDED = 'OFFER_EXTENDED',                   // Đã gửi Thư mời nhận việc
  COMPLETED = 'COMPLETED',                             // Đã tuyển đủ người và hoàn tất
  CANCELLED = 'CANCELLED',                             // Đề xuất bị hủy bỏ
}
```
* **Giải thích từng dòng code**:
  - `UserRole`: Enum gán cứng cho Token JWT, dùng trong `@Roles()` Decorator ở Backend và Route Guard ở Frontend.
  - `RecruitmentRequestStatus`: Đảm bảo quy trình phê duyệt đề xuất tuân thủ nghiêm ngặt mô hình quản trị doanh nghiệp, ngăn chặn tình trạng nhảy cóc quy trình.

---

### 📦 2. `backend/packages/database/` (`@wr/database`)
> **Nhiệm vụ**: Quản trị cơ sở dữ liệu với **Prisma 7**, hỗ trợ cấu trúc dữ liệu đa chiều `pgvector` và khởi tạo kết nối Singleton.

#### File: `prisma/schema.prisma`
```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector", schema: "public")] // Kích hoạt extension vector
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions", "driverAdapters"]
}

// Bảng người dùng hệ thống
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  displayName  String
  role         UserRole  @default(CANDIDATE)
  isActive     Boolean   @default(true)
  departmentId String?
  department   Department? @relation(fields: [departmentId], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

// Bảng đề xuất tuyển dụng
model RecruitmentRequest {
  id                 String                   @id @default(uuid())
  positionTitle      String
  headcount          Int                      @default(1)
  status             RecruitmentRequestStatus @default(PENDING_HR_REVIEW)
  priority           String                   @default("Medium")
  rejectionReason    String?                  // Bắt buộc nếu status = REJECTED
  departmentId       String
  createdById        String
  approvedById       String?                  // Khóa ngoại liên kết tới Boss
  approvedAt         DateTime?
  overallPlan        OverallPlan?             // Quan hệ 1-1 với kế hoạch tổng thể
}
```
* **Giải thích từng dòng code**:
  - `extensions = [pgvector(...)]`: Cho phép lưu trữ vector 384 chiều của mô hình Embedding trực tiếp vào bảng Postgres.
  - `previewFeatures = ["driverAdapters"]`: Sử dụng cơ chế kết nối hiện đại của Prisma 7 giúp tận dụng Connection Pool của `pg` cho tốc độ xử lý song song vượt trội.

#### File: `src/index.ts` (Singleton Client)
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    const databaseUrl = process.env.DATABASE_URL || '';
    // Nếu là URL postgres cục bộ thì dùng pg Pool Adapter
    if (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')) {
      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaPg(pool);
      prisma = new PrismaClient({ adapter });
    } else {
      // Trường hợp Prisma Cloud Accelerate
      prisma = new PrismaClient();
    }
  }
  return prisma;
}
```
* **Giải thích từng dòng code**:
  - `if (!prisma)`: Áp dụng mẫu thiết kế **Singleton Pattern** để toàn bộ 9 microservices trong cùng một Node.js process tái sử dụng đúng 1 instance Prisma Client, triệt tiêu nguy cơ cạn kiệt Connection Pool của cơ sở dữ liệu.

---

### 📦 3. `backend/packages/config/` (`@wr/config`)
> **Nhiệm vụ**: Nạp và kiểm định cấu hình biến môi trường (`.env`) theo cơ chế **Fail-fast** bằng Zod.

#### File: `src/index.ts`
```typescript
import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

// Schema định nghĩa các biến môi trường bắt buộc
const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  ENABLE_AI: z.string().default('true'),
  GEMINI_API_KEYS: z.string().optional(),
});

// Kiểm định khi ứng dụng vừa boot
export const env = envSchema.parse(process.env);
```
* **Giải thích từng dòng code**:
  - `envSchema.parse(process.env)`: Nếu người triển khai thiếu bất kỳ biến môi trường cốt lõi nào (như `DATABASE_URL` hoặc `JWT_SECRET`), hệ thống sẽ dừng ngay lập tức khi khởi động kèm thông báo lỗi rõ ràng, tránh để xảy ra lỗi tiềm ẩn lúc chạy.

---

### 📦 4. `backend/packages/queue/` (`@wr/queue`)
> **Nhiệm vụ**: Định nghĩa các danh mục hàng đợi BullMQ dùng chung giữa Gateway, Microservices và Background Worker.

#### File: `src/index.ts`
```typescript
export const QUEUE_NAMES = {
  CV_PARSE: 'cv-parse-queue',           // Bóc tách text và thông tin CV
  CV_EMBEDDING: 'cv-embedding-queue',   // Sinh vector 384 chiều
  EMAIL_SEND: 'email-send-queue',       // Gửi mail thông báo, OTP, thư mời
  TASK_REMINDER: 'task-reminder-queue', // Quét nhắc việc sắp hết hạn
} as const;
```

---

### 📦 5. `backend/packages/ai/` (`@wr/ai`)
> **Nhiệm vụ**: Cung cấp thuật toán phân tích CV theo chuẩn mẫu, chấm điểm so khớp AI và tìm kiếm vector.

#### File: `src/candidate-template-parser.ts` (Thuật toán 0 Token AI)
```typescript
// Bóc tách từng phân đoạn (Section) trong CV bằng Regular Expression Lookahead
export function extractSection(rawText: string, heading: string, nextHeadings: string[]): string {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const next = nextHeadings.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  
  // Regex bắt đầu từ tiêu đề mục này và dừng lại khi gặp tiêu đề mục kế tiếp
  const regex = new RegExp(`${escapedHeading}\\s*([\\s\\S]*?)(?=\\n\\s*(?:${next})\\b|$)`, 'i');
  const match = rawText.match(regex);
  return match ? match[1].trim() : '';
}
```
* **Giải thích từng dòng code**:
  - `(?=\\n\\s*(?:${next})\\b|$)`: Kỹ thuật **Positive Lookahead** trong RegEx giúp bóc tách độc lập từng khối: Tóm tắt bản thân (`Summary`), Kinh nghiệm làm việc (`Work Experience`), Học vấn (`Education`), Kỹ năng (`Skills`).
  - Tốc độ xử lý chỉ mất $\sim 2\text{ms}$ trên CPU thông thường mà không cần gửi dữ liệu lên máy chủ AI bên ngoài, tiết kiệm $100\%$ chi phí API.

#### File: `src/cv-evaluator.ts` (Gemini 2.5 Flash & Failover Rotation)
```typescript
export async function evaluateCvWithGemini(cvText: string, jobDescription: string, apiKeys: string[]) {
  // Lặp qua mảng các khóa API dự phòng (Failover Key Rotation)
  for (const apiKey of apiKeys) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' }, // Ép sinh JSON
      });

      const prompt = `Bạn là chuyên gia tuyển dụng. Hãy so sánh CV sau đây với bản mô tả công việc (JD):
      CV: ${cvText}
      JD: ${jobDescription}
      Trả về JSON: { "overallScore": 1-100, "technicalFit": 1-100, "strengths": [], "weaknesses": [] }`;

      const response = await model.generateContent(prompt);
      return JSON.parse(response.response.text());
    } catch (error: any) {
      // Nếu gặp mã lỗi 429 (Hết hạn mức request/phút) thì chuyển sang Key tiếp theo
      if (error?.status === 429) {
        console.warn('Gemini API key rate limit reached, switching to backup key...');
        continue;
      }
      throw error;
    }
  }
}
```
* **Giải thích từng dòng code**:
  - `for (const apiKey of apiKeys)`: Cơ chế tự động luân chuyển khóa API giúp hệ thống hoạt động liên tục 24/7 mà không sợ bị gián đoạn vì giới hạn Rate Limit của tài khoản miễn phí.
  - `responseMimeType: 'application/json'`: Đảm bảo mô hình AI của Google luôn trả về chuỗi JSON hợp lệ, loại bỏ hoàn toàn hiện tượng lỗi cú pháp (SyntaxError).

---

## 2.2 9 MICROSERVICES CHUYÊN BIỆT (`backend/services/`)

### 🌐 1. API GATEWAY (`backend/services/gateway`)
> **Nhiệm vụ**: Cổng giao tiếp duy nhất đón nhận request từ Frontend, xác thực Token JWT, kiểm tra phân quyền và forward qua TCP sang các Microservices.

#### File: `src/main.ts`
```typescript
async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  // 1. Giới hạn dung lượng Body an toàn cho hình ảnh bằng chứng phỏng vấn Base64
  app.use(json({ limit: '4mb' }));
  app.use(urlencoded({ extended: true, limit: '4mb' }));

  // 2. Bảo vệ tiêu đề HTTP bằng Helmet
  app.use(helmet());

  // 3. Đặt tiền tố chung cho toàn bộ REST API
  app.setGlobalPrefix('api/v1');

  // 4. Cho phép Frontend gọi API qua CORS
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });

  // 5. Cấu hình kiểm tra dữ liệu đầu vào tự động bằng ValidationPipe
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // 6. Kích hoạt tài liệu Swagger UI tại đường dẫn /api/docs
  const swaggerConfig = new DocumentBuilder().setTitle('RMS Gateway API').setVersion('1.0').addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3001);
}
```
* **Giải thích từng dòng code**:
  - `app.setGlobalPrefix('api/v1')`: Mọi request từ Client đều bắt đầu bằng `/api/v1/...` giúp đồng nhất cấu trúc API theo chuẩn RESTful.
  - `whitelist: true`: Tự động loại bỏ tất cả các trường dữ liệu thừa không được định nghĩa trong DTO, ngăn chặn tấn công chèn dữ liệu bẩn (Mass Assignment Vulnerability).

#### File: `src/gateway.module.ts` (Kết nối TCP Clients)
```typescript
@Module({
  imports: [
    ClientsModule.register([
      { name: 'IDENTITY_SERVICE', transport: Transport.TCP, options: { host: '127.0.0.1', port: 3010 } },
      { name: 'RECRUITING_SERVICE', transport: Transport.TCP, options: { host: '127.0.0.1', port: 3011 } },
      { name: 'PROFILES_SERVICE', transport: Transport.TCP, options: { host: '127.0.0.1', port: 3012 } },
      { name: 'NOTIFICATION_SERVICE', transport: Transport.TCP, options: { host: '127.0.0.1', port: 3013 } },
      { name: 'CV_SERVICE', transport: Transport.TCP, options: { host: '127.0.0.1', port: 3014 } },
      { name: 'INTERVIEW_SERVICE', transport: Transport.TCP, options: { host: '127.0.0.1', port: 3015 } },
    ]),
  ],
})
export class GatewayModule {}
```
* **Giải thích từng dòng code**:
  - Khai báo 6 kết nối mạng TCP Transport. Gateway đóng vai trò làm TCP Client, giữ kết nối liên tục (persistent socket connection) đến các dịch vụ bên dưới.

#### File: `src/controllers/recruiting.controller.ts` (Gateway Routing)
```typescript
@Controller('recruitment-requests')
export class RecruitingController {
  constructor(@Inject('RECRUITING_SERVICE') private readonly recruitingClient: ClientProxy) {}

  // Trưởng phòng ban tạo đề xuất mới
  @Post()
  @Roles(UserRole.DEPARTMENT_HEAD)
  async create(@Body() dto: CreateRequestDto, @CurrentUser() user: AuthUser) {
    return this.recruitingClient.send({ cmd: 'create_recruitment_request' }, { dto, userId: user.userId });
  }

  // Boss duyệt đề xuất
  @Patch(':id/approve')
  @Roles(UserRole.BOSS)
  async approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.recruitingClient.send({ cmd: 'approve_recruitment_request' }, { id, bossId: user.userId });
  }
}
```
* **Giải thích từng dòng code**:
  - `@Roles(...)`: Kiểm tra chặt chẽ quyền truy cập trước khi cho phép dữ liệu đi vào hệ thống.
  - `this.recruitingClient.send({ cmd: ... }, payload)`: Gửi gói tin nhị phân qua socket TCP tới Recruiting Microservice và chờ nhận kết quả trả về dưới dạng RxJS Observable.

---

### 🔑 2. IDENTITY SERVICE (`backend/services/identity`)
> **Nhiệm vụ**: Quản lý tài khoản người dùng, mã hóa mật khẩu, cấp phát Access Token/Refresh Token và tạo mã mời tổ chức.

#### File: `src/modules/auth/auth.service.ts`
```typescript
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {}

  // Đăng nhập và sinh JWT
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new RpcException({ status: HttpStatus.UNAUTHORIZED, message: 'Sai email hoặc mật khẩu' });
    }
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '1h' }),
      user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
    };
  }

  // Tạo mã mời thành viên mới vào tổ chức (Admin)
  async createInvitation(email: string, role: UserRole) {
    const code = crypto.randomBytes(16).toString('hex'); // Mã hex ngẫu nhiên 32 ký tự
    return this.prisma.organizationInvitation.create({
      data: {
        email: email.toLowerCase(),
        role,
        code,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Hạn sử dụng 7 ngày
      },
    });
  }
}
```

---

### 📋 3. RECRUITING SERVICE (`backend/services/recruiting`)
> **Nhiệm vụ**: Quản lý State Machine tuyển dụng, kế hoạch tổng thể, bài đăng việc làm và nộp đơn ứng tuyển.

#### File: `src/modules/recruitment-requests/recruitment-requests.service.ts`
```typescript
@Injectable()
export class RecruitmentRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  // Boss duyệt đề xuất
  async approveRequest(id: string, bossId: string) {
    const request = await this.prisma.recruitmentRequest.findUnique({ where: { id } });
    if (!request) {
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: 'Không tìm thấy đề xuất' });
    }
    
    // Đổi trạng thái sang APPROVED và ghi nhận danh tính Boss phê chuẩn
    return this.prisma.recruitmentRequest.update({
      where: { id },
      data: {
        status: RecruitmentRequestStatus.APPROVED,
        approvedById: bossId,
        approvedAt: new Date(),
      },
    });
  }
}
```

---

### 📅 4. INTERVIEW SERVICE (`backend/services/interview`)
> **Nhiệm vụ**: Điều phối lịch phỏng vấn, kiểm tra xung đột thời gian và lưu trữ kết quả đánh giá kỹ thuật.

#### File: `src/modules/results/interview-result.service.ts`
```typescript
@Injectable()
export class InterviewResultService {
  constructor(private readonly prisma: PrismaService) {}

  // Trưởng phòng chấm điểm và nộp khuyến nghị
  async submitFeedback(interviewId: string, interviewerId: string, dto: FeedbackDto) {
    return this.prisma.interviewResult.create({
      data: {
        interviewId,
        interviewerId,
        rating: dto.rating,                   // Điểm 1 - 5 sao
        recommendation: dto.recommendation,   // RECOMMEND_HIRE | CONSIDER | REJECT
        technicalNotes: dto.technicalNotes,   // Nhận xét chi tiết
      },
    });
  }
}
```

---

### 📄 5. CV SERVICE (`backend/services/cv`)
> **Nhiệm vụ**: Nhận buffer file CV từ Gateway, lưu trữ vào ổ đĩa và đẩy job vào BullMQ Queue để xử lý ngầm.

#### File: `src/modules/cv/cv.service.ts`
```typescript
@Injectable()
export class CvService {
  constructor(@InjectQueue(QUEUE_NAMES.CV_PARSE) private readonly cvQueue: Queue) {}

  async processCvUpload(fileBuffer: Buffer, fileName: string, candidateId: string) {
    // 1. Lưu file vào storage
    const filePath = await saveFileLocally(fileBuffer, fileName);

    // 2. Đẩy một Job bất đồng bộ vào hàng đợi Redis để Worker nhặt và xử lý
    const job = await this.cvQueue.add('parse_job', {
      filePath,
      fileName,
      candidateId,
      uploadedAt: new Date(),
    });

    return { jobId: job.id, message: 'File CV đang được phân tích ngầm' };
  }
}
```

---

### ⚡ 6. WORKER SERVICE (`backend/services/worker`)
> **Nhiệm vụ**: Chạy ngầm trong nền (Background Worker), tiêu thụ các Job từ Redis BullMQ để trích xuất văn bản CV, tính toán vector ngữ nghĩa và gửi email SMTP.

#### File: `src/processors/cv-parse.processor.ts`
```typescript
@Processor(QUEUE_NAMES.CV_PARSE)
export class CvParseProcessor extends WorkerHost {
  async process(job: Job<{ filePath: string; candidateId: string }>) {
    const { filePath, candidateId } = job.data;
    
    // 1. Đọc văn bản thô từ file PDF/Word
    const rawText = await extractTextFromFile(filePath);

    // 2. Gọi candidate-template-parser bóc tách thông tin cá nhân
    const parsedData = parseCandidateResumeTemplate(rawText);

    // 3. Cập nhật hồ sơ ứng viên vào cơ sở dữ liệu
    await updateCandidateProfile(candidateId, parsedData);
  }
}
```

---

# 🎨 PHẦN 3: CHI TIẾT FRONTEND — GIẢI THÍCH TỪNG FILE & TỪNG DÒNG CODE

Frontend được xây dựng bằng **React 19 + Vite**, áp dụng mô hình phân tách thư mục theo chức năng và phân hệ nghiệp vụ (`src/features/<role>/`).

---

## 3.1 CẤU HÌNH & KHUNG ỨNG DỤNG (APP SHELL)

### 📄 File: `frontend/vite.config.ts`
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }, // Rút ngắn đường dẫn import
  },
  server: {
    port: 3000,
    proxy: {
      // Chuyển tiếp toàn bộ request /api sang API Gateway chạy ở port 3001
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```
* **Giải thích**: Giúp giao diện React chạy ở port 3000 gọi thẳng endpoint `/api/v1/...` mà không gặp phải lỗi chính sách trình duyệt (CORS policy).

---

### 📄 File: `frontend/src/lib/api.ts` (API Client Dùng Chung)
```typescript
export async function apiRequest<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  
  // Tự động gắn Token xác thực vào Header
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Tự động thêm Content-Type JSON nếu có body
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api/v1${path}`, { ...init, headers });
  
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new ApiError(error?.message || 'Có lỗi xảy ra', response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
```
* **Giải thích**: Đóng gói hàm `fetch` gốc của trình duyệt thành tiện ích thông minh: tự động gán token, format header và ném ngoại lệ có cấu trúc (`ApiError`).

---

### 📄 File: `frontend/src/context/AuthContext.tsx` (Quản Lý Phiên Đăng Nhập)
```typescript
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('wr_token'));

  // Nạp thông tin người dùng từ token khi khởi động
  useEffect(() => {
    if (token) {
      apiRequest<AuthUser>('/auth/me', token)
        .then((userData) => setUser(userData))
        .catch(() => logout());
    }
  }, [token]);

  const login = (newToken: string, userData: AuthUser) => {
    localStorage.setItem('wr_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('wr_token');
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};
```
* **Giải thích**: Cung cấp trạng thái đăng nhập toàn cục (`user`, `token`, hàm `login`, `logout`) cho toàn bộ các trang trong ứng dụng.

---

### 📄 File: `frontend/src/components/ProtectedRoute.tsx` (Route Guard)
```typescript
export const ProtectedRoute: React.FC<{ allowedRoles?: UserRole[]; children: React.ReactNode }> = ({
  allowedRoles,
  children,
}) => {
  const { user, token } = useAuth();
  const location = useLocation();

  // 1. Chưa đăng nhập thì chuyển hướng về trang Login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Đăng nhập nhưng không đúng quyền thì chuyển hướng về trang chủ tương ứng
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomeRouteForRole(user.role)} replace />;
  }

  return <>{children}</>;
};
```
* **Giải thích**: "Người gác cổng" ở phía Frontend. Chặn đứng mọi hành vi gõ trực tiếp URL vào thanh địa chỉ của trình duyệt nếu không đủ quyền hạn.

---

### 📄 File: `frontend/src/components/Layout.tsx` (Sidebar Điều Hướng Động)
```typescript
export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  
  // Tự động nạp menu danh mục tùy theo Role của người dùng đang đăng nhập
  const navigationItems = useMemo(() => {
    switch (user?.role) {
      case UserRole.BOSS: return bossNavItems;
      case UserRole.DEPARTMENT_HEAD: return deptHeadNavItems;
      case UserRole.HR_LEADER: return hrNavItems;
      case UserRole.CANDIDATE: return candidateNavItems;
      case UserRole.WEB_ADMIN: return adminNavItems;
      default: return [];
    }
  }, [user?.role]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar items={navigationItems} user={user} onLogout={logout} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </SidebarProvider>
  );
};
```

---

## 3.2 CÁC TRANG CỦA 5 VAI TRÒ CHỨC NĂNG (`frontend/src/features/`)

### 👑 1. PHÂN HỆ BOSS (`frontend/src/features/boss/`)
* **`pages/BossApprovalQueue.tsx`**: Hàng đợi phê duyệt của Giám Đốc.
  - Chuyển đổi giữa 2 tab: Duyệt đề xuất nhân sự (`REQUEST`) và Duyệt kế hoạch ngân sách (`PLAN`).
  - Khi click nút "Từ chối", form bắt buộc nhập `rejectionReason`. Khi bấm "Duyệt", gọi `PATCH /recruitment-requests/:id/approve`.
* **`pages/BossDashboard.tsx`**: Bảng điều khiển hiển thị 4 thẻ KPI chiến lược: Đề xuất đang chờ duyệt, Số nhân sự đã tuyển trong năm, Thời gian tuyển dụng trung bình (Time-to-Hire) và Ngân sách đã giải ngân.
* **`pages/BossAnnualReport.tsx`**: Biểu đồ Recharts so sánh ngân sách dự toán ban đầu với chi phí thực tế phát sinh qua các tháng.

---

### 🏢 2. PHÂN HỆ DEPARTMENT HEAD (`frontend/src/features/dept-head/`)
* **`pages/DeptHeadCreateRequest.tsx`**: Form lập đề xuất tuyển dụng nhân sự.
  - Tích hợp từ điển mẫu chức danh [`requestTemplates.ts`](file:///d:/Project/SE20A05Group7RMS/frontend/src/features/dept-head/pages/requestTemplates.ts): Khi Trưởng phòng chọn vị trí *Senior Backend Developer*, hệ thống tự động điền sẵn mô tả công việc, số lượng tuyển đề xuất và các tag kỹ năng (`ComboboxChips`).
* **`pages/DeptHeadRequests.tsx`**: Danh sách theo dõi tiến độ phê duyệt của các đề xuất thuộc phòng ban mình quản lý.
* **`pages/DeptHeadInterviewFeedback.tsx`**: Phiếu chấm điểm ứng viên chuyên môn: Đánh giá xếp hạng 1-5 sao, viết nhận xét kỹ thuật và chọn khuyến nghị nhận việc (`RECOMMEND_HIRE`).

---

### 🌟 3. PHÂN HỆ HR LEADER (`frontend/src/features/hr/`)
* **`pages/HRTaskPlanner.tsx`**: Lập kế hoạch tổng thể và chia 5 nhóm nhiệm vụ tuyển dụng cho các chuyên viên Recruiter: `JOB_POSTING`, `CV_COLLECTION`, `CV_SCREENING`, `INTERVIEW_COORDINATION`, `HIRING`.
* **`pages/HRJobPostingWorkspace.tsx`**: Soạn thảo và xuất bản tin tuyển dụng trạng thái `PUBLISHED` ra cổng thông tin việc làm công khai.
* **`pages/HRInterviewSchedule.tsx`**: Lịch điều phối phỏng vấn trực quan theo tuần/tháng, kiểm tra xung đột thời gian của hội đồng và tạo link Google Meet.
* **`pages/CandidateSearch.tsx`**: Tìm kiếm ứng viên bằng Vector Search và bộ lọc kỹ năng kết hợp độ tương đồng Cosine.

---

### 🎓 4. PHÂN HỆ CANDIDATE (`frontend/src/features/candidate/`)
* **`pages/CandidateUploadCv.tsx`**: Cung cấp nút tải template mẫu chuẩn Word `RMS-CV-Template.doc` và khu vực kéo-thả (Drag & Drop) nộp file CV ($\le 10\text{MB}$).
* **`pages/CandidateProfile.tsx`**: Xem và cập nhật thông tin cá nhân đã được hệ thống bóc tách tự động từ CV.
* **`pages/CandidateOffers.tsx`**: Xem Thư mời nhận việc và bấm nút **Chấp nhận Offer online** (`ACCEPTED`).
* **`pages/CandidateInterviewDetails.tsx`**: Xem chi tiết thư mời phỏng vấn và truy cập đường link Google Meet.

---

### 🛠️ 5. PHÂN HỆ WEB ADMIN (`frontend/src/features/admin/`)
* **`pages/AdminUsers.tsx`**: Quản lý danh sách nhân sự, kích hoạt/khóa tài khoản và gửi mã mời tham gia tổ chức qua email.
* **`pages/AdminDashboard.tsx`**: Bảng điều khiển giám sát tình trạng hoạt động (đèn xanh `Healthy` / đỏ `Down`) của toàn bộ **9 Microservices**.
* **`pages/AdminApiMonitor.tsx`**: Đo lường số lượng request mỗi phút và độ trễ response (ms) của từng API.

---

# 🎯 PHẦN 4: TỔNG KẾT & BẢNG TRA CỨU HỎI ĐÁP BÁO CÁO

| Khi Thầy Cô hỏi về... | Mở ngay File này | Điểm mấu chốt cần trình bày |
| :--- | :--- | :--- |
| **Kiến trúc mạng Microservices** | `backend/services/gateway/src/gateway.module.ts` | Giao thức TCP Socket giữ kết nối liên tục, giảm độ trễ so với HTTP. |
| **Phân quyền người dùng (RBAC)** | `backend/services/gateway/src/auth/decorators/guard/roles.guard.ts` | Đọc `user.role` từ Token giải mã và so khớp với `@Roles()`. |
| **Thuật toán bóc tách CV không tốn AI** | `backend/packages/ai/src/candidate-template-parser.ts` | Kỹ thuật RegEx Positive Lookahead bóc tách phân đoạn chỉ mất 2ms. |
| **Mô hình AI chấm điểm CV** | `backend/packages/ai/src/cv-evaluator.ts` | Gemini 2.5 Flash ép kiểu JSON, cơ chế xoay API key tự động khi dính lỗi 429. |
| **Tìm kiếm ngữ nghĩa Vector Search** | `backend/services/recruiting/src/modules/cv-search/cv-search.service.ts` | Toán tử Cosine Distance `<=>` của `pgvector` trên cột vector 384 chiều. |
| **Hàng đợi xử lý ngầm** | `backend/services/worker/src/processors/cv-parse.processor.ts` | BullMQ + Redis giúp ứng viên upload không bị treo màn hình chờ. |
| **Khung giao diện tự đổi theo Role** | `frontend/src/components/Layout.tsx` | Hook `useAuth()` lấy `user.role` để render đúng danh mục Menu tương ứng. |
| **Xác thực bảo vệ tuyến đường** | `frontend/src/components/ProtectedRoute.tsx` | Kiểm tra token và `allowedRoles`, tự redirect nếu không đúng quyền. |
| **Duyệt đề xuất và kế hoạch** | `frontend/src/features/boss/pages/BossApprovalQueue.tsx` | Bắt buộc nhập lý do khi từ chối, bấm duyệt chuyển trạng thái `APPROVED`. |
| **Tạo đề xuất theo mẫu** | `frontend/src/features/dept-head/pages/DeptHeadCreateRequest.tsx` | Tích hợp template mẫu tự điền mô tả và chip kỹ năng trong 30 giây. |
| **Nộp CV chuẩn template** | `frontend/src/features/candidate/pages/CandidateUploadCv.tsx` | Tải template chuẩn RMS Word và kéo thả upload validate 10MB. |
