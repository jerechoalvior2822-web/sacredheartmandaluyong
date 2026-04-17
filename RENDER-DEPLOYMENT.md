# Render.com Deployment Guide

## Overview
This guide explains how to deploy your Sacred Heart full-stack application to **Render.com**.

## Prerequisites
1. GitHub account with your project repository
2. Render account (free tier available at https://render.com)
3. SMTP credentials (Gmail or other email service)

## Step 1: Prepare Your Repository

### 1.1 Create a `.gitignore` if you don't have one
```bash
node_modules/
dist/
.env
.DS_Store
temp-upload.*
*.log
```

### 1.2 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit for Render deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sacred-heart.git
git push -u origin main
```

## Step 2: Deploy Backend on Render

1. Go to **Render Dashboard** → **New +** → **Web Service**
2. Connect your GitHub repository
3. Fill in the details:
   - **Name:** `sacred-heart-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node backend/server.js`
   - **Plan:** Free tier (or Starter for production)

4. Click **Advanced** and add Environment Variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3001` | Auto-set by Render |
| `DB_HOST` | *(from MySQL service)* | See Step 3 |
| `DB_USER` | *(from MySQL service)* | See Step 3 |
| `DB_PASSWORD` | *(from MySQL service)* | See Step 3 |
| `DB_NAME` | `sacred_heart` | |
| `SMTP_HOST` | `smtp.gmail.com` | |
| `SMTP_PORT` | `587` | |
| `SMTP_USER` | `your-email@gmail.com` | Your Gmail address |
| `SMTP_PASS` | `your-app-password` | [Generate here](https://myaccount.google.com/apppasswords) |
| `SMTP_FROM` | `noreply@sacredheart.local` | |
| `SMTP_SECURE` | `false` | |

5. Click **Create Web Service** and wait for deployment

## Step 3: Deploy MySQL Database on Render

1. Go to **Render Dashboard** → **New +** → **MySQL**
2. Fill in the details:
   - **Name:** `sacred-heart-mysql`
   - **Plan:** Free tier
   - **Database:** `sacred_heart`
   - **Username:** `admin` (or your choice)
   - **Region:** Choose closest to your location

3. Click **Create Database**

4. **Important:** Copy the connection string and update backend environment variables with:
   - `DB_HOST` - from connection string
   - `DB_USER` - your username
   - `DB_PASSWORD` - your password

## Step 4: Deploy Frontend on Render (Static Site)

1. Go to **Render Dashboard** → **New +** → **Static Site**
2. Connect your GitHub repository
3. Fill in the details:
   - **Name:** `sacred-heart-frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`

4. Add Environment Variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://sacred-heart-backend.onrender.com` (your backend URL from Step 2)

5. Click **Create Static Site** and wait for deployment

## Step 5: Update Your Frontend API Calls

In your frontend code, update API calls to use the production backend:

```javascript
// In your API configuration file
const API_URL = process.env.VITE_API_URL || 'http://localhost:3001';

// Example API call
const response = await fetch(`${API_URL}/api/announcements`, {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
});
```

## Step 6: Verify Deployment

1. Visit your frontend URL (provided by Render)
2. Test user registration and email verification
3. Check backend logs in Render Dashboard → **Backend Service** → **Logs**
4. Verify database connection in logs

## Troubleshooting

### Deployment Fails
- Check **Logs** tab in Render Dashboard
- Ensure all environment variables are set
- Verify GitHub repository has latest code pushed

### Database Connection Failed
- Verify `DB_HOST`, `DB_USER`, `DB_PASSWORD` are correct
- Check MySQL service is running
- Ensure firewall allows external connections

### Email Not Sending
- Verify SMTP credentials in environment variables
- If using Gmail, enable [App Passwords](https://myaccount.google.com/apppasswords)
- Check backend logs for email errors

### Frontend Can't Reach Backend
- Verify `VITE_API_URL` environment variable is set
- Check CORS is enabled in backend (`app.use(cors())`)
- Verify backend URL is correct and accessible

## File Upload Considerations

Since Render uses ephemeral file systems, uploaded files are deleted when the service restarts. For production:

### Option 1: Use AWS S3 (Recommended)
1. Create S3 bucket on AWS
2. Generate access keys
3. Install `aws-sdk`: `npm install aws-sdk`
4. Update `server.js` to use S3 instead of disk storage

### Option 2: Use Render Persistent Disk
1. Upgrade to Paid plan
2. Attach persistent disk to backend service
3. Configure disk mount path in `render.yaml`

**Current Status:** Free plan uses ephemeral storage (files lost on restart)

## Cost Estimation

| Service | Plan | Cost |
|---------|------|------|
| Backend | Free/Starter | Free to $7/month |
| Frontend | Free/Starter | Free |
| MySQL | Free/Starter | Free to $15/month |
| **Total** | | **Free to $22/month** |

*Note: Free tier has limitations (auto-pauses if inactive, 0.5 GB RAM)*

## Next Steps

1. ✅ Set up GitHub repository
2. ✅ Deploy backend on Render
3. ✅ Deploy MySQL on Render
4. ✅ Deploy frontend on Render
5. 📧 Configure email notifications
6. 💾 Plan file storage strategy
7. 🔒 Add custom domain

## Additional Resources

- [Render Docs](https://render.com/docs)
- [MySQL on Render](https://render.com/docs/databases)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Persistent Storage](https://render.com/docs/disks)
