# Quick Fix for MySQL Authentication Error

## The Problem
```
Error: Schema engine error:
Error querying the database: Unknown authentication plugin `sha256_password'.
```

## Quick Solution

### Step 1: Connect to MySQL
```bash
mysql -u root -p
```

### Step 2: Change Your User's Authentication Plugin
Replace `your_username` and `your_password` with your actual credentials:

```sql
ALTER USER 'your_username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

If connecting from remote:
```sql
ALTER USER 'your_username'@'%' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Step 3: Verify the Change
```sql
SELECT user, host, plugin FROM mysql.user WHERE user = 'your_username';
```

You should see `plugin` as `mysql_native_password`.

### Step 4: Update Your .env File
Make sure your `DATABASE_URL` in `.env` is correct:
```env
DATABASE_URL="mysql://your_username:your_password@localhost:3306/mydb"
```

### Step 5: Test the Connection
```bash
npx prisma db pull
```

### Step 6: Run Migration
```bash
npx prisma migrate dev
```

## Alternative: Create New User
If you can't modify the existing user, create a new one:

```sql
CREATE USER 'prisma_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'secure_password_here';
GRANT ALL PRIVILEGES ON mydb.* TO 'prisma_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update `.env`:
```env
DATABASE_URL="mysql://prisma_user:secure_password_here@localhost:3306/mydb"
```

## Note
This works with NextAuth.js (auth.js) - the authentication plugin change only affects how Prisma connects to the database, not your application's authentication flow.

