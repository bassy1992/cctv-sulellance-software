# Frontend-Backend Connection Status

## ✅ Both Servers Running

**Frontend (Vite + React)**
- URL: http://localhost:3000/
- Status: ✅ Running
- Port: 3000

**Backend (Django REST API)**
- URL: http://127.0.0.1:8000/
- API Base: http://127.0.0.1:8000/api/
- Admin Panel: http://127.0.0.1:8000/admin/
- Status: ✅ Running  
- Port: 8000

## 🔗 Connection Configuration

The frontend is automatically configured to connect to the backend:

**API Client Configuration:**
- Base URL: `http://127.0.0.1:8000/api`
- Timeout: 3 seconds
- Fallback: Mock data (if backend unavailable)

**CORS Configuration:**
- Backend allows: `http://localhost:3000`
- Credentials: Allowed
- All API endpoints accessible

## 🧪 Testing the Connection

### Test Backend API Directly:

```bash
# System health
curl http://127.0.0.1:8000/api/system/health/

# List cameras
curl http://127.0.0.1:8000/api/cameras/

# Storage status
curl http://127.0.0.1:8000/api/storage/status/

# System settings
curl http://127.0.0.1:8000/api/system/settings/
```

### Test from Frontend:

1. Open http://localhost:3000/ in your browser
2. Open Browser DevTools (F12)
3. Go to Console tab
4. You should see:
   - ✅ No `[TapoSurveillance API] Endpoint ... fell back to local service` warnings
   - ✅ Successful API requests to `http://127.0.0.1:8000/api/...`

### Check Network Tab:

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Filter by "XHR" or "Fetch"
4. Refresh the page
5. You should see successful requests to:
   - `http://127.0.0.1:8000/api/cameras/`
   - `http://127.0.0.1:8000/api/system/health/`
   - `http://127.0.0.1:8000/api/storage/status/`
   - `http://127.0.0.1:8000/api/system/settings/`

## 📊 Current Data

**Cameras**: 0 (none configured yet)
**Recordings**: 0
**Storage**: Local filesystem
**System Health**: Connected

## 🎯 How to Verify Connection

### Method 1: Check Console Logs
Open the browser console. If you see mock data warnings, the backend isn't connecting. If not, you're connected!

### Method 2: Add a Camera
1. Go to "Cameras" page
2. Click "Add Camera"
3. Fill in test camera details:
   - Name: "Test Camera"
   - IP: "192.168.1.100"
   - Port: 554
   - Username: "admin"
   - Password: "test123"
   - Location: "Test Location"
4. Click "Save"
5. If backend is connected:
   - ✅ Camera will be saved to database
   - ✅ Camera will persist on page refresh
   - ✅ You can test the connection
6. If using mock data:
   - ⚠️ Camera only exists in browser localStorage
   - ⚠️ Lost on browser cache clear

### Method 3: Check Network Activity
1. Open DevTools Network tab
2. Navigate between pages (Dashboard, Cameras, Recordings)
3. Look for requests to `127.0.0.1:8000`
4. Status should be `200 OK` (not `ERR_CONNECTION_REFUSED`)

## 🔧 Troubleshooting

### If frontend can't connect to backend:

**1. Check backend is running:**
```bash
curl http://127.0.0.1:8000/api/system/health/
```
Should return JSON with system info.

**2. Check CORS settings:**
Backend `.env` file should have:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**3. Check frontend is on correct port:**
Frontend should be on port 3000 (not 3001, 5173, etc.)

**4. Clear browser cache:**
Sometimes old mock data interferes. Clear browser data or use Incognito mode.

**5. Check browser console for errors:**
Look for CORS errors or network failures.

## 🚀 Next Steps

1. **Add Cameras**: Go to Cameras page and add your Tapo TC40 cameras
2. **Configure Settings**: Adjust system settings (storage location, retention, etc.)
3. **Test Connections**: Use the "Test Connection" feature when adding cameras
4. **Start Recording**: Click record button on live cameras (requires FFmpeg)
5. **View Storage**: Check storage analytics and recordings

## 📝 Notes

- The frontend gracefully falls back to mock data if backend is unavailable
- This allows UI development and testing even without backend
- Once backend is connected, all data is persistent in SQLite database
- Mock data is only used as fallback, not when backend responds

---

**Status as of**: August 26, 2026  
**Frontend**: ✅ Connected  
**Backend**: ✅ Connected  
**Database**: ✅ Ready  
**System**: 🎯 Fully Operational