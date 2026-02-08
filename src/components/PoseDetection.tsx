import { useEffect, useRef, useCallback } from 'react';
import type { Pose, Keypoint } from '@tensorflow-models/pose-detection';
import { useWebcam } from '../hooks/useWebcam';
import { useMoveNet } from '../hooks/useMoveNet';

// COCO 17-keypoint skeleton adjacency pairs
const SKELETON_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 2], [1, 3], [2, 4],       // head
  [5, 6],                                  // shoulders
  [5, 7], [7, 9], [6, 8], [8, 10],       // arms
  [5, 11], [6, 12],                        // torso
  [11, 12],                                // hips
  [11, 13], [13, 15], [12, 14], [14, 16], // legs
];

const MIN_KEYPOINT_SCORE = 0.3;

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  poses: Pose[],
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const scaleX = canvasWidth / videoWidth;
  const scaleY = canvasHeight / videoHeight;

  for (const pose of poses) {
    const keypoints = pose.keypoints;

    for (const [i, j] of SKELETON_CONNECTIONS) {
      const kpA = keypoints[i];
      const kpB = keypoints[j];
      if (
        (kpA.score ?? 0) < MIN_KEYPOINT_SCORE ||
        (kpB.score ?? 0) < MIN_KEYPOINT_SCORE
      )
        continue;

      ctx.beginPath();
      ctx.moveTo(kpA.x * scaleX, kpA.y * scaleY);
      ctx.lineTo(kpB.x * scaleX, kpB.y * scaleY);
      ctx.strokeStyle = getColorForId(pose.id);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    for (const kp of keypoints) {
      if ((kp.score ?? 0) < MIN_KEYPOINT_SCORE) continue;
      ctx.beginPath();
      ctx.arc(kp.x * scaleX, kp.y * scaleY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = getColorForId(pose.id);
      ctx.fill();
    }

    drawPoseLabel(ctx, pose, keypoints, scaleX, scaleY);
  }
}

function drawPoseLabel(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  keypoints: Keypoint[],
  scaleX: number,
  scaleY: number,
) {
  const nose = keypoints[0];
  if ((nose.score ?? 0) >= MIN_KEYPOINT_SCORE) {
    ctx.font = '14px monospace';
    ctx.fillStyle = getColorForId(pose.id);
    ctx.fillText(
      `ID:${pose.id ?? '?'} (${(pose.score ?? 0).toFixed(2)})`,
      nose.x * scaleX - 20,
      nose.y * scaleY - 15,
    );
  }
}

const POSE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
];

function getColorForId(id: number | undefined): string {
  return POSE_COLORS[(id ?? 0) % POSE_COLORS.length];
}

export function PoseDetection() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { videoRef, isReady, error: webcamError, startWebcam } = useWebcam();
  const {
    poses,
    fps,
    isModelLoaded,
    modelError,
    startDetection,
    stopDetection,
  } = useMoveNet();

  useEffect(() => {
    void startWebcam();
  }, [startWebcam]);

  useEffect(() => {
    if (isReady && isModelLoaded && videoRef.current) {
      startDetection(videoRef.current);
    }
    return () => {
      stopDetection();
    };
  }, [isReady, isModelLoaded, videoRef, startDetection, stopDetection]);

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses.length > 0) {
      drawSkeleton(
        ctx,
        poses,
        video.videoWidth,
        video.videoHeight,
        canvas.width,
        canvas.height,
      );
    }

    requestAnimationFrame(drawOverlay);
  }, [poses, videoRef]);

  useEffect(() => {
    if (isReady) {
      const rafId = requestAnimationFrame(drawOverlay);
      return () => cancelAnimationFrame(rafId);
    }
  }, [isReady, drawOverlay]);

  if (webcamError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400 text-xl">
        웹캠 오류: {webcamError}
      </div>
    );
  }

  if (modelError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400 text-xl">
        모델 로드 오류: {modelError}
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div
          className={`px-3 py-1 rounded text-sm font-mono ${
            fps >= 15
              ? 'bg-green-600 text-white'
              : fps > 0
                ? 'bg-red-600 text-white'
                : 'bg-gray-600 text-gray-300'
          }`}
        >
          FPS: {fps}
        </div>
        <div className="px-3 py-1 rounded bg-gray-700 text-gray-200 text-sm font-mono">
          Poses: {poses.length}
        </div>
        {!isModelLoaded && (
          <div className="px-3 py-1 rounded bg-yellow-600 text-white text-sm">
            모델 로딩 중...
          </div>
        )}
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          className="max-w-full max-h-[80vh] rounded-lg"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
      </div>

      <div className="mt-4 text-gray-400 text-sm font-mono">
        {poses.map((pose) => (
          <span key={pose.id ?? 'unknown'} className="mr-4">
            Person {pose.id}: {pose.keypoints.length} keypoints (score:{' '}
            {(pose.score ?? 0).toFixed(2)})
          </span>
        ))}
      </div>
    </div>
  );
}
