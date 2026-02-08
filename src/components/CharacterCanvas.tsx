import { useRef, useEffect, useCallback } from 'react';
import type { Pose } from '@tensorflow-models/pose-detection';
import { assignCharacterIds, getCharacterColor } from '../utils/poseToCharacter';

// COCO 17-keypoint indices
const NOSE = 0;
const LEFT_SHOULDER = 5;
const RIGHT_SHOULDER = 6;
const LEFT_ELBOW = 7;
const RIGHT_ELBOW = 8;
const LEFT_WRIST = 9;
const RIGHT_WRIST = 10;
const LEFT_HIP = 11;
const RIGHT_HIP = 12;
const LEFT_KNEE = 13;
const RIGHT_KNEE = 14;
const LEFT_ANKLE = 15;
const RIGHT_ANKLE = 16;

const MIN_SCORE = 0.3;

interface CharacterCanvasProps {
  poses: Pose[];
  width?: number;
  height?: number;
  videoWidth?: number;
  videoHeight?: number;
  mirrored?: boolean;
}

function kpValid(kp: { score?: number }): boolean {
  return (kp.score ?? 0) >= MIN_SCORE;
}

function midpoint(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  color: string,
  characterId: number,
  scaleX: number,
  scaleY: number,
  canvasWidth: number,
  mirrored: boolean,
) {
  const kps = pose.keypoints;

  function tx(x: number): number {
    const scaled = x * scaleX;
    return mirrored ? canvasWidth - scaled : scaled;
  }
  function ty(y: number): number {
    return y * scaleY;
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const drawLine = (i1: number, i2: number) => {
    const a = kps[i1];
    const b = kps[i2];
    if (!kpValid(a) || !kpValid(b)) return;
    ctx.beginPath();
    ctx.moveTo(tx(a.x), ty(a.y));
    ctx.lineTo(tx(b.x), ty(b.y));
    ctx.stroke();
  };

  const nose = kps[NOSE];
  const lShoulder = kps[LEFT_SHOULDER];
  const rShoulder = kps[RIGHT_SHOULDER];

  if (kpValid(nose)) {
    let headRadius = 20;
    if (kpValid(lShoulder) && kpValid(rShoulder)) {
      const shoulderDist = Math.hypot(
        lShoulder.x - rShoulder.x,
        lShoulder.y - rShoulder.y,
      );
      headRadius = Math.max(12, shoulderDist * scaleX * 0.35);
    }

    ctx.beginPath();
    ctx.arc(tx(nose.x), ty(nose.y), headRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = `bold ${Math.max(18, headRadius * 1.2)}px sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(
      String(characterId),
      tx(nose.x),
      ty(nose.y) - headRadius - 6,
    );
  }

  ctx.lineWidth = 4;
  ctx.strokeStyle = color;

  if (kpValid(lShoulder) && kpValid(rShoulder)) {
    const shoulderMid = midpoint(lShoulder, rShoulder);
    const lHip = kps[LEFT_HIP];
    const rHip = kps[RIGHT_HIP];

    if (kpValid(lHip) && kpValid(rHip)) {
      const hipMid = midpoint(lHip, rHip);
      ctx.beginPath();
      ctx.moveTo(tx(shoulderMid.x), ty(shoulderMid.y));
      ctx.lineTo(tx(hipMid.x), ty(hipMid.y));
      ctx.stroke();
    }

    drawLine(LEFT_SHOULDER, RIGHT_SHOULDER);
  }

  drawLine(LEFT_SHOULDER, LEFT_ELBOW);
  drawLine(LEFT_ELBOW, LEFT_WRIST);
  drawLine(RIGHT_SHOULDER, RIGHT_ELBOW);
  drawLine(RIGHT_ELBOW, RIGHT_WRIST);

  drawLine(LEFT_HIP, RIGHT_HIP);

  drawLine(LEFT_HIP, LEFT_KNEE);
  drawLine(LEFT_KNEE, LEFT_ANKLE);
  drawLine(RIGHT_HIP, RIGHT_KNEE);
  drawLine(RIGHT_KNEE, RIGHT_ANKLE);
}

export function CharacterCanvas({
  poses,
  width = 960,
  height = 540,
  videoWidth = 640,
  videoHeight = 480,
  mirrored = true,
}: CharacterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    if (poses.length === 0) {
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#666';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('포즈 데이터 대기 중...', width / 2, height / 2);
      return;
    }

    const scaleX = width / videoWidth;
    const scaleY = height / videoHeight;

    const idMap = assignCharacterIds(poses);

    for (const pose of poses) {
      const poseId = pose.id ?? 0;
      const characterId = idMap.get(poseId) ?? 1;
      const color = getCharacterColor(characterId);

      drawStickFigure(ctx, pose, color, characterId, scaleX, scaleY, width, mirrored);
    }
  }, [poses, width, height, videoWidth, videoHeight, mirrored]);

  useEffect(() => {
    const rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="bg-gray-900 rounded-lg"
      style={{ width, height }}
    />
  );
}
