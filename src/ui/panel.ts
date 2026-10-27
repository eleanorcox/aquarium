// Control panel. It changes the tank only through Tank methods, never by drawing.
import GUI from 'lil-gui';
import { MODELS, MODEL_NAMES, paramSpecs, type ModelId } from '../core/motion';
import type { Tank } from '../core/tank';
import type { PointerInput, PointerMode } from '../input/pointer';
import { VISUALS } from '../render/visuals';
import { SCENES } from '../scenes/scenes';
import { BIOMES, SPECIES } from '../species/catalogue';
import { addSpecies } from '../species/stock';
import type { Display } from '../render/canvas2d';

export interface Controls {
  display: Display;
  paused: boolean;
  /** Keep the selected fish on screen when the tank is bigger than the screen. */
  follow: boolean;
  select(id: number): void;
}

export interface PanelElements {
  equation: HTMLElement;
  editor: HTMLFormElement;
  xInput: HTMLInputElement;
  yInput: HTMLInputElement;
  error: HTMLElement;
}

/** Stands for every fish at once in the Fish list. No fish has this id. */
export const ALL_FISH = -1;

const MODEL_OPTIONS = Object.fromEntries(Object.entries(MODEL_NAMES).map(([id, name]) => [name, id]));
const POINTER_OPTIONS: Record<string, PointerMode> = {
  'Each fish decides': 'fish-decide',
  'Attract all': 'attract',
  'Scatter all': 'scatter',
  Off: 'off',
};

export interface PanelOptions {
  pointer: PointerInput;
  /** How far the pointer reaches, in pixels, so it feels the same at any zoom. */
  reach: { pixels: number };
  scene: string;
  /** The visual mode in use, and what to do when another is chosen. */
  visual: string;
  onVisual: (id: string) => void;
  trails: boolean;
  /** Timings the page keeps up to date, shown read-only for judging speed by eye. */
  stats: Stats;
  /** Webcam hand tracking: whether it is on, and a line saying how it is going. */
  hands: { on: boolean; status: string };
  onHands: (on: boolean) => void;
  /** Movement seen by the webcam facing the room: whether it is on, and what it sees. */
  motion: { on: boolean; status: string };
  onMotion: (on: boolean) => void;
  /** Sharing this tank as a link, and a line saying how that went. */
  link: { status: string };
  /** Corner correction for a projector at an angle. */
  corners: { adjusting: boolean; adjust: (on: boolean) => void; reset: () => void };
  /** A separate display window for a projector, and whether it is open. */
  display: { status: string };
  onOpenDisplay: () => void;
  onCopyLink: () => void;
  /** Adds a fish and returns its id, or the reason it could not be added. */
  onAddFish: () => number | string;
}

export interface Stats {
  fish: number;
  drawn: number;
  /** Milliseconds spent stepping the simulation and drawing, per frame. A frame at 60 a second is 16.7 ms. */
  stepMs: number;
  drawMs: number;
}

export function createPanel(tank: Tank, el: PanelElements, options: PanelOptions): Controls {
  const { pointer, reach, scene, onAddFish } = options;
  const gui = new GUI({ title: 'Equatium' });
  const first = tank.fish[0]?.id ?? 0;
  const state = { fish: first, model: 'sine' as ModelId };
  // The selected fish's behaviour, copied here for the sliders and written back through the tank.
  const behaviour = { pathStrength: 1, curiosity: 0, drift: 0, schools: false };
  const controls: Controls = {
    display: { selected: first, trails: options.trails },
    paused: false,
    follow: false,
    select,
  };

  const fishController = gui.add(state, 'fish', fishOptions()).name('Fish').onChange((id: number) => select(id));
  gui
    .add(state, 'model', MODEL_OPTIONS)
    .name('Motion')
    .onChange((model: ModelId) => {
      for (const id of chosen()) tank.setModel(id, model);
      buildParams();
    });
  const params = gui.addFolder('Parameters');

  const behaviourFolder = gui.addFolder('Behaviour');
  // Only the setting moved is changed, so with All fish chosen every fish keeps its other settings.
  const setBehaviour = (key: keyof typeof behaviour) => (value: number | boolean) => {
    for (const id of chosen()) tank.setBehaviour(id, { [key]: value });
  };
  behaviourFolder.add(behaviour, 'pathStrength', 0, 1, 0.01).name('Holds its route').onChange(setBehaviour('pathStrength'));
  behaviourFolder.add(behaviour, 'curiosity', -1, 1, 0.01).name('Shy ↔ curious').onChange(setBehaviour('curiosity'));
  behaviourFolder.add(behaviour, 'drift', 0, 1, 0.01).name('Drift').onChange(setBehaviour('drift'));
  behaviourFolder.add(behaviour, 'schools').name('Schools').onChange(setBehaviour('schools'));

  const actions = {
    addFish: () => {
      const added = onAddFish();
      if (typeof added === 'string') stocking.message = added;
      else select(added);
    },
    removeFish: () => {
      // The panel always shows one fish, so the last one stays. With All fish chosen, nothing is removed.
      if (tank.fish.length < 2 || allChosen()) return;
      tank.removeFish(controls.display.selected);
      select(tank.fish[0]!.id);
    },
    editAsEquation: () => {
      tank.setModel(controls.display.selected, 'custom');
      select(controls.display.selected);
      el.xInput.focus();
    },
  };
  const editButton = gui.add(actions, 'editAsEquation').name('Edit as equation');

  // Real fish: what kind of tank this is, which place it keeps to, and adding species from the catalogue.
  const speciesIds = Object.keys(SPECIES).sort();
  const stocking = {
    kind: tank.rules.kind,
    biome: tank.rules.biome ?? '',
    species: speciesIds[0] ?? '',
    message: '',
    add: () => {
      const species = SPECIES[stocking.species];
      if (!species) return;
      const added = addSpecies(tank, species);
      if (typeof added === 'string') stocking.message = added;
      else {
        stocking.message = `Added ${added.length === 1 ? 'a' : added.length} ${species.commonName}${added.length === 1 ? '' : ' school'}`;
        select(added[0]!);
      }
    },
  };
  const setRules = () => tank.setRules({ kind: stocking.kind, biome: stocking.biome || null });
  const real = gui.addFolder('Real fish');
  real.add(stocking, 'kind', { 'Made-up: anything goes': 'made-up', 'Real species only': 'real' }).name('Tank').onChange(setRules);
  real.add(stocking, 'biome', { 'Anywhere': '', ...Object.fromEntries(BIOMES.map((b) => [b, b])) }).name('Biome').onChange(setRules);
  real.add(stocking, 'species', Object.fromEntries(speciesIds.map((id) => [SPECIES[id]!.commonName, id]))).name('Species');
  real.add(stocking, 'add').name('Add species');
  real.add(stocking, 'message').name('').listen().disable();
  // A formation: copies of the selected fish sharing its equation, each knowing its place as i of n.
  const formation = {
    size: 12,
    make: () => {
      if (allChosen()) return;
      tank.makeFormation(controls.display.selected, formation.size);
      select(controls.display.selected);
    },
  };
  gui.add(formation, 'size', 2, 60, 1).name('Formation size');
  gui.add(formation, 'make').name('Make a formation');
  gui.add(actions, 'addFish').name('Add fish');
  gui.add(actions, 'removeFish').name('Remove fish');

  const tankFolder = gui.addFolder('Tank');
  tankFolder.add({ copy: options.onCopyLink }, 'copy').name('Copy link to this tank');
  tankFolder.add(options.link, 'status').name('Link').listen().disable();
  const visualOptions = Object.fromEntries(Object.entries(VISUALS).map(([id, v]) => [v.name, id]));
  tankFolder.add({ visual: options.visual }, 'visual', visualOptions).name('Visuals').onChange(options.onVisual);
  const sceneOptions = Object.fromEntries(Object.entries(SCENES).map(([id, s]) => [s.name, id]));
  // Choosing a scene reloads the page with it in the address, so the address always names what is on screen.
  tankFolder
    .add({ scene }, 'scene', sceneOptions)
    .name('Scene')
    .onChange((id: string) => {
      location.search = `?scene=${id}`;
    });
  tankFolder.add(pointer, 'mode', POINTER_OPTIONS).name('Pointer');
  tankFolder.add(reach, 'pixels', 40, 400, 5).name('Pointer reach');
  tankFolder.add(options.hands, 'on').name('Hands (webcam)').listen().onChange(options.onHands);
  tankFolder.add(options.hands, 'status').name('Hands').listen().disable();
  tankFolder.add(options.motion, 'on').name('Movement (webcam)').listen().onChange(options.onMotion);
  tankFolder.add(options.motion, 'status').name('Movement').listen().disable();
  tankFolder.add(tank.flock, 'separation', 0, 2, 0.05).name('School: keep apart');
  tankFolder.add(tank.flock, 'alignment', 0, 2, 0.05).name('School: swim the same way');
  tankFolder.add(tank.flock, 'cohesion', 0, 2, 0.05).name('School: stay together');
  tankFolder.add(controls, 'follow').name('Follow selected fish');
  tankFolder.add(controls.display, 'trails').name('Trails');
  tankFolder.add(controls, 'paused').name('Pause');

  const projector = gui.addFolder('Projector').close();
  projector.add({ open: options.onOpenDisplay }, 'open').name('Open display window');
  projector.add(options.display, 'status').name('Display window').listen().disable();
  projector.add(options.corners, 'adjusting').name('Adjust corners').onChange(options.corners.adjust);
  projector.add(options.corners, 'reset').name('Reset corners');

  const speed = gui.addFolder('Speed').close();
  speed.add(options.stats, 'fish').name('Fish in tank').listen().disable();
  speed.add(options.stats, 'drawn').name('Fish on screen').listen().disable();
  speed.add(options.stats, 'stepMs').name('Step, ms a frame').listen().disable();
  speed.add(options.stats, 'drawMs').name('Draw, ms a frame').listen().disable();

  el.editor.addEventListener('submit', (e) => {
    e.preventDefault();
    const error = tank.setEquations(controls.display.selected, { x: el.xInput.value, y: el.yInput.value });
    el.error.textContent = error ?? '';
    el.error.hidden = error === null;
    if (error === null) showEquation();
  });

  function allChosen(): boolean {
    return controls.display.selected === ALL_FISH;
  }

  /** The ids of the fish the panel is changing: the selected one, or every fish. */
  function chosen(): number[] {
    return allChosen() ? tank.fish.map((f) => f.id) : [controls.display.selected];
  }

  function fishOptions(): Record<string, number> {
    return { 'All fish': ALL_FISH, ...Object.fromEntries(tank.fish.map((f) => [f.name, f.id])) };
  }

  function buildParams(): void {
    // Empty the folder instead of replacing it, so it keeps its place in the panel.
    for (const controller of [...params.controllers]) controller.destroy();
    if (allChosen()) {
      // Fish on different paths have different settings, so path settings are only shown for one fish.
      editButton.show(false);
      el.editor.hidden = true;
      el.error.hidden = true;
      el.equation.hidden = false;
      el.equation.textContent = `All ${tank.fish.length} fish\nMotion and Behaviour changes apply to every fish.`;
      return;
    }
    const fish = tank.get(controls.display.selected);
    for (const [key, spec] of Object.entries(paramSpecs(fish.model))) {
      params
        .add(fish.params, key, spec.min, spec.max, spec.step)
        .name(`${spec.symbol}  ${spec.label}`)
        .onChange((value: number) => {
          tank.setParam(fish.id, key, value);
          showEquation();
        });
    }
    const custom = fish.model === 'custom';
    editButton.show(!custom);
    el.editor.hidden = !custom;
    el.equation.hidden = custom;
    el.error.hidden = true;
    if (custom) {
      el.xInput.value = fish.equations?.x ?? '';
      el.yInput.value = fish.equations?.y ?? '';
    }
    showEquation();
  }

  function showEquation(): void {
    if (allChosen()) return;
    const fish = tank.get(controls.display.selected);
    if (fish.model !== 'custom') el.equation.textContent = `${fish.name}\n${MODELS[fish.model].equation(fish.params)}`;
  }

  function select(id: number): void {
    controls.display.selected = id;
    state.fish = id;
    // With All fish chosen, the controls start from the first fish's settings.
    const fish = id === ALL_FISH ? tank.fish[0]! : tank.get(id);
    state.model = fish.model;
    Object.assign(behaviour, { pathStrength: fish.pathStrength, curiosity: fish.curiosity, drift: fish.drift, schools: fish.schools });
    fishController.options(fishOptions());
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
    buildParams();
  }

  select(first);
  return controls;
}
