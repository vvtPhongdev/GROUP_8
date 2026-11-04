# 🎓 Works Reruiter RMS — Hướng Dẫn Học & Build Từ Đầu

> **Dành cho:** Người mới bắt đầu, chưa biết NestJS, Microservices, Docker  
> **Phương pháp:** Học lý thuyết ngay khi thực hành — mỗi module giải thích **TẠI SAO** trước khi làm **NHƯ THẾ NÀO**  
> **Mục tiêu:** Build lại toàn bộ hệ thống RMS trong folder mới, hiểu rõ từng dòng code

---

## 🗺️ Lộ Trình Học Tập (9 Modules)

```
Module 1: Turborepo Monorepo           ← Nền tảng cấu trúc project
    ↓
Module 2: Docker & Infrastructure      ← Database + Cache
    ↓
Module 3: Prisma ORM + PostgreSQL      ← Định nghĩa database schema
    ↓
Module 4: NestJS Cơ Bản               ← Framework backend
    ↓
Module 5: NestJS Microservices (TCP)   ← Kiến trúc đa dịch vụ
    ↓
Module 6: JWT Authentication           ← Bảo mật & phân quyền
    ↓
Module 7: BullMQ Background Jobs       ← Xử lý tác vụ nền
    ↓
Module 8: React + Vite Frontend        ← Giao diện người dùng
    ↓
Module 9: Tích Hợp & Chạy Toàn Bộ    ← Kết nối tất cả lại
```

**Thời gian ước tính:** 2–4 tuần nếu học mỗi ngày 2–3 giờ.

---

## 📋 Mục Lục Chi Tiết

- [Chuẩn Bị](#-chuẩn-bị)
- [Module 1: Turborepo Monorepo](#-module-1-turborepo-monorepo)
- [Module 2: Docker & Infrastructure](#-module-2-docker--infrastructure)
- [Module 3: Prisma ORM + PostgreSQL](#-module-3-prisma-orm--postgresql)
- [Module 4: NestJS Cơ Bản](#-module-4-nestjs-cơ-bản)
- [Module 5: NestJS Microservices](#-module-5-nestjs-microservices-tcp)
- [Module 6: JWT Authentication](#-module-6-jwt-authentication)
- [Module 7: BullMQ Background Jobs](#-module-7-bullmq-background-jobs)
- [Module 8: React + Vite Frontend](#-module-8-react--vite-frontend)
- [Module 9: Tích Hợp Toàn Bộ](#-module-9-tích-hợp-toàn-bộ)

---

## 🛠 Chuẩn Bị

### Cài đặt công cụ

```bash
# 1. Kiểm tra Node.js (cần >= 22)
node --version

# Nếu chưa có Node 22, cài nvm trước:
# Windows: https://github.com/coreybutler/nvm-windows/releases
nvm install 22
nvm use 22

# 2. Kiểm tra npm
npm --version   # cần >= 10

# 3. Cài Docker Desktop
# https://www.docker.com/products/docker-desktop/
docker --version
docker compose version

# 4. Cài VS Code extensions (khuyến nghị)
# - Prisma
# - ESLint
# - Prettier
# - Docker
# - REST Client (thay Postman)
```

### Tạo folder dự án mới

```bash
# Tạo folder mới (TÁCH RIÊNG với project cũ)
mkdir D:\Projects\rms-learn
cd D:\Projects\rms-learn

# Init git
git init
```

---

## 📦 Module 1: Turborepo Monorepo

### 🧠 Lý thuyết — Monorepo là gì?

**Monorepo** = Một repository chứa nhiều "project con" (packages/apps).

Thay vì:
```
repo-backend/    ← repo riêng
repo-frontend/   ← repo riêng
repo-shared/     ← repo riêng
```

Chúng ta có:
```
rms-project/             ← 1 repo duy nhất
├── services/
│   ├── gateway/         ← app con
│   └── identity/        ← app con
├── packages/
│   └── contracts/       ← thư viện dùng chung
└── webapp/              ← app con
```

**Lợi ích:**
- Chia sẻ code giữa các services dễ dàng (`@wr/contracts`, `@wr/database`)
- Một lệnh `npm run dev` chạy tất cả
- Đồng bộ version dependencies

**Turborepo** là công cụ điều phối monorepo: tự động xử lý thứ tự build, cache kết quả.

### 🔨 Thực hành

**Bước 1.1 — Tạo cấu trúc thư mục**

```bash
cd D:\Projects\rms-learn

# Tạo cấu trúc
mkdir -p services\gateway
mkdir -p services\identity
mkdir -p services\recruiting
mkdir -p packages\contracts
mkdir -p packages\database
mkdir -p packages\config
mkdir -p webapp
```

**Bước 1.2 — Tạo Root `package.json`**

```bash
# Tạo file package.json cho root
```

Nội dung `package.json` (root):

```json
{
  "name": "rms-learn",
  "version": "0.1.0",
  "private": true,
  "packageManager": "npm@10.0.0",
  "workspaces": [
    "services/*",
    "packages/*",
    "webapp"
  ],
  "scripts": {
    "build":       "turbo run build",
    "dev":         "turbo run dev",
    "db:generate": "npm --workspace=@wr/database run generate",
    "db:migrate":  "npm --workspace=@wr/database run migrate:dev",
    "db:seed":     "npm --workspace=@wr/database run seed",
    "docker:up":   "docker compose up -d",
    "docker:down": "docker compose down"
  },
  "devDependencies": {
    "turbo":      "2.9.7",
    "typescript": "^5.8.3",
    "prettier":   "^3.5.3"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
```

**Bước 1.3 — Tạo `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

**Giải thích `turbo.json`:**
- `"dependsOn": ["^build"]` — khi build service A, Turbo sẽ build packages A phụ thuộc **trước**
- `"^"` nghĩa là "dependencies của package này"
- `"persistent": true` — lệnh dev chạy mãi mãi (không tự tắt)

**Bước 1.4 — Tạo `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Bước 1.5 — Tạo `.gitignore`**

```
node_modules/
dist/
.turbo/
.env
*.log
```

**Bước 1.6 — Install Turborepo**

```bash
npm install
```

### ✅ Kiểm tra Module 1

```bash
# Kiểm tra npm workspaces hoạt động
npm ls --workspaces
```

---

## 🐳 Module 2: Docker & Infrastructure

### 🧠 Lý thuyết — Docker là gì?

**Docker** cho phép bạn chạy ứng dụng trong "container" — môi trường cô lập, nhất quán trên mọi máy.

Thay vì cài PostgreSQL thẳng vào Windows (phức tạp, hay lỗi version), bạn chạy:

```bash
docker compose up -d
# → PostgreSQL 16 chạy trong container, cô lập với hệ thống
```

**Các khái niệm:**
- **Image**: Blueprint (bản thiết kế) của container — ví dụ `postgres:16`
- **Container**: Instance đang chạy của image
- **Volume**: Nơi lưu dữ liệu bền vững (tắt container, data không mất)
- **Port mapping**: `5432:5432` — cổng máy host:cổng container

### 🔨 Thực hành

**Bước 2.1 — Tạo `docker-compose.yml`**

```yaml
services:
  postgres:
    # Image đặc biệt: PostgreSQL 16 + pgvector extension
    # pgvector cho phép lưu vector embeddings (dùng cho AI search)
    image: pgvector/pgvector:pg16
    container_name: rms-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"   # host:container
    environment:
      POSTGRES_USER:     postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB:       rms_db
    volumes:
      # Dữ liệu lưu ở volume này — tắt container vẫn giữ nguyên
      - rms-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    # Redis dùng cho BullMQ (background job queue)
    image: redis:7-alpine
    container_name: rms-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - rms-redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

# Khai báo volumes (Docker tự quản lý)
volumes:
  rms-postgres-data:
  rms-redis-data:
```

**Bước 2.2 — Khởi động containers**

```bash
docker compose up -d
```

**Bước 2.3 — Kiểm tra**

```bash
# Xem trạng thái
docker compose ps

# Output mong đợi:
# NAME           STATUS
# rms-postgres   Up (healthy)
# rms-redis      Up (healthy)

# Test kết nối PostgreSQL
docker exec -it rms-postgres psql -U postgres -c "SELECT version();"

# Test kết nối Redis
docker exec -it rms-redis redis-cli ping
# Output: PONG
```

**Bước 2.4 — Các lệnh Docker hay dùng**

```bash
# Xem logs
docker compose logs postgres
docker compose logs -f postgres   # -f = follow (live logs)

# Restart service
docker compose restart postgres

# Tắt containers (giữ data)
docker compose stop

# Tắt và xóa containers (giữ data trong volumes)
docker compose down

# Tắt và xóa TẤT CẢ kể cả data (reset hoàn toàn)
docker compose down -v
```

### ✅ Kiểm tra Module 2

```bash
# PostgreSQL healthy
docker exec rms-postgres pg_isready -U postgres

# Redis healthy
docker exec rms-redis redis-cli ping
```

---

## 🗃 Module 3: Prisma ORM + PostgreSQL

### 🧠 Lý thuyết — ORM là gì?

**ORM (Object-Relational Mapping)** = lớp trung gian giữa code TypeScript và database SQL.

Thay vì viết SQL thủ công:
```sql
SELECT * FROM users WHERE email = 'abc@gmail.com';
```

Bạn viết TypeScript:
```typescript
const user = await prisma.user.findUnique({ where: { email: 'abc@gmail.com' } });
```

**Prisma** gồm 3 phần:
1. **Prisma Schema** (`schema.prisma`) — định nghĩa models (bảng database)
2. **Prisma Client** — auto-generated TypeScript client, có type-safety đầy đủ
3. **Prisma Migrate** — tạo và quản lý SQL migration files

### 🔨 Thực hành

**Bước 3.1 — Setup package `@wr/database`**

```bash
cd packages\database
```

Tạo `packages/database/package.json`:

```json
{
  "name": "@wr/database",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build":       "prisma generate && tsc --build",
    "generate":    "prisma generate",
    "migrate:dev": "prisma migrate dev",
    "push":        "prisma db push",
    "seed":        "ts-node prisma/seed.ts",
    "studio":      "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^7.9.0"
  },
  "devDependencies": {
    "prisma":     "^7.9.0",
    "ts-node":    "^10.9.2",
    "typescript": "^5.8.3"
  }
}
```

**Bước 3.2 — Tạo `packages/database/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

**Bước 3.3 — Tạo Prisma Schema**

Tạo file `packages/database/prisma/schema.prisma`:

```prisma
// ─── Generator & Datasource ───────────────────────────────────────
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]  // pgvector extension
}

// ═══════════════════════════════════════════════════════
// Users & Organizations
// ═══════════════════════════════════════════════════════

model User {
  id           String   @id @default(uuid())
  email        String   @unique(map: "uq_users_email")
  displayName  String   @map("display_name")
  role         String   // "ADMIN" | "HR_MANAGER" | "DEPARTMENT_HEAD" | "CANDIDATE"
  passwordHash String?  @map("password_hash")
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  organization   Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  orgId          String       @map("org_id")
  department     Department?  @relation(fields: [deptId], references: [id], onDelete: SetNull)
  deptId         String?      @map("dept_id")

  requestsCreated  RecruitmentRequest[] @relation("CreatedBy")
  requestsReviewed RecruitmentRequest[] @relation("ReviewedBy")
  notifications    Notification[]

  @@index([orgId], map: "idx_users_org")
  @@map("users")  // tên bảng trong database
}

model Organization {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique(map: "uq_orgs_slug")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  users       User[]
  departments Department[]

  @@map("organizations")
}

model Department {
  id        String   @id @default(uuid())
  name      String
  code      String   // "ENG", "HR", "PRODUCT"
  orgId     String   @map("org_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  organization Organization         @relation(fields: [orgId], references: [id], onDelete: Cascade)
  users        User[]
  requests     RecruitmentRequest[]

  @@unique([orgId, code], map: "uq_dept_org_code")
  @@map("departments")
}

// ═══════════════════════════════════════════════════════
// Recruitment Workflow
// ═══════════════════════════════════════════════════════

model RecruitmentRequest {
  id          String   @id @default(uuid())
  position    String
  headcount   Int
  description String   @db.Text
  urgency     String   // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  status      String   @default("DRAFT")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  department   Department @relation(fields: [deptId], references: [id], onDelete: Cascade)
  deptId       String     @map("dept_id")
  createdBy    User       @relation("CreatedBy", fields: [createdById], references: [id], onDelete: Cascade)
  createdById  String     @map("created_by_id")
  reviewedBy   User?      @relation("ReviewedBy", fields: [reviewedById], references: [id], onDelete: SetNull)
  reviewedById String?    @map("reviewed_by_id")

  logs RequestLog[]
  plan OverallPlan?

  @@index([deptId], map: "idx_requests_dept")
  @@index([status], map: "idx_requests_status")
  @@map("recruitment_requests")
}

model RequestLog {
  id          String   @id @default(uuid())
  action      String
  fromStatus  String?  @map("from_status")
  toStatus    String?  @map("to_status")
  note        String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")

  request   RecruitmentRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  requestId String             @map("request_id")

  @@index([requestId], map: "idx_logs_request")
  @@map("request_logs")
}

model OverallPlan {
  id        String   @id @default(uuid())
  startDate DateTime @map("start_date")
  endDate   DateTime @map("end_date")
  status    String   @default("DRAFT")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  request   RecruitmentRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  requestId String             @unique @map("request_id")

  @@map("overall_plans")
}

// ═══════════════════════════════════════════════════════
// Notifications
// ═══════════════════════════════════════════════════════

model Notification {
  id        String   @id @default(uuid())
  title     String
  body      String   @db.Text
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String @map("user_id")

  @@index([userId], map: "idx_notif_user")
  @@map("notifications")
}
```

**Hiểu Schema này:**
- `@id` — khóa chính
- `@default(uuid())` — tự sinh UUID
- `@unique` — không trùng lặp
- `@map("snake_case")` — tên cột trong DB (Prisma dùng camelCase trong code)
- `@@map("table_name")` — tên bảng trong DB
- `@relation` — định nghĩa liên kết giữa các bảng
- `onDelete: Cascade` — xóa record cha → tự xóa record con

**Bước 3.4 — Tạo `packages/database/src/index.ts`**

```typescript
// ─── @wr/database — Prisma Client Factory ──────────────────────
// Kết nối trực tiếp PostgreSQL qua DATABASE_URL (không dùng Accelerate)

import { PrismaClient } from '@prisma/client';

type LogLevel = 'query' | 'warn' | 'error';

/**
 * Trả về options cho PrismaClient constructor.
 * Mỗi microservice's PrismaService gọi: super(getPrismaClientOptions())
 */
export const getPrismaClientOptions = () => ({
  log: (process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error']) as LogLevel[],
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

export { PrismaClient };
export * from '@prisma/client';
```

**Bước 3.5 — Tạo `prisma.config.ts` (root)**

```typescript
import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: 'packages/database/prisma/schema.prisma',
  migrations: {
    path: 'packages/database/prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'] ?? '',
  },
});
```

**Bước 3.6 — Tạo `.env`**

```env
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/rms_db?schema=public
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=my-super-secret-key-dev
```

**Bước 3.7 — Cài dependencies và chạy migration**

```bash
cd D:\Projects\rms-learn
npm install

# Generate Prisma Client (tạo TypeScript types từ schema)
npm run db:generate

# Chạy migration (tạo bảng trong DB)
npm run db:migrate
# Khi hỏi tên migration: nhập "init"
```

**Bước 3.8 — Kiểm tra bằng Prisma Studio**

```bash
cd packages/database
npx prisma studio
# Mở trình duyệt: http://localhost:5555
```

### ✅ Kiểm tra Module 3

Bạn sẽ thấy Prisma Studio hiển thị các bảng:
- `users`, `organizations`, `departments`
- `recruitment_requests`, `request_logs`, `overall_plans`
- `notifications`

---

## 🏗 Module 4: NestJS Cơ Bản

### 🧠 Lý thuyết — NestJS là gì?

**NestJS** là framework Node.js xây dựng trên Express, dùng **Dependency Injection** và **Decorator pattern** (giống Angular/Spring Boot).

**Các khái niệm cốt lõi:**

```
Module       ← Nhóm các tính năng liên quan
  ├── Controller ← Nhận request, trả response
  ├── Service    ← Business logic
  └── Provider   ← Bất kỳ class nào có thể inject (Service, Repository...)
```

**Ví dụ đơn giản:**

```typescript
// users.service.ts — Business Logic
@Injectable()
export class UsersService {
  async findById(id: string) {
    return { id, name: 'Alice' };
  }
}

// users.controller.ts — Nhận HTTP request
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {} // Dependency Injection

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);  // Gọi service
  }
}

// users.module.ts — Ghép lại
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
```

**Decorator** là các annotation `@Injectable()`, `@Controller()`, `@Get()` — chúng thêm metadata vào class/method.

### 🔨 Thực hành — Tạo Identity Service

**Bước 4.1 — Setup package `@wr/identity`**

```bash
cd services\identity
```

Tạo `services/identity/package.json`:

```json
{
  "name": "@wr/identity",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build":     "nest build",
    "dev":       "nest start --watch",
    "start":     "node dist/main",
    "typecheck": "tsc --noEmit",
    "clean":     "rm -rf dist .turbo"
  },
  "dependencies": {
    "@nestjs/common":        "^11.1.0",
    "@nestjs/core":          "^11.1.0",
    "@nestjs/microservices": "^11.1.0",
    "@nestjs/jwt":           "^11.0.0",
    "@wr/database":          "*",
    "@wr/contracts":         "*",
    "bcryptjs":              "^2.4.3",
    "reflect-metadata":      "^0.2.2",
    "rxjs":                  "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli":        "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@types/bcryptjs":    "^2.4.6",
    "@types/node":        "^22.15.0",
    "typescript":         "^5.8.3"
  }
}
```

**Bước 4.2 — Tạo `services/identity/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  },
  "include": ["src/**/*"]
}
```

**Bước 4.3 — Tạo `PrismaService` (dùng chung pattern cho tất cả services)**

`services/identity/src/common/database/prisma.service.ts`:

```typescript
// PrismaService: Wrapper quanh PrismaClient, tích hợp với NestJS lifecycle
// - onModuleInit: kết nối DB khi service khởi động
// - onModuleDestroy: ngắt kết nối khi service tắt

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { getPrismaClientOptions, PrismaClient } from '@wr/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    // Gọi constructor PrismaClient với options (DATABASE_URL, logging)
    super(getPrismaClientOptions());
  }

  async onModuleInit() {
    await this.$connect(); // Kết nối database
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Ngắt kết nối khi shutdown
  }
}
```

`services/identity/src/common/database/database.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// @Global() → PrismaService có thể inject ở BẤT KỲ module nào
// mà không cần import DatabaseModule lặp lại
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
```

**Bước 4.4 — Tạo Users Module**

`services/identity/src/modules/users/users.service.ts`:

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    email: string;
    password: string;
    displayName: string;
    role: string;
    orgId: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: {
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        passwordHash,
        orgId: data.orgId,
      },
    });
  }
}
```

**Bước 4.5 — Tạo main.ts**

`services/identity/src/main.ts`:

```typescript
import 'reflect-metadata'; // Bắt buộc cho NestJS decorators
import { NestFactory } from '@nestjs/core';
import { IdentityModule } from './identity.module';

async function bootstrap() {
  const app = await NestFactory.create(IdentityModule);
  await app.listen(3010);
  console.log('Identity service running on :3010');
}
bootstrap();
```

### ✅ Kiểm tra Module 4

```bash
cd D:\Projects\rms-learn
npm install
npm run dev:identity
# Terminal hiển thị: Identity service running on :3010
```

---

## 🔌 Module 5: NestJS Microservices (TCP)

### 🧠 Lý thuyết — Microservices là gì?

**Microservices** = Tách ứng dụng thành nhiều service nhỏ, mỗi service có trách nhiệm riêng.

```
Client (Browser)
    ↓ HTTP
Gateway (:3001)          ← Cổng vào duy nhất
    ├─ TCP → Identity (:3010)    "users.find-by-id"
    ├─ TCP → Recruiting (:3011)  "recruiting.create"
    └─ TCP → Profiles (:3012)    "profiles.search"
```

**Tại sao dùng TCP thay HTTP nội bộ?**
- Nhẹ hơn (không có HTTP headers)
- Được tích hợp sẵn trong NestJS `@nestjs/microservices`
- Phù hợp cho internal communication (không phải public API)

**Message Pattern:**
```typescript
// Microservice: lắng nghe message
@MessagePattern('users.find-by-id')
async findById(@Payload() id: string) { ... }

// Gateway: gửi message
const user = await firstValueFrom(
  this.identityClient.send('users.find-by-id', userId)
);
```

### 🔨 Thực hành

**Bước 5.1 — Chuyển Identity thành Microservice**

Sửa `services/identity/src/main.ts`:

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { IdentityModule } from './identity.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    IdentityModule,
    {
      transport: Transport.TCP,  // Dùng TCP
      options: {
        host: '0.0.0.0',
        port: 3010,
      },
    },
  );
  await app.listen();
  console.log('Identity microservice listening on TCP :3010');
}
bootstrap();
```

**Bước 5.2 — Tạo Identity Controller (MessagePattern)**

`services/identity/src/modules/users/users.controller.ts`:

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

// Chú ý: KHÔNG có @Get(), @Post() ở đây!
// Chỉ dùng @MessagePattern() cho microservices
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('users.find-by-id')
  async findById(@Payload() id: string) {
    return this.usersService.findById(id);
  }

  @MessagePattern('users.find-by-email')
  async findByEmail(@Payload() email: string) {
    return this.usersService.findByEmail(email);
  }

  @MessagePattern('users.create')
  async create(@Payload() data: {
    email: string;
    password: string;
    displayName: string;
    role: string;
    orgId: string;
  }) {
    return this.usersService.create(data);
  }
}
```

**Bước 5.3 — Tạo Gateway Service**

Tạo `services/gateway/package.json`:

```json
{
  "name": "@wr/gateway",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev":   "nest start --watch",
    "start": "node dist/main"
  },
  "dependencies": {
    "@nestjs/common":            "^11.1.0",
    "@nestjs/core":              "^11.1.0",
    "@nestjs/platform-express":  "^11.1.0",
    "@nestjs/microservices":     "^11.1.0",
    "@nestjs/swagger":           "^11.2.0",
    "@nestjs/jwt":               "^11.0.0",
    "class-transformer":         "^0.5.1",
    "class-validator":           "^0.14.1",
    "reflect-metadata":          "^0.2.2",
    "rxjs":                      "^7.8.1",
    "@wr/contracts":             "*"
  }
}
```

**Bước 5.4 — Gateway kết nối tới Identity microservice**

`services/gateway/src/gateway.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersGatewayController } from './controllers/users.controller';

// SERVICE_TOKENS — định danh cho từng TCP client
export const IDENTITY_SERVICE = 'IDENTITY_SERVICE';

@Module({
  imports: [
    // Đăng ký TCP client để kết nối tới Identity service
    ClientsModule.register([
      {
        name: IDENTITY_SERVICE,     // Token để inject
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3010,              // Port của Identity service
        },
      },
    ]),
  ],
  controllers: [UsersGatewayController],
})
export class GatewayModule {}
```

**Bước 5.5 — Gateway Controller (HTTP)**

`services/gateway/src/controllers/users.controller.ts`:

```typescript
import {
  Controller, Get, Post, Body, Param,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { IDENTITY_SERVICE } from '../gateway.module';

// Gateway controller: NHẬN HTTP, PROXY sang TCP
@Controller('api/v1/users')
export class UsersGatewayController {
  constructor(
    // Inject TCP client cho Identity service
    @Inject(IDENTITY_SERVICE) private readonly identityClient: ClientProxy,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // Gửi message tới Identity service qua TCP
    // firstValueFrom() chuyển Observable → Promise
    return firstValueFrom(
      this.identityClient.send('users.find-by-id', id)
    );
  }

  @Post()
  async create(@Body() body: {
    email: string;
    password: string;
    displayName: string;
    role: string;
    orgId: string;
  }) {
    return firstValueFrom(
      this.identityClient.send('users.create', body)
    );
  }
}
```

**Bước 5.6 — Gateway main.ts (HTTP server)**

`services/gateway/src/main.ts`:

```typescript
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';

async function bootstrap() {
  // Gateway là HTTP server (khác với microservices dùng TCP)
  const app = await NestFactory.create(GatewayModule);

  app.enableCors({ origin: 'http://localhost:3000' });

  await app.listen(3001);
  console.log('Gateway HTTP server on http://localhost:3001');
}
bootstrap();
```

### ✅ Kiểm tra Module 5

```bash
# Terminal 1: Chạy Identity
npm run dev:identity

# Terminal 2: Chạy Gateway
npm run dev:gateway

# Test API
curl http://localhost:3001/api/v1/users/some-id
```

---

## 🔐 Module 6: JWT Authentication

### 🧠 Lý thuyết — JWT là gì?

**JWT (JSON Web Token)** = Token chứa thông tin người dùng, ký bằng secret key.

```
Header.Payload.Signature

Payload chứa: { userId, role, email, exp (expiry) }
```

**Flow đăng nhập:**
```
1. User gửi email + password → POST /api/v1/auth/login
2. Gateway → Identity service: "auth.login" { email, password }
3. Identity: verify password → tạo JWT token
4. Trả JWT token về client
5. Client gửi mọi request với: Authorization: Bearer <token>
6. Gateway: verify token → extract userId, role → cho phép tiếp tục
```

### 🔨 Thực hành

**Bước 6.1 — Auth Service trong Identity**

`services/identity/src/modules/auth/auth.service.ts`:

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    // 1. Tìm user theo email
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // 2. So sánh password với hash trong DB
    const isValid = await bcrypt.compare(password, user.passwordHash ?? '');
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    // 3. Tạo JWT access token
    const payload = {
      sub: user.id,      // subject = userId
      role: user.role,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }
}
```

**Bước 6.2 — JWT Guard trong Gateway**

`services/gateway/src/auth/jwt.guard.ts`:

```typescript
import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Lấy token từ Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify và decode token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // Gắn thông tin user vào request (dùng ở controllers sau)
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

**Bước 6.3 — Dùng Guard trong Controller**

```typescript
@UseGuards(JwtGuard)      // Protect endpoint này
@Get(':id')
async findOne(@Param('id') id: string, @Request() req) {
  console.log('Current user:', req.user.role); // { sub, role, email }
  return firstValueFrom(this.identityClient.send('users.find-by-id', id));
}
```

---

## ⚙️ Module 7: BullMQ Background Jobs

### 🧠 Lý thuyết — Background Jobs là gì?

**Background Jobs** = Tác vụ chạy nền, không block HTTP response.

Ví dụ: Upload CV → parse text → generate vector embedding (mất 5–30 giây).  
Thay vì để user chờ 30s, ta:
1. Upload CV → trả về response ngay (200 OK)
2. Đẩy job vào Redis queue
3. Worker process lấy job từ queue và xử lý nền

**BullMQ** là job queue library dùng Redis làm backend.

```
API: "Đã nhận CV" →→→ Redis Queue
                            ↓
                        Worker process
                        (xử lý nền, không block API)
```

### 🔨 Thực hành

**Bước 7.1 — Định nghĩa Job Types trong `@wr/queue`**

`packages/queue/src/index.ts`:

```typescript
// Tên queues
export const QUEUES = {
  CV_PROCESSING: 'cv-processing',
} as const;

// Job data types (TypeScript type safety)
export interface ParseCvJobData {
  cvId: string;
  filePath: string;
  candidateId: string;
}
```

**Bước 7.2 — Enqueue job từ CV service**

```typescript
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES, ParseCvJobData } from '@wr/queue';

@Injectable()
export class CvService {
  constructor(
    @InjectQueue(QUEUES.CV_PROCESSING) private readonly cvQueue: Queue,
  ) {}

  async uploadCv(cvId: string, filePath: string, candidateId: string) {
    // Lưu metadata vào DB trước
    // ...

    // Đẩy job vào queue (không await — non-blocking!)
    await this.cvQueue.add('parse-cv', {
      cvId,
      filePath,
      candidateId,
    } satisfies ParseCvJobData);

    return { message: 'CV uploaded, processing in background' };
  }
}
```

**Bước 7.3 — Worker xử lý job**

`services/worker/src/processors/cv.processor.ts`:

```typescript
import { Worker, Job } from 'bullmq';
import { QUEUES, ParseCvJobData } from '@wr/queue';

// Worker là plain TypeScript — KHÔNG phải NestJS
const worker = new Worker<ParseCvJobData>(
  QUEUES.CV_PROCESSING,
  async (job: Job<ParseCvJobData>) => {
    console.log(`Processing CV job ${job.id}:`, job.data);

    const { cvId, filePath } = job.data;

    // 1. Đọc file PDF/DOCX
    // 2. Extract text
    // 3. Generate vector embedding
    // 4. Lưu vào DB

    console.log(`CV ${cvId} processed successfully`);
  },
  {
    connection: {
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
    },
  },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
```

---

## ⚛️ Module 8: React + Vite Frontend

### 🧠 Lý thuyết

**React**: UI library dựa trên component.  
**Vite**: Dev server cực nhanh (thay thế Create React App).  
**React Router v7**: SPA routing.

### 🔨 Thực hành

**Bước 8.1 — Setup webapp**

```bash
cd D:\Projects\rms-learn\webapp
npm create vite@latest . -- --template react-ts
```

**Bước 8.2 — Cấu hình Vite proxy** (`webapp/vite.config.ts`)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy /api/* → Gateway :3001
      // → Tránh CORS issues trong dev
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

**Bước 8.3 — API client**

`webapp/src/lib/api.ts`:

```typescript
const API_BASE = '/api/v1';

// Lấy JWT token từ localStorage
const getToken = () => localStorage.getItem('access_token');

// Generic fetch helper với auth header
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Users API
export const usersApi = {
  me: () => apiFetch<any>('/users/me'),
};
```

---

## 🔗 Module 9: Tích Hợp Toàn Bộ

### Bước 9.1 — Thêm Scripts vào Root `package.json`

```json
{
  "scripts": {
    "dev":              "turbo run dev",
    "dev:gateway":      "npm --workspace=@wr/gateway run dev",
    "dev:identity":     "npm --workspace=@wr/identity run dev",
    "dev:recruiting":   "npm --workspace=@wr/recruiting run dev",
    "dev:worker":       "npm --workspace=@wr/worker run dev",
    "dev:webapp":       "npm --workspace=@wr/webapp run dev",
    "build":            "turbo run build",
    "db:generate":      "npm --workspace=@wr/database run generate",
    "db:migrate":       "npm --workspace=@wr/database run migrate:dev",
    "db:seed":          "npm --workspace=@wr/database run seed",
    "docker:up":        "docker compose up -d",
    "docker:down":      "docker compose down"
  }
}
```

### Bước 9.2 — Thứ Tự Chạy

```bash
# 1. Docker (PostgreSQL + Redis)
npm run docker:up

# 2. Kiểm tra healthy
docker compose ps

# 3. Database migrations
npm run db:migrate

# 4. Seed data
npm run db:seed

# 5. Chạy tất cả (Turborepo tự xử lý thứ tự)
npm run dev
```

### Bước 9.3 — Kiểm Tra Tổng Thể

```bash
# Gateway health
curl http://localhost:3001/health

# Đăng nhập
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"password123"}'

# Webapp
# → Mở http://localhost:3000
```

---

## 🎯 Checklist Từng Module

### Module 1 — Turborepo
- [ ] Tạo `package.json` root với workspaces
- [ ] Tạo `turbo.json` với task pipeline
- [ ] Tạo `tsconfig.base.json`
- [ ] `npm install` thành công

### Module 2 — Docker
- [ ] Tạo `docker-compose.yml` (PostgreSQL + Redis)
- [ ] `docker compose up -d` thành công
- [ ] Cả 2 containers trạng thái `healthy`

### Module 3 — Prisma
- [ ] Tạo `packages/database/prisma/schema.prisma`
- [ ] Tạo `packages/database/src/index.ts` với `getPrismaClientOptions()`
- [ ] `npm run db:generate` thành công
- [ ] `npm run db:migrate` tạo bảng trong DB
- [ ] Prisma Studio hiển thị bảng đúng

### Module 4 — NestJS Cơ Bản
- [ ] Tạo `PrismaService` với `OnModuleInit/Destroy`
- [ ] Tạo `DatabaseModule` với `@Global()`
- [ ] Tạo `UsersService` với CRUD cơ bản
- [ ] Identity service khởi động không lỗi

### Module 5 — Microservices
- [ ] Identity chạy TCP `:3010`
- [ ] Gateway chạy HTTP `:3001`
- [ ] Gateway proxy thành công tới Identity qua TCP
- [ ] `curl http://localhost:3001/api/v1/users/:id` trả dữ liệu

### Module 6 — JWT Auth
- [ ] `POST /auth/login` trả JWT token
- [ ] `JwtGuard` protect endpoint
- [ ] Token hết hạn trả 401

### Module 7 — BullMQ
- [ ] Job được enqueue vào Redis queue
- [ ] Worker nhận và xử lý job
- [ ] Kiểm tra qua Redis CLI: `LLEN bull:cv-processing:wait`

### Module 8 — Frontend
- [ ] Vite dev server chạy `:3000`
- [ ] Proxy `/api` → `:3001` hoạt động
- [ ] Form đăng nhập gọi API thành công

### Module 9 — Integration
- [ ] `npm run dev` khởi động tất cả services
- [ ] Flow đăng nhập end-to-end hoạt động

---

## 📚 Tài Liệu Tham Khảo

| Chủ đề | Link |
|--------|------|
| NestJS Official | https://docs.nestjs.com |
| Prisma Docs | https://www.prisma.io/docs |
| Turborepo | https://turbo.build/repo/docs |
| BullMQ | https://docs.bullmq.io |
| React Router v7 | https://reactrouter.com |
| Docker Compose | https://docs.docker.com/compose |

---

> 💡 **Tip:** Mỗi khi không hiểu một phần, hãy tra cứu docs và thử thay đổi code nhỏ để xem điều gì xảy ra. Đó là cách học nhanh nhất!

*Cập nhật: 2026-10-15 | Works Reruiter RMS — Learning Guide v1.0*
