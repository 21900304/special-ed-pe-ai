import { useEffect, useRef, useState } from 'react';
import type { Pose } from '@tensorflow-models/pose-detection';
import { CharacterCanvas } from './CharacterCanvas';
import type { PoseBroadcastMessage } from '../types/broadcast';
import { POSE_CHANNEL_NAME } from '../types/broadcast';

export function StudentView() {
  const [poses, setPoses] = useState<Pose[]>([]);
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel(POSE_CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<PoseBroadcastMessage>) => {
      const { poses: newPoses, videoWidth, videoHeight } = event.data;
      setPoses(newPoses);
      setVideoSize({ width: videoWidth, height: videoHeight });
      setIsConnected(true);
      setLastUpdate(Date.now());
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (Date.now() - lastUpdate > 3000) {
        setIsConnected(false);
        setPoses([]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, lastUpdate]);

  return (
    <div className="w-full h-screen bg-gray-950 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        <div className="px-3 py-1 rounded bg-purple-600 text-white text-sm font-bold">
          학생 화면 (Display)
        </div>
        <div
          className={`px-3 py-1 rounded text-sm font-mono ${
            isConnected
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {isConnected ? `📡 수신 중 (${poses.length}명)` : '⏳ 연결 대기'}
        </div>
      </div>

      <CharacterCanvas
        poses={poses}
        width={960}
        height={540}
        videoWidth={videoSize.width}
        videoHeight={videoSize.height}
        mirrored={true}
      />

      {!isConnected && (
        <div className="mt-6 text-gray-500 text-center">
          <p className="text-lg">교사 화면 (/teacher) 을 먼저 열어주세요</p>
          <p className="text-sm mt-2">같은 브라우저에서 다른 탭으로 열어야 합니다</p>
        </div>
      )}
    </div>
  );
}
