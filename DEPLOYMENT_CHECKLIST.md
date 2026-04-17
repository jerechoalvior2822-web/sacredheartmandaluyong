# Frontend Deployment Checklist for Render

## ✅ Completed
- [x] API configuration utility created (`src/app/utils/apiConfig.ts`)
- [x] Environment variable `VITE_API_URL` added to `.env`
- [x] Production environment file `.env.production` created
- [x] Updated components to use `getApiUrl()` and `getAssetUrl()` helpers:
  - [x] AboutUs.tsx
  - [x] Announcements.tsx
  - [x] AdminAnnouncements.tsx

## ⚠️ Still Need to Update (Remaining Hardcoded URLs)
- [ ] AdminBookings.tsx - Multiple fetch calls
- [ ] AdminCarousel.tsx - Image uploads
- [ ] AdminDonations.tsx - Donation endpoints
- [ ] AdminServices.tsx - Service management
- [ ] AdminSouvenirs.tsx - Souvenir management
- [ ] AdminDashboard.tsx - Dashboard data fetches
- [ ] Bookings.tsx - Booking endpoints
- [ ] Donations.tsx - Donation API calls
- [ ] MassSchedules.tsx - Mass schedule endpoints
- [ ] Profile.tsx - User profile endpoints
- [ ] Register.tsx - Registration API
- [ ] Login.tsx - Login API
- [ ] Other pages with API calls

## 📋 Deployment Steps

### 1. Update .env.production with your Render Backend URL
```
VITE_API_URL=https://your-sacred-heart-api.onrender.com
```

### 2. Build the Frontend
```powershell
npm run build
```

### 3. Deploy Frontend to Render (Static Site)
- Create a new Static Site on Render
- Connect to your GitHub repository
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variable: `VITE_API_URL=https://your-backend-url.onrender.com`

### 4. Deploy Backend to Render (Web Service)
- Create a new Web Service on Render
- Use the existing backend configuration
- Ensure all PostgreSQL credentials are set

### 5. Connect PostgreSQL Database
- Create PostgreSQL database on Render
- Migrate data from MySQL (using pgloader or manual import)
- Update backend .env with PostgreSQL credentials

### 6. Update CORS in Backend
Update `backend/server.js` to allow frontend URL:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173', // Local dev
    'https://your-frontend-domain.onrender.com' // Production
  ],
  credentials: true
}));
```

## 📌 Important Notes
- Frontend build output goes to `dist/` folder
- The build process uses `VITE_API_URL` from environment
- Make sure `.env.production` has correct backend URL before building
- Local development uses `.env` with `http://localhost:3001`
- Production uses `.env.production` with Render backend URL

## 🔄 Testing Before Deployment
1. Build locally: `npm run build`
2. Check that built files in `dist/` folder are generated
3. Verify API calls will use correct URLs for your deployment

## 📚 Related Files
- `.env` - Local development configuration
- `.env.production` - Production configuration for Render
- `src/app/utils/apiConfig.ts` - API URL helper functions
- `vite.config.ts` - Build configuration
