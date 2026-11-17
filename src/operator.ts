import { MODELS, type BuiltinId } from './core/motion';
import { decodeTank, encodeTank, loadTank, saveTank } from './core/save';
import { Tank } from './core/tank';
import type { HandCamera } from './input/camera';
import { MotionInput } from './input/motion';
import type { MotionCamera } from './input/motionCamera';
import { HandInput } from './input/hands';
import { PointerInput } from './input/pointer';
import { ViewGestures } from './input/viewGestures';
import { Canvas2DRenderer } from './render/canvas2d';
import { fishInView } from './render/drawList';
import { createVisual } from './render/visuals';
import { View } from './render/view';
import { CHANNEL, isDisplayMessage, packFrame } from './display/frames';
import type { Influence } from './core/steering';
import { SCENES, buildScene } from './scenes/scenes';
import { addMadeUpFish } from './species/stock';
import { setUpCorners } from './ui/corners';
import { createPanel } from './ui/panel';
import { rememberCameras, rememberedCameras } from './ui/remembered';

/** Starts the operator window: the tank, its controls and its inputs. Called once by main.ts. */
export async function startOperator(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#tank')!;
  const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

  const address = new URLSearchParams(location.search);
  const link = { status: '' };

  /** The tank in the address if there is a good one, otherwise the scene named there, or the default scene. */
  async function startingTank(): Promise<{ tank: Tank; scene: string }> {
    const shared = address.get('tank');
    if (shared) {
      const loaded = loadTank(await decodeTank(shared));
      if (typeof loaded !== 'string') return { tank: loaded, scene: '' };
      link.status = `Could not open the linked tank. ${loaded}`;
    }
    const tank = new Tank();
    return { tank, scene: buildScene(tank, address.get('scene')) };
  }
  const { tank, scene } = await startingTank();

  // The tank has its own size. The view is this screen's window onto it.
  const renderer = new Canvas2DRenderer(canvas, createVisual(address.get('visuals')));
  let screen = renderer.resize();
  const view = new View(tank, screen, tank.typicalFishSize(), { fill: SCENES[scene]?.fill });
  new ResizeObserver(() => {
    view.setScreen((screen = renderer.resize()));
    corners.resized(screen);
  }).observe(canvas);

  // Corner correction, for a projector at an angle, when this window itself is projected.
  const corners = setUpCorners(canvas, screen);
  const toPicture = corners.toPicture;
  const cornersState = corners.state;

  const panelElements = {
    equation: $('#equation'),
    editor: $<HTMLFormElement>('#editor'),
    xInput: $<HTMLInputElement>('#eq-x'),
    yInput: $<HTMLInputElement>('#eq-y'),
    error: $('#eq-error'),
  };

  const pointer = new PointerInput();
  const reach = { pixels: 180 };
  const gestures = new ViewGestures(view);
  const seconds = () => performance.now() / 1000;

  // A display window on a projector, if one is open. It reports which part of the tank it shows and any touches.
  const displayChannel = new BroadcastChannel(CHANNEL);
  const display = { status: 'Not open', area: null as { x: number; y: number; width: number; height: number } | null, heard: -Infinity, touch: null as Influence | null };
  displayChannel.addEventListener('message', (e: MessageEvent<unknown>) => {
    if (!isDisplayMessage(e.data)) return;
    display.heard = seconds();
    if (e.data.type === 'shown') display.area = e.data.area;
    if (e.data.type === 'pointer') display.touch = e.data.influence;
  });
  const displayOpen = () => seconds() - display.heard < 3;

  // The camera picture is spread across whatever part of the tank is on screen: the projected one if a display
  // window is open, since that is what people in front of the camera are looking at.
  const hands = new HandInput((across, down) =>
    displayOpen() && display.area
      ? { x: display.area.x + across * display.area.width, y: display.area.y + down * display.area.height }
      : view.toTank({ x: across * screen.width, y: down * screen.height }),
  );
  // The camera and its tracking library are only loaded when hands are first switched on, to keep start-up quick.
  let camera: HandCamera | undefined;
  async function getCamera(): Promise<HandCamera> {
    if (camera) return camera;
    const { HandCamera } = await import('./input/camera');
    camera = new HandCamera(hands, seconds);
    camera.preview.id = 'camera';
    camera.preview.hidden = true;
    document.body.append(camera.preview);
    return camera;
  }
  // Movement seen by the webcam facing the room, mapped the same way as hands.
  const motion = new MotionInput((across, down) =>
    displayOpen() && display.area
      ? { x: display.area.x + across * display.area.width, y: display.area.y + down * display.area.height }
      : view.toTank({ x: across * screen.width, y: down * screen.height }),
  );
  let motionCamera: MotionCamera | undefined;
  const motionState = { on: false, status: 'Off' };
  async function setMotion(on: boolean): Promise<void> {
    if (!on) {
      motionCamera?.stop();
      motionState.status = 'Off';
      return;
    }
    motionState.status = 'Starting…';
    try {
      const { MotionCamera } = await import('./input/motionCamera');
      motionCamera ??= new MotionCamera(motion, seconds);
      await motionCamera.start();
      motionState.status = 'Nothing moving';
    } catch (error) {
      motionState.on = false;
      motionState.status = error instanceof DOMException && error.name === 'NotAllowedError' ? 'Camera not allowed' : 'Could not start';
      console.error(error);
    }
  }

  const handsState = { on: false, status: 'Off' };
  async function setHands(on: boolean): Promise<void> {
    if (!on) {
      camera?.stop();
      if (camera) camera.preview.hidden = true;
      handsState.status = 'Off';
      return;
    }
    handsState.status = 'Starting…';
    try {
      const started = await getCamera();
      await started.start();
      started.preview.hidden = false;
      handsState.status = 'No hands seen';
    } catch (error) {
      handsState.on = false;
      handsState.status = error instanceof DOMException && error.name === 'NotAllowedError' ? 'Camera not allowed' : 'Could not start';
      console.error(error);
    }
  }

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const at = toPicture(e);
    gestures.down(e.pointerId, at.x, at.y, e.pointerType);
  });
  canvas.addEventListener('pointermove', (e) => {
    const at = toPicture(e);
    gestures.move(e.pointerId, at.x, at.y);
    const inTank = view.toTank(at);
    pointer.move(inTank.x, inTank.y, seconds());
  });
  for (const type of ['pointerup', 'pointercancel'] as const) {
    canvas.addEventListener(type, (e) => {
      gestures.up(e.pointerId);
      // A lifted finger is gone; a mouse is still there after its button is released.
      if (e.pointerType !== 'mouse') pointer.leave();
    });
  }
  canvas.addEventListener('pointerleave', () => pointer.leave());
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const at = toPicture(e);
      gestures.wheel(at.x, at.y, e.deltaY);
    },
    { passive: false },
  );

  const stats = { fish: 0, drawn: 0, stepMs: 0, drawMs: 0 };

  // The camera switches outlast the page, so choosing another scene, which reloads it, leaves the webcam as it was.
  // Reaching storage at all can fail in a private window, so it is only touched inside the remembering functions' checks.
  const kept = { getItem: (key: string) => localStorage.getItem(key), setItem: (key: string, value: string) => localStorage.setItem(key, value) };
  const keepCameras = () => rememberCameras(kept, { hands: handsState.on, motion: motionState.on });
  const cameras = rememberedCameras(kept);
  if (cameras.hands) {
    handsState.on = true;
    void setHands(true).then(keepCameras);
  }
  if (cameras.motion) {
    motionState.on = true;
    void setMotion(true).then(keepCameras);
  }

  const controls = createPanel(tank, panelElements, {
    pointer,
    stats,
    hands: handsState,
    motion: motionState,
    onMotion: (on) => void setMotion(on).then(keepCameras),
    corners: cornersState,
    display,
    onOpenDisplay: () => window.open('?display', 'equatium-display', 'popup,width=1280,height=720'),
    link,
    onCopyLink: () => void copyLink(),
    onHands: (on) => void setHands(on).then(keepCameras),
    reach,
    scene,
    visual: renderer.visual.id,
    onVisual: (id) => {
      renderer.visual = createVisual(id);
      // The address names what is on screen, so a link opens the same scene in the same look.
      address.set('visuals', id);
      history.replaceState(null, '', `?${address}`);
    },
    trails: SCENES[scene]?.trails ?? true,
    onAddFish: () => {
      const ids = Object.keys(MODELS) as BuiltinId[];
      const model = ids[Math.floor(Math.random() * ids.length)] ?? 'sine';
      // A real-fish tank refuses made-up fish, and says why.
      const added = addMadeUpFish(tank, model);
      if (typeof added === 'string') return added;
      tank.setParam(added, 'phi', Math.random() * 6.28);
      tank.setBehaviour(added, { curiosity: Math.random() * 2 - 1, drift: 0.3, pathStrength: 0.5 });
      return added;
    },
  });

  canvas.addEventListener('click', (e) => {
    if (gestures.dragged) return;
    const at = view.toTank(toPicture(e));
    // Within about 60 pixels, however far the view is zoomed.
    const id = renderer.pick(at, tank, view.tankLength(60));
    if (id !== undefined) controls.select(id);
  });

  /** Averages the timings over about half a second, so the numbers can be read. */
  function showSpeed(stepMs: number, drawMs: number): void {
    const smooth = (old: number, now: number) => Math.round((old * 0.97 + now * 0.03) * 100) / 100;
    stats.stepMs = smooth(stats.stepMs, stepMs);
    stats.drawMs = smooth(stats.drawMs, drawMs);
    stats.fish = tank.fish.length;
    stats.drawn = fishInView(tank.fish, view, renderer.visual.reach).length;
  }

  /** Puts this tank, as it is now, into the address and copies the address to share. */
  async function copyLink(): Promise<void> {
    address.delete('scene');
    address.set('tank', await encodeTank(saveTank(tank)));
    history.replaceState(null, '', `?${address}`);
    try {
      await navigator.clipboard.writeText(location.href);
      link.status = 'Link copied';
    } catch {
      link.status = 'Link is in the address bar';
    }
  }

  // H, or the small button in the corner, hides the panel and equation, for watching or recording the tank
  // on its own. The button is for touch screens, which have no H. A phone, or a link with ?watch, starts hidden.
  const toggle = document.createElement('button');
  toggle.id = 'controls-toggle';
  toggle.type = 'button';
  const showBare = (bare: boolean) => {
    document.body.classList.toggle('bare', bare);
    toggle.textContent = bare ? 'Show controls' : 'Hide';
    toggle.setAttribute('aria-label', bare ? 'Show controls' : 'Hide controls');
  };
  toggle.addEventListener('click', () => showBare(!document.body.classList.contains('bare')));
  document.body.append(toggle);
  showBare(address.has('watch') || window.matchMedia('(max-width: 640px)').matches);
  window.addEventListener('keydown', (e) => {
    const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
    if (e.key.toLowerCase() === 'h' && !typing && !e.metaKey && !e.ctrlKey) showBare(!document.body.classList.contains('bare'));
  });

  // Fixed timestep: the simulation advances in equal 1/60 s steps whatever the screen's refresh rate,
  // so a fish follows exactly the same path on a laptop, a 144 Hz monitor or a projector.
  const DT = 1 / 60;
  let accumulator = 0;
  let previous = performance.now();

  function frame(now: number): void {
    accumulator += Math.min(0.25, (now - previous) / 1000);
    previous = now;
    if (controls.paused) accumulator = 0;
    // The pointer reaches the same distance on screen however far the view is zoomed.
    pointer.radius = hands.radius = motion.radius = view.tankLength(reach.pixels);
    if (motionState.on && !motionState.status.startsWith('Starting')) motionState.status = motion.describe();
    // Say what the camera sees, or what went wrong, so it is clear whether hands are being found.
    if (handsState.on && !handsState.status.startsWith('Starting')) handsState.status = camera?.problem ? `Problem: ${camera.problem}` : hands.describe();
    const touch = displayOpen() && display.touch ? [display.touch] : [];
    tank.setInfluences([...pointer.influences(seconds()), ...hands.influences(seconds()), ...motion.influences(seconds()), ...touch]);
    const stepStart = performance.now();
    while (accumulator >= DT) {
      tank.step(DT);
      accumulator -= DT;
    }
    const drawStart = performance.now();
    const followed = tank.fish.find((f) => f.id === controls.display.selected);
    if (controls.follow && followed) view.follow(followed);
    renderer.render(tank, view, controls.display);
    display.status = displayOpen() ? 'Open' : 'Not open';
    if (displayOpen()) {
      displayChannel.postMessage(packFrame(tank, { visual: renderer.visual.id, fill: SCENES[scene]?.fill ?? false, selected: controls.display.selected, trails: false }));
    }
    showSpeed(drawStart - stepStart, performance.now() - drawStart);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
