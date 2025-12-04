# Prisma Reinstallation Guide

## ✅ Step 1: Removal Complete

I've removed:

- ✅ Prisma packages from package.json
- ✅ prisma.config.ts file
- ✅ Temporarily disabled lib/db.ts

## 📋 Step 2: Clean Installation

### 1. Install Prisma CLI and Client

```bash
npm install prisma --save-dev
npm install @prisma/client
```

### 2. Initialize Prisma (with standard setup)

```bash
npx prisma init
```

This will:

- Create a new `prisma/schema.prisma` file
- Create a `.env` file (if it doesn't exist) with DATABASE_URL

### 3. Configure Your Schema

Edit `prisma/schema.prisma` to match your database:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  username  String   @unique
  password  String
  role      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 4. Configure DATABASE_URL in `.env`

Make sure your `.env` file has:

```env
DATABASE_URL="mysql://username:password@localhost:3306/mydb"
```

**IMPORTANT**: Use a user with `mysql_native_password` authentication to avoid the sha256_password error!

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Create Migration (if database exists)

```bash
npx prisma migrate dev --name init
```

Or if you want to sync without migration:

```bash
npx prisma db push
```

### 7. Restore lib/db.ts

After Prisma is installed, restore `lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

## 🔧 Fix MySQL Authentication Issue

Before running migrations, make sure your MySQL user uses `mysql_native_password`:

```sql
ALTER USER 'your_username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

Or create a new user:

```sql
CREATE USER 'prisma_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'secure_password';
GRANT ALL PRIVILEGES ON mydb.* TO 'prisma_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update `.env`:

```env
DATABASE_URL="mysql://prisma_user:secure_password@localhost:3306/mydb"
```

## ✅ Verification

After installation:

1. Check Prisma Client is generated: `ls node_modules/.prisma/client`
2. Test connection: `npx prisma db pull`
3. Run migrations: `npx prisma migrate dev`
