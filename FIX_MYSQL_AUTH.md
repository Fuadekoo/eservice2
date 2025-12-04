# Fix MySQL Authentication Plugin Error

## Problem
The error `Unknown authentication plugin 'sha256_password'` occurs because Prisma doesn't support MySQL's `sha256_password` authentication plugin by default.

## Solutions

### Solution 1: Change MySQL User Authentication (Recommended)

Run these SQL commands in your MySQL/MariaDB database to change the user authentication plugin:

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Change authentication plugin to mysql_native_password
ALTER USER 'your_username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

Replace:
- `your_username` with your MySQL username
- `your_password` with your MySQL password
- `localhost` with `%` if you're connecting from a remote host

### Solution 2: Update DATABASE_URL Connection String

Add connection parameters to your `.env` file's `DATABASE_URL`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/mydb?authPlugin=mysql_native_password"
```

Or if using connection pooling:

```env
DATABASE_URL="mysql://username:password@localhost:3306/mydb?authPlugin=mysql_native_password&connection_limit=10"
```

### Solution 3: Create a New User with mysql_native_password

```sql
CREATE USER 'prisma_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'secure_password';
GRANT ALL PRIVILEGES ON mydb.* TO 'prisma_user'@'localhost';
FLUSH PRIVILEGES;
```

Then update your `.env`:
```env
DATABASE_URL="mysql://prisma_user:secure_password@localhost:3306/mydb"
```

### Solution 4: Check Current User Authentication

To see what authentication plugin your user is using:

```sql
SELECT user, host, plugin FROM mysql.user WHERE user = 'your_username';
```

## After Fixing

1. Update your `.env` file with the correct DATABASE_URL
2. Test the connection:
   ```bash
   npx prisma db pull
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

## Notes

- `mysql_native_password` is the legacy but widely supported authentication method
- `sha256_password` is newer but not supported by all MySQL clients
- For production, consider using SSL/TLS with mysql_native_password for security

