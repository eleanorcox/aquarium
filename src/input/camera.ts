// Webcam hand tracking: starts the camera, runs the hand-tracking model on each new camera frame, and
// passes the hands it finds to a HandInput. The model and its runtime are served from this project
// (public/mediapipe), so it works without an internet connection.
import { FilesetResolver, HandLandmarker, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { HandInput } from './hands';

const fromProject = (path: string) => new URL(path, document.baseURI).href;

/** Which tracked points join up into the bones of a hand, for drawing over the preview. */
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

export class HandCamera {
  /** A small preview: the camera picture with the tracked hands drawn over it. */
  readonly preview = document.createElement('div');
  /** The latest problem, if tracking has gone wrong, for showing in the panel. */
  problem = '';
  private video = document.createElement('video');
  private overlay = document.createElement('canvas');
  private landmarker?: HandLandmarker;
  private delegate: 'GPU' | 'CPU' = 'GPU';
  private runtime?: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;
  private stream?: MediaStream;
  private running = false;
  private lastFrame = -1;

  constructor(
    private hands: HandInput,
    private seconds: () => number,
  ) {
    this.video.muted = true;
    this.video.playsInline = true;
    this.preview.append(this.video, this.overlay);
  }

  async start(): Promise<void> {
    this.problem = '';
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
    this.overlay.getContext('2d')?.clearRect(0, 0, this.overlay.width, this.overlay.height);
  }

  private async loadModel(delegate: 'GPU' | 'CPU' = this.delegate): Promise<HandLandmarker> {
    this.runtime ??= await FilesetResolver.forVisionTasks(fromProject('mediapipe/wasm'));
    const options = (use: 'GPU' | 'CPU') => ({
      baseOptions: { modelAssetPath: fromProject('mediapipe/hand_landmarker.task'), delegate: use },
      runningMode: 'VIDEO' as const,
      numHands: 2,
    });
    // The graphics card is much faster, but not every browser offers it to the model.
    if (delegate === 'GPU') {
      try {
        return await HandLandmarker.createFromOptions(this.runtime, options('GPU'));
      } catch (error) {
        console.warn('Hand tracking could not use the graphics card; using the processor instead.', error);
      }
    }
    this.delegate = 'CPU';
    return await HandLandmarker.createFromOptions(this.runtime, options('CPU'));
  }

  private track = (): void => {
    if (!this.running || !this.landmarker) return;
    // Only look again when the camera has delivered a new picture with a size.
    if (this.video.currentTime !== this.lastFrame && this.video.videoWidth > 0) {
      this.lastFrame = this.video.currentTime;
      try {
        const result = this.landmarker.detectForVideo(this.video, performance.now());
        this.hands.update(result.landmarks, this.seconds());
        this.draw(result.landmarks);
        this.problem = '';
      } catch (error) {
        // A failure here used to stop tracking silently. Say so, and if the graphics card was the problem,
        // carry on with the processor.
        console.error('Hand tracking failed on a camera frame.', error);
        this.problem = error instanceof Error ? error.message : String(error);
        if (this.delegate === 'GPU') {
          this.delegate = 'CPU';
          const failed = this.landmarker;
          this.landmarker = undefined;
          failed.close();
          void this.loadModel('CPU').then((landmarker) => {
            this.landmarker = landmarker;
            requestAnimationFrame(this.track);
          });
          return;
        }
      }
    }
    requestAnimationFrame(this.track);
  };

  /** Draws the tracked points and bones over the preview, so it is clear what the camera has found. */
  private draw(hands: NormalizedLandmark[][]): void {
    const { overlay, video } = this;
    if (overlay.width !== video.videoWidth) [overlay.width, overlay.height] = [video.videoWidth, video.videoHeight];
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = 'rgba(110, 231, 214, 0.9)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 3;
    for (const points of hands) {
      ctx.beginPath();
      for (const [a, b] of BONES) {
        const [p, q] = [points[a!]!, points[b!]!];
        ctx.moveTo(p.x * overlay.width, p.y * overlay.height);
        ctx.lineTo(q.x * overlay.width, q.y * overlay.height);
      }
      ctx.stroke();
      for (const p of points) ctx.fillRect(p.x * overlay.width - 3, p.y * overlay.height - 3, 6, 6);
    }
  }
}
