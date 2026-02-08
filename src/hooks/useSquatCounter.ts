import { useRef, useMemo } from 'react';
import type { Pose } from '@tensorflow-models/pose-detection';
import { calculateAngle } from '../utils/calculateAngle';
import { SquatCounter } from '../utils/squatCounter';

const MIN_KEYPOINT_SCORE = 0.3;

const LEFT_HIP = 11;
const LEFT_KNEE = 13;
const LEFT_ANKLE = 15;
const RIGHT_HIP = 12;
const RIGHT_KNEE = 14;
const RIGHT_ANKLE = 16;

export interface PersonSquatInfo {
  id: number;
  count: number;
  state: string;
  kneeAngle: number | null;
}

function getKneeAngle(pose: Pose): number | null {
  const kps = pose.keypoints;

  const leftValid =
    (kps[LEFT_HIP].score ?? 0) >= MIN_KEYPOINT_SCORE &&
    (kps[LEFT_KNEE].score ?? 0) >= MIN_KEYPOINT_SCORE &&
    (kps[LEFT_ANKLE].score ?? 0) >= MIN_KEYPOINT_SCORE;

  const rightValid =
    (kps[RIGHT_HIP].score ?? 0) >= MIN_KEYPOINT_SCORE &&
    (kps[RIGHT_KNEE].score ?? 0) >= MIN_KEYPOINT_SCORE &&
    (kps[RIGHT_ANKLE].score ?? 0) >= MIN_KEYPOINT_SCORE;

  if (leftValid && rightValid) {
    const leftAngle = calculateAngle(kps[LEFT_HIP], kps[LEFT_KNEE], kps[LEFT_ANKLE]);
    const rightAngle = calculateAngle(kps[RIGHT_HIP], kps[RIGHT_KNEE], kps[RIGHT_ANKLE]);
    return (leftAngle + rightAngle) / 2;
  }

  if (leftValid) {
    return calculateAngle(kps[LEFT_HIP], kps[LEFT_KNEE], kps[LEFT_ANKLE]);
  }

  if (rightValid) {
    return calculateAngle(kps[RIGHT_HIP], kps[RIGHT_KNEE], kps[RIGHT_ANKLE]);
  }

  return null;
}

export function useSquatCounter(poses: Pose[]) {
  const countersRef = useRef<Map<number, SquatCounter>>(new Map());

  const results = useMemo(() => {
    const infos: PersonSquatInfo[] = [];
    let total = 0;

    for (const pose of poses) {
      const id = pose.id ?? 0;

      if (!countersRef.current.has(id)) {
        countersRef.current.set(id, new SquatCounter());
      }

      const counter = countersRef.current.get(id)!;
      const kneeAngle = getKneeAngle(pose);

      let count: number;
      let state: string;

      if (kneeAngle !== null) {
        const result = counter.update(kneeAngle);
        count = result.count;
        state = result.state;
      } else {
        count = counter.getCount();
        state = counter.getState();
      }

      total += count;
      infos.push({ id, count, state, kneeAngle });
    }

    return { persons: infos, totalCount: total };
  }, [poses]);

  const resetAll = () => {
    countersRef.current.forEach((counter) => counter.reset());
  };

  return { ...results, resetAll };
}
