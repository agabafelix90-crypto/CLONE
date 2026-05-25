# Medical Health Management System - Production Deployment Guide

## 🚀 Quick Start

### Windows (Recommended)
```bash
# Run the deployment script
deploy.bat
```

### Linux/Mac
```bash
# Make script executable and run
chmod +x deploy.sh
./deploy.sh
```

## 📋 System Requirements

- Node.js 16+ and npm
- Supabase account and project
- Internet connection for Supabase

## 🏗️ Architecture

### Frontend
- **Framework**: React 17.0.2 + Vite
- **Build**: Optimized production bundle
- **Port**: 4173 (preview server)
- **Output**: `dist/` directory

### Backend
- **Framework**: Express.js 4.18.2
- **Database**: Supabase (PostgreSQL)
- **Port**: 4000
- **API**: REST endpoints with legacy PHP-style routing

### Database
- **Provider**: Supabase
- **Tables**: clinics, employees (planned)
- **Connection**: Environment variables

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Root serverless API routes (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
```

#### Backend (backend/.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
PORT=4000
NODE_ENV=production
```

## 🚀 Manual Deployment Steps

### 1. Build Frontend
```bash
npm run build
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install --production
cd ..
```

### 3. Start Production Servers

#### Option A: Automated Script
```bash
# Windows
start-production.bat

# Linux/Mac
./start-production.sh
```

#### Option B: Manual Start
```bash
# Terminal 1: Backend
cd backend
npm run prod

# Terminal 2: Frontend
npm run serve
```

## 🌐 Production URLs

- **Frontend**: http://localhost:4173
- **Backend**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health
- **API Docs**: Check `/api/health` for service status

## 🔍 Health Checks

### Backend Health
```bash
curl http://localhost:4000/api/health
# Expected: {"status":"ok","service":"medical-health-management-backend","environment":"production"}
```

### Frontend Health
```bash
curl -I http://localhost:4173
# Expected: HTTP/1.1 200 OK
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill processes on ports
netstat -ano | findstr :4000
netstat -ano | findstr :4173
taskkill /PID <PID> /F
```

#### 2. Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### 3. Database Connection Issues
- Check Supabase credentials in `.env` files
- Verify Supabase project is active
- Check network connectivity

#### 4. CORS Issues
- Ensure frontend URLs are allowed in backend CORS config
- Check environment-specific CORS settings

## 📊 Monitoring

### Logs
- Backend logs appear in terminal/console
- Frontend build logs in `dist/` directory
- Check browser console for client-side errors

### Performance
- Frontend: Check bundle size in `dist/`
- Backend: Monitor response times via health endpoint
- Database: Check Supabase dashboard

## 🔒 Security Notes

- Service role keys are for server-side only
- Anon keys are safe for client-side use
- CORS configured for local development
- Production should use proper domain allowlists

## 📝 API Endpoints

### Authentication
- `POST /loginClinic.php` - Clinic login
- `POST /registerClinic.php` - Clinic registration

### Management
- `POST /addemployee.php` - Add employee
- `GET /fetchemployees.php` - List employees
- `GET /fetchpermissions.php` - Get permissions

### Analytics
- `POST /fetchperformance.php` - Performance data
- `GET /birthdaycount.php` - Birthday counts
- `GET /countappointments.php` - Appointment counts

## 🎯 Next Steps

1. **Database Setup**: Run `backend/supabase-schema.sql`
2. **Domain Configuration**: Update CORS for production domains
3. **SSL/HTTPS**: Configure SSL certificates
4. **Load Balancing**: Set up reverse proxy (nginx)
5. **Monitoring**: Add logging and error tracking
6. **Backup**: Configure database backups

## 📞 Support

For issues:
1. Check health endpoints
2. Review server logs
3. Verify environment variables
4. Test database connectivity
5. Check browser network tab for failed requests