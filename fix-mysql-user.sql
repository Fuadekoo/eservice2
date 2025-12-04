-- ============================================
-- FIX MySQL Authentication Plugin Error
-- ============================================
-- Run this script as MySQL root user
-- Replace YOUR_USERNAME and YOUR_PASSWORD with your actual values

-- Step 1: Check current users and their plugins
SELECT user, host, plugin FROM mysql.user WHERE plugin = 'sha256_password';

-- Step 2: Fix user for localhost connection
-- ALTER USER 'YOUR_USERNAME'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YOUR_PASSWORD';

-- Step 3: Fix user for remote connections (if needed)
-- ALTER USER 'YOUR_USERNAME'@'%' IDENTIFIED WITH mysql_native_password BY 'YOUR_PASSWORD';

-- Step 4: Create new Prisma user (RECOMMENDED - uncomment and modify)
-- CREATE USER 'prisma_app'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourSecurePassword123!';
-- GRANT ALL PRIVILEGES ON mydb.* TO 'prisma_app'@'localhost';
-- FLUSH PRIVILEGES;

-- Step 5: Verify the fix
SELECT user, host, plugin FROM mysql.user WHERE user = 'prisma_app' OR user LIKE '%prisma%';

-- Step 6: Show the DATABASE_URL to use
SELECT CONCAT('DATABASE_URL="mysql://prisma_app:YourSecurePassword123!@localhost:3306/mydb"') AS 'Update your .env file with this:';

