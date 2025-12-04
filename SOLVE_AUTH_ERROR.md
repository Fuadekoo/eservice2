# 🔧 DIRECT FIX: MySQL Authentication Plugin Error

## The Error
```
Error: Schema engine error:
Error querying the database: Unknown authentication plugin `sha256_password'.
```

## ✅ IMMEDIATE SOLUTION

### Step 1: Open MySQL Command Line
```bash
mysql -u root -p
```
Enter your MySQL root password when prompted.

### Step 2: Find Your Database User
First, check what users exist and their authentication plugins:
```sql
SELECT user, host, plugin FROM mysql.user;
```

Look for your database user (the one used in your DATABASE_URL).

### Step 3: Fix the Authentication Plugin
Replace the user below with YOUR actual MySQL username from your DATABASE_URL:

```sql
-- Option A: If your user is connecting from localhost
ALTER USER 'YOUR_USERNAME'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YOUR_PASSWORD';
FLUSH PRIVILEGES;

-- Option B: If your user can connect from anywhere (use %)
ALTER USER 'YOUR_USERNAME'@'%' IDENTIFIED WITH mysql_native_password BY 'YOUR_PASSWORD';
FLUSH PRIVILEGES;

-- Option C: Create a new user if you don't know the current one
CREATE USER 'prisma_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_secure_password';
GRANT ALL PRIVILEGES ON mydb.* TO 'prisma_user'@'localhost';
FLUSH PRIVILEGES;
```

### Step 4: Verify the Fix
```sql
SELECT user, host, plugin FROM mysql.user WHERE plugin = 'sha256_password';
```

If this returns no rows, all users are fixed!

### Step 5: Update Your .env File
Update your `.env` file with the correct DATABASE_URL:
```env
DATABASE_URL="mysql://prisma_user:your_secure_password@localhost:3306/mydb"
```

### Step 6: Test Connection
```bash
npx prisma db pull
```

### Step 7: Run Migration
```bash
npx prisma migrate dev
```

## 🚀 Quick Alternative: Create New User Script

If you want to create a fresh user just for Prisma:

```sql
-- Run this in MySQL as root
CREATE USER IF NOT EXISTS 'prisma_app'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON mydb.* TO 'prisma_app'@'localhost';
FLUSH PRIVILEGES;
SELECT 'User created! Update your .env file with:' AS message;
SELECT CONCAT('DATABASE_URL="mysql://prisma_app:ChangeThisPassword123!@localhost:3306/mydb"') AS env_line;
```

## ⚠️ Important Notes

1. **Replace placeholders**: Change `YOUR_USERNAME`, `YOUR_PASSWORD`, and database name in all commands
2. **Check your DATABASE_URL**: Look in your `.env` file to see what user you're using
3. **Root access needed**: You need MySQL root access to change user authentication
4. **This won't break NextAuth.js**: The change only affects database connection, not your app auth

## 🔍 If You Don't Know Your MySQL Username

Check your `.env` file for DATABASE_URL:
```
DATABASE_URL="mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE"
```

The USERNAME part is what you need to fix!

