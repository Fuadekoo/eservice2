#!/bin/bash

# Quick Fix Script for MySQL Authentication Plugin Error
# This script helps you fix the sha256_password authentication issue

echo "=========================================="
echo "MySQL Authentication Plugin Fix"
echo "=========================================="
echo ""
echo "This will help you fix the 'sha256_password' authentication error."
echo ""
read -p "Enter your MySQL username: " MYSQL_USER
read -sp "Enter your MySQL password: " MYSQL_PASS
echo ""
read -p "Enter your MySQL host (default: localhost): " MYSQL_HOST
MYSQL_HOST=${MYSQL_HOST:-localhost}
read -p "Enter your database name (default: mydb): " DB_NAME
DB_NAME=${DB_NAME:-mydb}

echo ""
echo "Connecting to MySQL..."
echo ""

# Create SQL file
SQL_FILE=$(mktemp)
cat > "$SQL_FILE" << EOF
-- Fix MySQL Authentication Plugin
ALTER USER '${MYSQL_USER}'@'${MYSQL_HOST}' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PASS}';
FLUSH PRIVILEGES;

-- Verify the change
SELECT user, host, plugin FROM mysql.user WHERE user = '${MYSQL_USER}';
EOF

echo "Running SQL commands..."
mysql -u root -p < "$SQL_FILE"

echo ""
echo "=========================================="
echo "Fix completed!"
echo "=========================================="
echo ""
echo "Your DATABASE_URL should be:"
echo "mysql://${MYSQL_USER}:${MYSQL_PASS}@${MYSQL_HOST}:3306/${DB_NAME}"
echo ""
echo "Now try running: npx prisma migrate dev"

# Clean up
rm "$SQL_FILE"

