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

# Task 3: 스쿼트 카운팅 로직 - Learnings

## Date: 2026-02-08

### Architecture
- **calculateAngle**: atan2 기반, p2가 꼭짓점. 벡터 p2→p1, p2→p3 사이 각도 0~180도 반환
- **SquatCounter**: 상태 머신 STANDING → SQUATTING → STANDING = 1 count
- **히스테리시스**: DOWN < 120°, UP > 160° (40도 갭으로 떨림 방지)
- **useSquatCounter**: pose.id 기반 개인별 카운터, Map으로 관리

### Key Decisions
1. 양쪽 무릎 각도 모두 유효할 때 평균 사용, 한쪽만 유효하면 그쪽만 사용
2. keypoint score < 0.3이면 무시 (PoseDetection과 동일 임계값)
3. kneeAngle === null일 때 카운터 상태 유지 (update 호출 안 함)
4. COCO keypoints: hip=11/12, knee=13/14, ankle=15/16

### Node REPL 테스트 결과
- calculateAngle: 직선 180°, 직각 90°, 둔각 135°, 예각 45° - 모두 정확
- SquatCounter: 1사이클=1카운트, 히스테리시스 동작, 이중 카운팅 방지 확인

### Files Created
- `src/utils/calculateAngle.ts` - 세 점 사이 각도 계산 유틸
- `src/utils/squatCounter.ts` - 상태 머신 (STANDING/SQUATTING)
- `src/hooks/useSquatCounter.ts` - poses → 스쿼트 카운트 훅
- `src/components/SquatCountDisplay.tsx` - 실시간 카운트 UI
- `src/components/PoseDetection.tsx` - 스쿼트 카운터 통합

### 주의사항
- verbatimModuleSyntax: true라서 import type 사용 필수
- node --experimental-strip-types로 TS 파일 직접 테스트 가능
- evidence/ 디렉토리에 테스트 결과 저장됨

# Task 4: Canvas 2D 캐릭터 렌더링 (1명 → 6명) - Learnings

## Date: 2026-02-08

### BroadcastChannel API
- 같은 origin, 다른 브라우징 컨텍스트에서만 메시지 수신
- 같은 페이지에서 postMessage()해도 해당 페이지의 onmessage는 발동 안 됨
- about:blank은 다른 origin으로 취급되어 통신 불가
- Playwright에서 테스트 시 run_code로 두 page 객체를 동시 제어해야 함

### Canvas 2D 스틱 피겨 렌더링
- 머리 크기: 어깨 간 거리 비례 (shoulderDist * scaleX * 0.35)
- 몸통: 어깨 중심→엉덩이 중심 단일 선이 가장 깔끔
- mirrored(좌우반전): tx() = canvasWidth - scaled

### 왼쪽→오른쪽 정렬
- getPoseCenterX: 어깨+엉덩이 → 코 → 유효 키포인트 평균 순서 fallback
- 최대 6명 제한, x좌표 기준 sort 후 1-based ID 부여

### react-router-dom v7
- v7에서도 BrowserRouter/Routes/Route 하위 호환
- react-router-dom이 react-router를 re-export

### Pose 데이터 직렬화
- Pose 타입은 plain object → BroadcastChannel structured clone 문제없음
- videoWidth/videoHeight 함께 전달 필수 (display 스케일링용)

### Files Created
- `src/utils/poseToCharacter.ts` - 캐릭터 ID 부여/색상 매핑
- `src/components/CharacterCanvas.tsx` - Canvas 2D 스틱 피겨 렌더링
- `src/components/TeacherView.tsx` - 교사 화면 (웹캠+스켈레톤+BroadcastChannel 송신)
- `src/components/StudentView.tsx` - 학생 화면 (BroadcastChannel 수신+캐릭터 렌더)
- `src/types/broadcast.ts` - BroadcastChannel 메시지 타입 정의
- `src/App.tsx` - 라우팅 업데이트 (/teacher, /display)
