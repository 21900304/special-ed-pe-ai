import type { Pose } from '@tensorflow-models/pose-detection';

export interface PoseBroadcastMessage {
  poses: Pose[];
  timestamp: number;
  videoWidth: number;
  videoHeight: number;
}

export const POSE_CHANNEL_NAME = 'pose-data';
