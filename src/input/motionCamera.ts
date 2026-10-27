// The webcam for movement: shrinks each new camera picture to a few dozen pixels across and passes it to a
// MotionInput. Small pictures are enough to see where people are moving, and quick to compare.
import type { MotionInput } from './motion';

const SIZE = { width: 64, height: 48 };

export class MotionCamera {
  private video = document.createElement('video');
  private small = document.createElement('canvas');
  private stream?: MediaStream;
  private running = false;
  private lastFrame = -1;

  constructor(
    private motion: MotionInput,
    private seconds: () => number,
  ) {
    this.video.muted = true;
    this.video.playsInline = true;
    [this.small.width, this.small.height] = [SIZE.width, SIZE.height];
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
    this.video.srcObject = this.stream;
    await this.video.play();
    this.running = true;
    requestAnimationFrame(this.look);
  }

  stop(): void {
    this.running = false;
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.video.srcObject = null;
  }

  private look = (): void => {
    if (!this.running) return;
    const ctx = this.small.getContext('2d', { willReadFrequently: true });
    if (ctx && this.video.currentTime !== this.lastFrame && this.video.videoWidth > 0) {
      this.lastFrame = this.video.currentTime;
      ctx.drawImage(this.video, 0, 0, SIZE.width, SIZE.height);
      this.motion.update(ctx.getImageData(0, 0, SIZE.width, SIZE.height), this.seconds());
    }
    requestAnimationFrame(this.look);
  };
}
