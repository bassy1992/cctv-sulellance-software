# Delete Recording Issue - FIXED ✅

## The Problem

When trying to delete recordings from the Recordings tab, the operation was failing because:

1. **Backend Response Issue**: The backend was returning HTTP 204 No Content (empty body) instead of a JSON response
2. **Frontend Expectation**: The frontend expected a JSON response with `{ success: boolean, message: string }`
3. **Error Handling**: When the frontend tried to parse JSON from an empty 204 response, it failed silently

## The Fix

### Backend Changes (`apps/recordings/views.py`)

Changed the `destroy` method to:
- Return HTTP 200 OK with JSON body instead of HTTP 204 No Content
- Include proper `success` and `message` fields in the response
- Better error handling when file deletion fails
- More informative success message

**Before:**
```python
return Response(status=status.HTTP_204_NO_CONTENT)
```

**After:**
```python
return Response(
    {'success': True, 'message': f'Recording "{recording_name}" deleted successfully'},
    status=status.HTTP_200_OK
)
```

### Frontend Changes (`services/recordingApi.ts`)

Added console logging for better debugging:
```typescript
console.log(`[RecordingAPI] Deleting recording ${id}...`);
console.log(`[RecordingAPI] Delete result:`, result);
console.error(`[RecordingAPI] Delete error:`, error);
```

## How to Test

### 1. Open the Application
- Navigate to http://localhost:3000/
- Go to the **Recordings** tab

### 2. Try Deleting a Recording

#### Table View:
1. Find any recording in the table
2. Click the trash icon (🗑️) in the Actions column
3. Confirm the deletion in the dialog
4. The recording should disappear and you'll see a success toast

#### Card View:
1. Switch to card view using the toggle
2. Find any recording card
3. Click the trash icon in the card footer
4. Confirm the deletion
5. The card should disappear with a success toast

### 3. Verify Deletion

**In the UI:**
- Recording disappears from the list
- Toast notification: "Recording permanently deleted from desktop drive."
- Total count decreases

**In the Browser Console (F12):**
```
[RecordingAPI] Deleting recording {id}...
[ApiClient] Request: DELETE http://127.0.0.1:8000/api/recordings/{id}/
[ApiClient] Response: {success: true, message: "Recording ... deleted successfully"}
[RecordingAPI] Delete result: {success: true, message: "..."}
```

**On Disk:**
- Video file removed from `C:\Users\Comme\Videos\`
- Database record deleted

**Backend Logs:**
```
INFO ... Deleted recording file: C:\Users\Comme\Videos\...mp4
```

## Test Via API (Backend Verification)

```powershell
# List recordings
curl http://127.0.0.1:8000/api/recordings/

# Delete a recording (replace {id} with actual recording ID)
curl -X DELETE http://127.0.0.1:8000/api/recordings/{id}/

# Expected response:
# {"success":true,"message":"Recording \"camera_name - timestamp\" deleted successfully"}

# Verify count decreased
curl http://127.0.0.1:8000/api/recordings/
```

## What Gets Deleted

When you delete a recording:
1. ✅ **Video file** from disk (`C:\Users\Comme\Videos\*.mp4`)
2. ✅ **Database record** from SQLite
3. ✅ **UI entry** from the recordings list
4. ✅ **Total count** updates

## Error Handling

The delete operation handles these scenarios:

### Cannot Delete Active Recording
If you try to delete a recording that's currently being written:
```json
{
  "success": false,
  "error": "Cannot delete active recording"
}
```

### File Deletion Fails
If the video file can't be deleted (permissions, file locked, etc.):
```json
{
  "success": false,
  "message": "Failed to delete file: [error details]"
}
```

### Recording Not Found
If the recording ID doesn't exist:
- HTTP 404 Not Found

## Troubleshooting

### Delete Button Not Working

1. **Check Browser Console** (F12):
   - Look for any error messages
   - Check if API calls are being made

2. **Check Recording Status**:
   - Active recordings (currently being written) cannot be deleted
   - Stop the recording first, then delete

3. **Check File Permissions**:
   - Ensure the backend process has permission to delete files in the storage directory
   - Video player might have the file locked - close playback first

4. **Check Backend Logs**:
   ```powershell
   # In backend folder
   type logs\surveillance.log | Select-Object -Last 20
   ```

### Delete Works But File Remains

If the database record is deleted but the file remains:
- Check backend logs for file deletion errors
- Manually delete orphaned files from `C:\Users\Comme\Videos\`

### UI Doesn't Update After Delete

1. Refresh the page
2. Check if the API call succeeded in the console
3. The recording might have reappeared due to a fetch/refresh race condition
4. Try deleting again

## Quick Test Script

```powershell
# Create a test recording
cd backend
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'surveillance_vms.settings')
django.setup()
from apps.cameras.models import Camera
from apps.recordings.services import RecordingService
camera = Camera.objects.filter(status='ONLINE').first()
if camera:
    result = RecordingService.start_recording(camera, duration_seconds=5)
    print(f'Recording ID: {result[\"recording_id\"]}')
"

# Wait 5 seconds, then list recordings
Start-Sleep -Seconds 6
python manage.py shell -c "from apps.recordings.models import Recording; [print(r.id) for r in Recording.objects.all()[:3]]"

# Delete via API (replace {id} with one from above)
curl -X DELETE http://127.0.0.1:8000/api/recordings/{id}/

# Verify deletion
python manage.py shell -c "from apps.recordings.models import Recording; print(f'Total: {Recording.objects.count()}')"
```

## Summary

✅ **DELETE endpoint now returns proper JSON response**
✅ **Frontend properly handles the response**
✅ **Console logging added for debugging**
✅ **Better error handling for file deletion failures**
✅ **Success messages are more informative**

The delete functionality should now work correctly in the Recordings tab!
