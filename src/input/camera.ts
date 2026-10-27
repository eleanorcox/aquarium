// Webcam hand tracking: starts the camera, runs the hand-tracking model on each new camera frame, and
// passes the hands it finds to a HandInput. The model and its runtime are served from this project
// (public/mediapipe), so it works without an internet connection.
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandInput } from './hands';

const fromProject = (path: string) => new URL(path, document.baseURI).href;

export class HandCamera {
  /** The camera picture, for showing as a small preview. */
  readonly video = document.createElement('video');
  private landmarker?: HandLandmarker;
  private stream?: MediaStream;
  private running = false;
  private lastFrame = -1;

  constructor(
    private hands: HandInput,
    private seconds: () => number,
  ) {
    this.video.muted = true;
    this.video.playsInline = true;
  }

  async start(): Promise<void> {
    this.landmarker ??= await this.loadModel();
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
    this.video.srcObject = this.stream;
    await this.video.play();
    this.running = true;
    requestAnimationFrame(this.track);
  }

  stop(): void {
    this.running = false;
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.video.srcObject = null;
    this.hands.update([], this.seconds());
  }

  private async loadModel(): Promise<HandLandmarker> {
    const runtime = await FilesetResolver.forVisionTasks(fromProject('mediapipe/wasm'));
    const options = (delegate: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: fromProject('mediapipe/hand_landmarker.task'), delegate },
      runningMode: 'VIDEO' as const,
      numHands: 2,
    });
    // The graphics card is much faster, but not every browser offers it to the model.
    try {
      return await HandLandmarker.createFromOptions(runtime, options('GPU'));
    } catch {
      return await HandLandmarker.createFromOptions(runtime, options('CPU'));
    }
  }

  private track = (): void => {
    if (!this.running || !this.landmarker) return;
    // Only look again when the camera has delivered a new picture.
    if (this.video.currentTime !== this.lastFrame) {
      this.lastFrame = this.video.currentTime;
      const result = this.landmarker.detectForVideo(this.video, performance.now());
      this.hands.update(result.landmarks, this.seconds());
    }
    requestAnimationFrame(this.track);
  };
}
