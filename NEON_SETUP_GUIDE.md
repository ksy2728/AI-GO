# 🚀 Neon PostgreSQL Setup Guide - Phase 1

## 📌 Current Status
- **Date**: 2025-09-07
- **Local PostgreSQL**: ✅ Working (localhost:5433)
- **Neon PostgreSQL**: ⏳ Pending Setup
- **Production**: Using GitHub data source

---

## 🎯 Phase 1: Neon Account & Database Setup (30 minutes)

### Step 1: Create Neon Account (5 minutes)

1. **Open Browser** (Chrome/Edge in incognito mode recommended)
   ```
   https://neon.tech
   ```

2. **Sign Up Options**:
   - **Option A (Recommended)**: Sign up with GitHub
   - **Option B**: Sign up with Email

3. **Complete Registration**:
   - Verify email (if using email signup)
   - Accept terms of service
   - Choose Free plan (3GB storage, perfect for our needs)

### Step 2: Create Database Project (10 minutes)

1. **Click "New Project"** in Neon Dashboard

2. **Configure Project**:
   ```yaml
   Project Name: ai-go-production
   PostgreSQL Version: 16 (latest stable)
   Region: US East (Ohio) - us-east-2
   Database Name: ai_server_db
   ```

3. **Advanced Settings** (optional but recommended):
   ```yaml
   Compute Size: 0.25 vCPU (Free tier)
   Autosuspend: 5 minutes
   History Retention: 7 days
   ```

4. **Click "Create Project"**
   - Wait for provisioning (30-60 seconds)
   - **IMPORTANT**: Save the password shown! It's only displayed once.

### Step 3: Copy Connection Strings (5 minutes)

After project creation, you'll see the connection details page.

1. **Find Your Connection Strings**:
   
   **Pooled Connection** (for Vercel/Production):
   ```
   postgresql://[username]:[password]@[project-id].pooler.us-east-2.aws.neon.tech/ai_server_db?sslmode=require
   ```
   
   **Direct Connection** (for Migrations):
   ```
   postgresql://[username]:[password]@[project-id].us-east-2.aws.neon.tech/ai_server_db?sslmode=require
   ```

2. **Save These Securely**:
   - Copy both connection strings
   - Save in a password manager
   - You'll need them for the next steps

### Step 4: Configure Local Environment (10 minutes)

#### Option A: Automated Setup (Recommended)
```bash
# Run the setup script
node scripts/setup-neon.js
```
The script will:
- Guide you through the process
- Update your .env.local automatically
- Test the connection
- Provide next steps

#### Option B: Manual Setup

1. **Update .env.local**:
   ```env
   # Add these lines (replace with your actual connection strings)
   DATABASE_URL="postgresql://[your-pooled-connection-string]"
   DIRECT_URL="postgresql://[your-direct-connection-string]"
   DATA_SOURCE=database
   ```

2. **Test Connection**:
   ```bash
   # Test with Prisma
   npx prisma db pull
   
   # If successful, you'll see:
   # "Introspection completed"
   ```

3. **Run Connection Test**:
   ```bash
   node scripts/test-neon-connection.js
   ```

---

## ✅ Checkpoint - Phase 1 Complete

Before proceeding to Phase 2, verify:

- [ ] Neon account created
- [ ] Project "ai-go-production" created
- [ ] Connection strings saved securely
- [ ] .env.local updated with Neon URLs
- [ ] Connection test successful

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Connection Timeout
```
Error: Connection timeout
```
**Solution**: Check if your IP is allowed. Neon allows all IPs by default, but check Settings > IP Allow.

#### 2. Authentication Failed
```
Error: password authentication failed
```
**Solution**: 
- Verify password is correct (no extra spaces)
- Check connection string format
- Ensure SSL mode is set to 'require'

#### 3. Database Not Found
```
Error: database "ai_server_db" does not exist
```
**Solution**: 
- Check database name in Neon dashboard
- Ensure you're using the correct project

#### 4. SSL Connection Required
```
Error: SSL connection is required
```
**Solution**: Add `?sslmode=require` to your connection string

---

## 📊 Neon Dashboard Navigation

### Key Sections to Know:

1. **Dashboard** (`/app/projects/[project-id]`)
   - Overview of your database
   - Quick connection info
   - Usage metrics

2. **Connection Details** (`/connection-details`)
   - Full connection strings
   - Password reset option
   - Connection pooler settings

3. **Tables** (`/tables`)
   - View all tables (empty initially)
   - Run SQL queries
   - Import/Export data

4. **Settings** (`/settings`)
   - IP allowlist
   - Compute settings
   - Delete project (careful!)

5. **Monitoring** (`/monitoring`)
   - Active connections
   - Query performance
   - Storage usage

---

## 🚦 Ready for Phase 2?

Once you've completed all checkpoints above, you're ready for:
- **Phase 2**: Database Migration & Seeding
- **Phase 3**: Vercel Configuration
- **Phase 4**: Production Deployment

Run this to continue:
```bash
# Check if ready for Phase 2
node scripts/migration-validation.js --check-connection
```

---

## 📞 Need Help?

- **Neon Documentation**: https://neon.tech/docs
- **Neon Status**: https://neonstatus.com
- **Community Discord**: https://discord.gg/92vNTzKDGp

---

**Last Updated**: 2025-09-07
**Status**: Ready for Execution