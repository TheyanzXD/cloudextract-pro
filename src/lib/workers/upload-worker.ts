// Web Worker to compute smooth progress, transfer speed, and ETA without blocking main thread
export interface WorkerProgressMessage {
  fileId: string;
  loaded: number;
  total: number;
  timestamp: number;
}

export interface WorkerProgressResponse {
  fileId: string;
  percentage: number;
  speedBytesPerSec: number;
  estimatedSecondsLeft: number;
}

const fileStates = new Map<
  string,
  {
    lastLoaded: number;
    lastTimestamp: number;
    speed: number;
  }
>();

self.onmessage = (e: MessageEvent<WorkerProgressMessage>) => {
  const { fileId, loaded, total, timestamp } = e.data;
  const state = fileStates.get(fileId);

  let speed = 0;
  if (state) {
    const timeDelta = (timestamp - state.lastTimestamp) / 1000;
    if (timeDelta > 0.3) {
      const bytesDelta = loaded - state.lastLoaded;
      const currentSpeed = bytesDelta / timeDelta;
      // Exponential moving average for smooth speed display
      speed = state.speed * 0.7 + currentSpeed * 0.3;
      fileStates.set(fileId, {
        lastLoaded: loaded,
        lastTimestamp: timestamp,
        speed,
      });
    } else {
      speed = state.speed;
    }
  } else {
    fileStates.set(fileId, {
      lastLoaded: loaded,
      lastTimestamp: timestamp,
      speed: 0,
    });
  }

  const percentage = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
  const remainingBytes = Math.max(0, total - loaded);
  const estimatedSecondsLeft = speed > 0 ? Math.round(remainingBytes / speed) : 0;

  const response: WorkerProgressResponse = {
    fileId,
    percentage,
    speedBytesPerSec: Math.round(speed),
    estimatedSecondsLeft,
  };

  self.postMessage(response);
};
