

## Problem: QR Scanner Not Working on iOS/iPhone

**Root Cause**: iOS Safari has stricter requirements for camera access than Android:
1. Video elements must have `playsinline` attribute (iOS won't autoplay video without it)
2. `facingMode: { exact: "environment" }` can fail on some iOS devices — the non-exact `"environment"` is safer but `html5-qrcode` may internally use `exact`
3. iOS requires explicit user gesture to trigger camera permissions
4. The `html5-qrcode` library has known iOS compatibility issues with certain versions

## Plan

### 1. Add iOS video element patching after scanner starts
After `html5QrCode.start()` succeeds (line ~163), find the rendered `<video>` element and force-set `playsinline`, `autoplay`, and `muted` attributes — iOS Safari requires these to display camera feeds inline.

### 2. Add a fallback camera configuration
If the initial `start()` with `{ facingMode: "environment" }` fails, retry with a bare `{ facingMode: "user" }` or just `true` for the video constraint. Some older iPhones don't enumerate the back camera correctly.

### 3. Force video element styles for iOS rendering
iOS Safari sometimes renders the video at 0×0 if `playsinline` wasn't set before the stream attached. After start, explicitly set `width`, `height`, `object-fit`, and the `webkit-playsinline` attribute on the video element.

### Technical Details

**File**: `src/components/events/CheckInScannerDialog.tsx`

In `startScanning()`, after the successful `html5QrCode.start()` call (~line 163-168):
- Query the video element inside the scanner container
- Set attributes: `playsinline`, `webkit-playsinline`, `autoplay`, `muted`
- Add a fallback retry in the `catch` block that attempts `{ facingMode: "user" }` if the environment camera fails

Add a helper to patch the video element:
```ts
const patchVideoForIOS = (container: HTMLElement) => {
  const video = container.querySelector("video");
  if (video) {
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");
    video.setAttribute("autoplay", "true");
    video.setAttribute("muted", "true");
    video.style.width = "100%";
    video.style.height = "100%";
    video.style.objectFit = "cover";
  }
};
```

In the catch block, add a retry with relaxed constraints before showing the error.

