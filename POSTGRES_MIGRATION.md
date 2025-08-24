# 🗄️ PostgreSQL Migration Guide

This guide will help you migrate your Cone Counter application from SQLite to PostgreSQL with multi-user support.

## 🎯 **What's New**

### **Multi-User Architecture**
- **User Isolation**: Each user's data is completely separated
- **Firebase Integration**: Authentication handled by Firebase Auth
- **Scalable Database**: PostgreSQL handles concurrent users efficiently
- **Data Security**: Users can only access their own data

### **Database Changes**
- **SQLite** → **PostgreSQL** (v15)
- **Single Table** → **Users + Cones tables**
- **File-based** → **Client-server architecture**
- **Local Only** → **Network accessible**

---

## 🚀 **Quick Start**

### **1. Start PostgreSQL Database**
```bash
# Start PostgreSQL service
docker-compose up postgres -d

# Verify it's running
docker-compose ps postgres
```

### **2. Test Database Connection**
```bash
# Connect to PostgreSQL
docker exec -it cone-counter-postgres psql -U postgres -d cone_counter

# Check tables
\dt
\q
```

### **3. Start Application**
```bash
# Build and start the full stack
docker-compose up -d
```

---

## 🔧 **Development Setup**

### **Local Development**
```bash
# Install dependencies
npm install

# Start PostgreSQL
docker-compose up postgres -d

# Set environment variables
cp env.example .env
# Edit .env with your database settings

# Start backend
npm run dev:backend

# Start frontend (in another terminal)
npm run dev:frontend
```

### **Environment Variables**
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cone_counter
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3000
NODE_ENV=development
```

---

## 📊 **Database Schema**

### **Users Table**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Firebase UID
  email TEXT UNIQUE NOT NULL,             -- User's email
  display_name TEXT,                      -- User's display name
  created_at TIMESTAMP WITH TIME ZONE,    -- Account creation time
  updated_at TIMESTAMP WITH TIME ZONE     -- Last update time
);
```

### **Cones Table**
```sql
CREATE TABLE cones (
  id SERIAL PRIMARY KEY,                  -- Auto-incrementing ID
  user_id TEXT NOT NULL,                  -- References users.id
  timestamp TEXT NOT NULL,                -- ISO timestamp
  date TEXT NOT NULL,                     -- YYYY-MM-DD
  time TEXT NOT NULL,                     -- HH:MM:SS
  day_of_week TEXT NOT NULL,             -- Day name
  notes TEXT,                             -- Optional notes
  created_at TEXT NOT NULL,               -- Creation time
  updated_at TEXT NOT NULL                -- Last update time
);
```

### **Indexes**
```sql
-- Performance indexes
CREATE INDEX idx_cones_user_id ON cones(user_id);
CREATE INDEX idx_cones_timestamp ON cones(timestamp);
CREATE INDEX idx_cones_date ON cones(date);
CREATE INDEX idx_cones_day_of_week ON cones(day_of_week);
CREATE INDEX idx_cones_user_date ON cones(user_id, date);
```

---

## 🔄 **Data Migration**

### **Option 1: Use Migration Script**
```bash
# Make sure PostgreSQL is running
docker-compose up postgres -d

# Run migration script
node scripts/migrate-to-postgres.js
```

### **Option 2: Manual Export/Import**
```bash
# 1. Export from old SQLite app
# 2. Start new PostgreSQL app
# 3. Import data through web interface
```

### **Migration Notes**
- **User Assignment**: Migrated data gets assigned to a default user
- **Data Integrity**: All timestamps and derived fields are preserved
- **Verification**: Script verifies record counts match
- **Rollback**: Original SQLite file remains untouched

---

## 🛡️ **Authentication Flow**

### **Frontend → Backend**
1. **User logs in** with Firebase Auth
2. **Firebase ID token** sent in `Authorization: Bearer <token>` header
3. **Backend verifies token** (placeholder implementation)
4. **User data retrieved** from PostgreSQL
5. **All queries filtered** by `user_id`

### **Security Features**
- **Token-based auth** for all API endpoints
- **User isolation** - users can only access their data
- **SQL injection protection** with parameterized queries
- **CORS enabled** for development flexibility

---

## 🐳 **Docker Deployment**

### **Production Stack**
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: cone_counter
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  cone-counter:
    image: alexschladetsch/cone-counter:latest
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=cone_counter
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    depends_on:
      postgres:
        condition: service_healthy
```

### **Deployment Commands**
```bash
# Build and deploy
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Backup database
docker exec cone-counter-postgres pg_dump -U postgres cone_counter > backup.sql
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Database Connection Failed**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify environment variables
docker-compose exec cone-counter env | grep DB_
```

#### **2. Authentication Errors**
```bash
# Check Firebase configuration
# Verify .env.local has correct Firebase settings
# Check browser console for auth errors
```

#### **3. Data Not Loading**
```bash
# Check user authentication
# Verify API calls include auth headers
# Check backend logs for errors
```

### **Debug Commands**
```bash
# Connect to PostgreSQL
docker exec -it cone-counter-postgres psql -U postgres -d cone_counter

# Check user data
SELECT * FROM users;

# Check cone data
SELECT COUNT(*) FROM cones;
SELECT * FROM cones LIMIT 5;

# Check user's cones
SELECT COUNT(*) FROM cones WHERE user_id = 'your-user-id';
```

---

## 📈 **Performance Benefits**

### **SQLite vs PostgreSQL**
| Feature | SQLite | PostgreSQL |
|---------|---------|------------|
| **Concurrent Users** | 1 | 100+ |
| **Data Size** | GB | TB+ |
| **Network Access** | No | Yes |
| **Backup/Recovery** | Manual | Automated |
| **Scaling** | None | Horizontal |

### **Optimizations**
- **Connection pooling** for efficient database connections
- **Indexed queries** for fast data retrieval
- **Prepared statements** for query optimization
- **Transaction support** for data integrity

---

## 🔮 **Next Steps**

### **Immediate Tasks**
1. **Test authentication** with Firebase
2. **Verify data migration** completed successfully
3. **Test all CRUD operations** work with user isolation
4. **Deploy to production** environment

### **Future Enhancements**
1. **Implement proper Firebase Admin SDK** verification
2. **Add user management** features
3. **Implement data sharing** between users
4. **Add backup/restore** functionality
5. **Performance monitoring** and optimization

---

## 📚 **Additional Resources**

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin
- **Docker Compose**: https://docs.docker.com/compose/
- **Node.js pg**: https://node-postgres.com/

---

## 🆘 **Need Help?**

If you encounter issues during migration:

1. **Check logs**: `docker-compose logs -f`
2. **Verify environment**: Check `.env` file and Docker Compose
3. **Test connectivity**: Try connecting to PostgreSQL directly
4. **Review schema**: Verify tables were created correctly

**Happy migrating! 🚬🗄️**
