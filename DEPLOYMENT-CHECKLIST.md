# Sacred Heart Parish - Deployment Checklist

## Pre-Deployment Verification ✓

### 1. Frontend Configuration
- [x] All hardcoded API URLs replaced with `getApiUrl()`
- [x] All asset URLs replaced with `getAssetUrl()`
- [x] Environment variable configuration set up in `src/app/utils/apiConfig.ts`

### 2. Backend Configuration
- [x] CORS configured for production
- [x] Environment variables support in `server.js`
- [x] File upload paths configured
- [x] Database connection supports environment variables

---

## Environment Variables Setup

### Local Development
Create a `.env` file in the root directory:

```env
# Frontend
VITE_API_URL=http://localhost:3001

# Backend
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sacred_heart_db
DB_PORT=3306
```

### Render Production
Set these environment variables in your Render service dashboard:

#### Backend Service Variables
```
NODE_ENV=production
PORT=3001
DB_HOST=your-mysql-instance.render.com
DB_USER=<mysql_username>
DB_PASSWORD=<mysql_password>
DB_NAME=sacred_heart_db
DB_PORT=3306
FRONTEND_URL=https://your-frontend.onrender.com
```

#### Frontend Static Site Variables
```
VITE_API_URL=https://your-backend.onrender.com
```

---

## Deployment Steps

### Step 1: Prepare Repository
```bash
# Ensure all changes are committed
git status
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Deploy Backend on Render

1. Go to [render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `sacred-heart-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node backend/server.js`
   - **Plan**: Free (or Paid for persistent storage)

5. Add environment variables:
   - `NODE_ENV`: `production`
   - `PORT`: `3001`
   - `DB_HOST`: (from MySQL service)
   - `DB_USER`: (from MySQL service)
   - `DB_PASSWORD`: (from MySQL service)
   - `DB_NAME`: `sacred_heart_db`
   - `DB_PORT`: `3306`
   - `FRONTEND_URL`: (your frontend URL on Render)

6. Click **Create Web Service**
7. Wait for deployment to complete

### Step 3: Set Up MySQL Database

1. Go to [render.com](https://render.com)
2. Click **New** → **MySQL**
3. Configure:
   - **Name**: `sacred-heart-mysql`
   - **Database Name**: `sacred_heart_db`
   - **Username**: (choose a username)
   - **Password**: (generate a strong password)
   - **Plan**: Starter (500MB free)

4. Copy the connection details
5. Save these credentials in your Render backend environment variables

### Step 4: Deploy Frontend on Render

1. Go to [render.com](https://render.com)
2. Click **New** → **Static Site**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `sacred-heart-frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`

5. Add environment variable:
   - `VITE_API_URL`: (your backend URL from Step 2)

6. Click **Create Static Site**
7. Wait for deployment to complete

---

## Post-Deployment Verification

### Backend Health Check
```bash
# Replace with your actual URL
curl https://your-backend.onrender.com/api/health
```

### Frontend Access
Visit: `https://your-frontend.onrender.com`

### Test Database Connection
- Log in to admin panel
- Try to view any data (bookings, donations, etc.)
- Check if data loads correctly

---

## Important Notes

⚠️ **Free Tier Limitations**:
- **Ephemeral Storage**: Files are lost when instance restarts
- **Database Limits**: 500MB storage, shared resources
- **Compute**: Limited CPU/memory, may sleep after inactivity

### Solutions for Production
- **Persistent File Storage**: Upgrade to Paid Render plan with Persistent Disk
- **Alternative**: Use AWS S3, Cloudinary, or Azure Blob Storage for uploads
- **Database**: Upgrade to Paid plan or use managed DB service

---

## Troubleshooting

### CORS Errors
If you see CORS errors in the browser console:
1. Update `FRONTEND_URL` in backend environment variables
2. Ensure both services are deployed
3. Wait 5 minutes for CORS changes to take effect

### Database Connection Failed
1. Verify all DB credentials in environment variables
2. Check database is running and accessible
3. Ensure DB firewall allows connections from Render IP

### File Uploads Not Working
1. Check `/assets/uploads/` directory exists
2. For ephemeral storage, implement AWS S3 integration
3. Check file permissions on server

### Blank Frontend
1. Verify `VITE_API_URL` is set correctly
2. Check browser console for errors
3. Ensure backend is deployed and running

---

## Scaling & Optimization

### For Production Use
1. **Enable persistent disk** on Render for file storage
2. **Set up CDN** for static assets
3. **Implement caching** on backend
4. **Monitor logs** for errors and performance
5. **Set up automated backups** for database
6. **Use environment-specific configs** for security

---

## Support
For issues or questions:
1. Check Render logs: Dashboard → Your Service → Logs
2. Review this checklist
3. Verify all environment variables are set correctly

---

Last Updated: April 17, 2026
