

## iOS QR Scanner Robustness Fix

### Root Cause
iOS Safari requires `playsinline` on video elements before stream attachment, has stricter camera permission handling, and can fail silently with `facingMode: "environment"` on some devices. The current code patches video attributes *after* start, which is too late on iOS. There's also no fallback if the live camera completely fails.

### Changes — Single File: `src/components/events/CheckInScannerDialog.tsx`

**1. Refactor `startScanning` with tiered camera fallback**
- Attempt 1: `{ facingMode: "environment" }` (back camera)
- Attempt 2: `{ facingMode: "user" }` (front camera)  
- Attempt 3: `video: true` (any camera, no facing preference)
- Each attempt wrapped in its own try/catch; only show error after all three fail

**2. Patch video element immediately after each start attempt**
- Use a `MutationObserver` on the scanner container to catch the video element as soon as it's inserted into the DOM (before stream attaches)
- Set `playsinline`, `webkit-playsinline`, `autoplay`, `muted` attributes and inline styles
- Also patch after `start()` resolves as a safety net

**3. Black-screen detection**
- After successful start, wait 2 seconds then check if video element has `videoWidth > 0` and `videoHeight > 0`
- If zero-sized, show a specific "Camera preview failed" UI with retry + fallback options

**4. Detailed error categorization & logging**
- Log `error.name`, `error.message`, `navigator.userAgent`, and which constraint was attempted
- Map errors to user-friendly messages:
  - `NotAllowedError` → permission denied
  - `NotFoundError` → no camera
  - `OverconstrainedError` → camera constraint issue (triggers next fallback)
  - `NotReadableError` → camera busy

**5. Upload QR Image fallback**
- Add an "Upload QR Image" button (always visible below scanner area)
- Use `Html5Qrcode.scanFile()` to decode a QR from a user-selected image
- Route decoded text through existing `handleScanSuccess`

**6. Manual code entry fallback**
- Add a text input for pasting/typing a check-in token directly
- "Verify" button calls `handleScanSuccess` with the entered text

**7. Lifecycle cleanup**
- Add the `MutationObserver` disconnect to `destroyScanner`
- Existing cleanup logic is solid; no other changes needed

### UI Layout (scanner area)
```text
┌─────────────────────────────┐
│  [Camera Preview / Error]   │
├─────────────────────────────┤
│  [Stop Scanner]             │
│  [Upload QR Image]          │
│  [Enter Code Manually ___]  │
├─────────────────────────────┤
│  [Scan Result Panel]        │
│  [Manual Search]            │
│  [Recent Scans]             │
└─────────────────────────────┘
```

### What stays unchanged
- All scan result handling, confirm check-in, manual search, stats, recent scans
- Android behavior unaffected (tiered fallback only activates on failure)
- Dialog open/close lifecycle

