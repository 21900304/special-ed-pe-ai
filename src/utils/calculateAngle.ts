/**
 * 세 점 사이의 각도를 계산한다 (p2가 꼭짓점).
 * atan2를 사용하여 벡터 p2→p1과 p2→p3 사이의 각도를 0~180도로 반환.
 */
export function calculateAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
): number {
  const radians =
    Math.atan2(p3.y - p2.y, p3.x - p2.x) -
    Math.atan2(p1.y - p2.y, p1.x - p2.x);

  let angle = Math.abs(radians * (180 / Math.PI));

  if (angle > 180) {
    angle = 360 - angle;
  }

  return angle;
}
