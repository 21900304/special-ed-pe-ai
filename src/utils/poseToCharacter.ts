import type { Pose } from '@tensorflow-models/pose-detection';

export const CHARACTER_COLORS = [
  '#FF0000', // Red     - 1번
  '#FFA500', // Orange  - 2번
  '#FFD700', // Yellow  - 3번 (골드 계열로 가시성 확보)
  '#00CC00', // Green   - 4번
  '#0066FF', // Blue    - 5번
  '#800080', // Purple  - 6번
] as const;

export const MAX_CHARACTERS = 6;

const MIN_KEYPOINT_SCORE = 0.3;

function getPoseCenterX(pose: Pose): number {
  const kps = pose.keypoints;
  // 어깨: 5, 6 / 엉덩이: 11, 12
  const torsoIndices = [5, 6, 11, 12];
  const validTorso = torsoIndices
    .map((i) => kps[i])
    .filter((kp) => (kp.score ?? 0) >= MIN_KEYPOINT_SCORE);

  if (validTorso.length > 0) {
    return validTorso.reduce((sum, kp) => sum + kp.x, 0) / validTorso.length;
  }

  // fallback: 코(nose)
  const nose = kps[0];
  if ((nose.score ?? 0) >= MIN_KEYPOINT_SCORE) {
    return nose.x;
  }

  // 마지막 fallback: 모든 유효한 키포인트의 평균
  const valid = kps.filter((kp) => (kp.score ?? 0) >= MIN_KEYPOINT_SCORE);
  if (valid.length > 0) {
    return valid.reduce((sum, kp) => sum + kp.x, 0) / valid.length;
  }

  return 0;
}

export function assignCharacterIds(
  poses: Pose[],
): Map<number, number> {
  const mapping = new Map<number, number>();

  const limitedPoses = poses.slice(0, MAX_CHARACTERS);

  const sorted = [...limitedPoses].sort((a, b) => {
    return getPoseCenterX(a) - getPoseCenterX(b);
  });

  sorted.forEach((pose, index) => {
    const poseId = pose.id ?? index;
    mapping.set(poseId, index + 1);
  });

  return mapping;
}

export function getCharacterColor(characterId: number): string {
  const idx = Math.max(0, Math.min(characterId - 1, CHARACTER_COLORS.length - 1));
  return CHARACTER_COLORS[idx];
}
