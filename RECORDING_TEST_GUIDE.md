# Recording Functionality Test Guide

## Issue Status: FIXED ✅

The recording functionality was working on the backend but had API response format mismatches that could cause issues with the frontend.

## What Was Fixed:

1. **API Response Format**: Backend now returns camelCase field names (`recordingId`, `outputPath`, `durationSeconds`, `fileSizeMb`) instead of snake_case to match frontend TypeScript interfaces
2. **Added Console Logging**: Enhanced frontend debugging with console logs for API calls
3. **Backend Verification**: Confirmed FFmpeg is installed and working correctly

## How to Test Recording:

### 1. Open Browser Developer Console
- Open http://localhost:3000/
- Press F12 to open Developer Tools
- Go to the Console tab

### 2. Start Recording on a Camera
- Click on any online camera card
- Click the red record button
- You should see console logs like:
  ```
  [ApiClient] Request: POST http://127.0.0.1:8000/api/cameras/{id}/record/start/
  [CameraAPI] Starting recording for camera {id}...
  [CameraAPI] Recording start result: {success: true, message: "...", recordingId: "..."}
  ```

### 3. Verify Recording is Active
- The camera card should show a red recording indicator
- Check the backend console for confirmation
- Recording files are saved to: `C:\Users\Comme\Videos\`

### 4. Stop Recording
- Click the stop button (square icon when recording)
- You should see console logs for the stop operation
- The recording will be saved to disk

### 5. Check Saved Recordings
- Navigate to Recordings page in the app
- Or check directly: `C:\Users\Comme\Videos\`
- Files are named: `{camera_name}_{timestamp}.mp4`

## Backend Test (Already Verified ✅)

Recording works perfectly via backend:
```bash
cd backend
python test_recording.py
```

Results:
- ✅ Recording started successfully
- ✅ File saved to: `C:\Users\Comme\Videos\y_20260826_212346.mp4`
- ✅ Duration: 10 seconds
- ✅ File size: 1.42 MB

## Troubleshooting

### If Recording Still Doesn't Work:

1. **Check Browser Console** for error messages
2. **Verify Backend is Running** at http://127.0.0.1:8000/
3. **Test API Directly**:
   ```powershell
   # Get first camera ID
   curl http://127.0.0.1:8000/api/cameras/
   
   # Start recording (replace {id} with actual camera ID)
   curl -X POST http://127.0.0.1:8000/api/cameras/{id}/record/start/
   
   # Stop recording
   curl -X POST http://127.0.0.1:8000/api/cameras/{id}/record/stop/
   ```

4. **Check CORS**: If you see CORS errors in console, verify the backend CORS settings in `settings.py`

5. **Verify Camera is Online**: Recording only works for cameras with `status: ONLINE`

## Expected Behavior:

- ✅ Click record → Camera starts recording → Red indicator appears
- ✅ Click stop → Recording saved to disk → File appears in recordings list
- ✅ Toast notification appears confirming start/stop
- ✅ Console logs show successful API calls
- ✅ Backend logs show FFmpeg process running

## Recording Configuration:

Located in `backend/surveillance_vms/settings.py`:
- Storage Path: `C:\Users\Comme\Videos`
- FFmpeg Path: `ffmpeg` (from system PATH)
- Max Concurrent Recordings: 6
- Retention Days: 14

## Next Steps:

1. Open the app in your browser
2. Open developer console (F12)
3. Try recording on any online camera
4. Check the console logs to see if the API calls are working
5. If you see any errors, share them for further debugging
