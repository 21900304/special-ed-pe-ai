import { useRef, useState, useCallback, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

interface UseMoveNetReturn {
  poses: poseDetection.Pose[];
  fps: number;
  isModelLoaded: boolean;
  modelError: string | null;
  startDetection: (video: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export function useMoveNet(): UseMoveNetReturn {
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const rafIdRef = useRef<number>(0);
  const isRunningRef = useRef(false);
  const [poses, setPoses] = useState<poseDetection.Pose[]>([]);
  const [fps, setFps] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      try {
        console.log('[MoveNet] Initializing TF.js backend...');
        await tf.ready();
        console.log(`[MoveNet] Backend: ${tf.getBackend()}`);
        console.log('[MoveNet] Loading model...');
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING,
            enableSmoothing: true,
            multiPoseMaxDimension: 256,
            enableTracking: true,
            trackerType: poseDetection.TrackerType.BoundingBox,
          }
        );

        if (cancelled) {
          detector.dispose();
          return;
        }

        detectorRef.current = detector;
        setIsModelLoaded(true);
        console.log('MoveNet model loaded');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load MoveNet model';
        console.error('[MoveNet] Load error:', message);
        if (!cancelled) {
          setModelError(message);
        }
      }
    }

    void loadModel();

    return () => {
      cancelled = true;
    };
  }, []);

  const stopDetection = useCallback(() => {
    isRunningRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = 0;
    }
  }, []);

  const startDetection = useCallback(
    (video: HTMLVideoElement) => {
      if (!detectorRef.current) return;
      if (isRunningRef.current) return;

      isRunningRef.current = true;
      let lastTime = performance.now();
      let frameCount = 0;

      const detect = async () => {
        if (!isRunningRef.current || !detectorRef.current) return;

        try {
          if (video.readyState >= 2) {
            const result = await detectorRef.current.estimatePoses(video);
            setPoses(result);

            frameCount++;
            const now = performance.now();
            const elapsed = now - lastTime;
            if (elapsed >= 1000) {
              const currentFps = Math.round((frameCount * 1000) / elapsed);
              setFps(currentFps);

              console.log(
                `[MoveNet] FPS: ${currentFps} | Detected ${result.length} poses | IDs: [${result.map((p) => p.id).join(', ')}]`
              );

              if (result.length > 0) {
                console.log(
                  `[MoveNet] Pose 0 keypoints: ${result[0].keypoints.length}, score: ${result[0].score?.toFixed(3)}`
                );
              }

              frameCount = 0;
              lastTime = now;
            }
          }
        } catch (err) {
          console.error('[MoveNet] Detection error:', err);
        }

        if (isRunningRef.current) {
          rafIdRef.current = requestAnimationFrame(detect);
        }
      };

      rafIdRef.current = requestAnimationFrame(detect);
    },
    []
  );

  useEffect(() => {
    return () => {
      stopDetection();
      if (detectorRef.current) {
        detectorRef.current.dispose();
        detectorRef.current = null;
      }
    };
  }, [stopDetection]);

  return {
    poses,
    fps,
    isModelLoaded,
    modelError,
    startDetection,
    stopDetection,
  };
}
