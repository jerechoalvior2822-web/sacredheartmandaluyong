# Render Deployment Quick Start

## What I Created

✅ **render.yaml** - Infrastructure configuration for Render  
✅ **Dockerfile** - Container setup for backend + frontend  
✅ **.env.example** - Environment variables template  
✅ **RENDER-DEPLOYMENT.md** - Complete deployment guide  
✅ **Updated server.js** - Database uses environment variables  

## Deploy in 5 Minutes

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 2. Deploy Backend (3 minutes)
- Go to render.com → New Web Service
- Select your GitHub repository
- Copy environment variables from **RENDER-DEPLOYMENT.md**
- Click Deploy

### 3. Deploy Database (1 minute)
- Go to render.com → New MySQL
- Set credentials and copy connection details
- Update backend environment variables

### 4. Deploy Frontend (1 minute)
- Go to render.com → New Static Site
- Select same repository
- Set `VITE_API_URL` to your backend URL
- Click Deploy

## Your URLs Will Be
- Backend: `https://sacred-heart-backend.onrender.com`
- Frontend: `https://sacred-heart-frontend.onrender.com`

## Important Notes

⚠️ **File Uploads:** Free tier uses ephemeral storage (files lost on restart)
- Upgrade to Paid plan with Persistent Disk, OR
- Use AWS S3 for image storage

⚠️ **Database:** Free tier has limits
- 500MB storage
- Shared resources
- Good for testing, upgrade for production

⚠️ **Email:** Requires SMTP credentials
- Use Gmail App Passwords (recommended)
- Generate at: https://myaccount.google.com/apppasswords

## Next Steps

1. Read **RENDER-DEPLOYMENT.md** for detailed instructions
2. Set up GitHub if not done
3. Create Render account at https://render.com
4. Deploy using the guide

Questions? Check the troubleshooting section in **RENDER-DEPLOYMENT.md**
