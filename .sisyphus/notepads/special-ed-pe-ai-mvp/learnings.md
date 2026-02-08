# Task 2: MoveNet MultiPose 통합 - Learnings

## Date: 2026-02-08

### Performance Results (CRITICAL - GO Decision)
- **FPS: 30-72 (stable ~30 in Playwright headless, 60-72 initially)**
- **PASS: 15 FPS threshold exceeded by 2-4x**
- Backend: WebGPU (auto-selected by tf.ready())
- Model load time: ~10-12 seconds (first load, includes model download)

### Key Technical Findings

1. **tf.ready() is REQUIRED before createDetector()**
   - Without it, "Backend 'webgpu' has not yet been initialized" error
   - `import '@tensorflow/tfjs'` registers backends but doesn't initialize them
   - Must `await tf.ready()` to ensure backend is ready

2. **TF.js auto-selects WebGPU over WebGL when available**
   - Chromium (Playwright) uses WebGPU backend
   - Fallback chain: webgpu → webgl → wasm → cpu

3. **React 19 StrictMode double-mount breaks video.play()**
   - First mount: getUserMedia → play() starts
   - Cleanup: srcObject = null → play() interrupted
   - Second mount: getUserMedia → play() succeeds
   - Fix: Use `onloadeddata` event before calling play()

4. **TailwindCSS v4 requires @tailwindcss/postcss**
   - postcss.config.js: `tailwindcss: {}` → `'@tailwindcss/postcss': {}`
   - This was a Task 1 setup issue, fixed here

5. **MoveNet MultiPose LIGHTNING config**
   - multiPoseMaxDimension: 256 is sufficient for 30+ FPS
   - enableTracking: true with BoundingBox tracker for person ID stability
   - enableSmoothing: true reduces jitter

6. **Bundle size: 1.6MB (gzipped ~430KB)**
   - TF.js is the dominant contributor
   - Consider code splitting in production

### Pose Detection Notes
- Fake canvas stream (geometric shapes) NOT detected as person - expected
- Real webcam with actual humans needed for pose detection validation
- Person ID tracking validation requires real humans in frame
- keypoints.length === 17 (COCO format) - verified from type definitions

### Files Created
- `src/hooks/useWebcam.ts` - WebRTC webcam stream hook
- `src/hooks/useMoveNet.ts` - MoveNet model loading + detection loop
- `src/components/PoseDetection.tsx` - Full UI with video + skeleton overlay + FPS
- `postcss.config.js` - Fixed TailwindCSS v4 PostCSS config
