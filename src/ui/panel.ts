// Control panel. It changes the tank only through Tank methods, never by drawing.
import GUI from 'lil-gui';
import { MODELS, MODEL_NAMES, describeFree, paramSpecs, type ModelId } from '../core/motion';
import type { Tank } from '../core/tank';
import type { PointerInput, PointerMode } from '../input/pointer';
import { VISUALS } from '../render/visuals';
import { SCENES } from '../scenes/scenes';
import { BIOMES, SPECIES } from '../species/catalogue';
import { addSpecies, type GroupKind } from '../species/stock';
import { fishGroups, type FishGroup } from './groups';
import { sceneAddress } from './remembered';
import type { Display } from '../render/canvas2d';

export interface Controls {
  display: Display;
  paused: boolean;
  /** Keep the selected fish on screen when the tank is bigger than the screen. */
  follow: boolean;
  select(id: number): void;
  /** Brings the Fish list up to date after fish arrive or leave from outside the panel, keeping the choice if it can. */
  refresh(): void;
}

export interface PanelElements {
  equation: HTMLElement;
  editor: HTMLFormElement;
  xInput: HTMLInputElement;
  yInput: HTMLInputElement;
  error: HTMLElement;
}

/** Stands for every fish at once in the Fish list. Other groups follow it as -2, -3 and so on; no fish has a negative id. */
export const ALL_FISH = -1;
const groupId = (index: number) => -1 - index;

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
  /** Visitors adding fish from their phones: whether a room is open, how it is going, and the operator's choices. */
  visitors: { on: boolean; status: string; showCode: boolean; askFirst: boolean };
  onVisitors: (on: boolean) => void;
  onClearVisitors: () => void;
  /** Adds this many made-up fish, arriving this way, and returns their ids, or the reason they could not be added. */
  onAddFish: (count: number, kind: GroupKind) => number[] | string;
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
  const look = { hue: 0, size: 0.04 };
  // The groups on offer the last time the Fish list was refreshed, and the fish added most recently.
  let groups: FishGroup[] = [];
  let justAdded: number[] = [];
  const speciesNames = Object.fromEntries(Object.entries(SPECIES).map(([id, s]) => [id, s.commonName]));
  const controls: Controls = {
    display: { selected: first, trails: options.trails },
    paused: false,
    follow: false,
    select,
    refresh: () => {
      const still = controls.display.selected < 0 || tank.fish.some((f) => f.id === controls.display.selected);
      select(still ? controls.display.selected : tank.fish[0]!.id);
    },
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

  const lookFolder = gui.addFolder('Look');
  lookFolder.add(look, 'hue', 0, 360, 1).name('Colour').onChange((hue: number) => {
    for (const id of chosen()) tank.setLook(id, { hue });
  });
  lookFolder.add(look, 'size', 0.005, 0.12, 0.001).name('Size').onChange((size: number) => {
    for (const id of chosen()) tank.setFishSize(id, size);
  });

  const adding = { count: 1, kind: 'mixed' as GroupKind };
  const actions = {
    addFish: () => {
      const added = onAddFish(adding.count, adding.kind);
      if (typeof added === 'string') {
        stocking.message = added;
        return;
      }
      justAdded = added;
      // Several fish arrive chosen together, so they can be changed at once straight away.
      if (added.length === 1) select(added[0]!);
      else {
        refreshGroups();
        select(groupId(groups.findIndex((g) => g.name.startsWith('Just added'))));
      }
    },
    removeFish: () => {
      // The tank always keeps at least one fish, so the panel has one to show.
      const going = chosen();
      for (const id of going.slice(0, Math.min(going.length, tank.fish.length - 1))) tank.removeFish(id);
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
  gui.add(adding, 'count', 1, 300, 1).name('How many');
  gui
    .add(adding, 'kind', { 'Separate fish': 'mixed', 'A school on one route': 'school', 'A free-swimming school': 'free' })
    .name('Add as');
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
      location.search = sceneAddress(location.search, id);
    });
  tankFolder.add(pointer, 'mode', POINTER_OPTIONS).name('Pointer');
  tankFolder.add(reach, 'pixels', 40, 400, 5).name('Pointer reach');
  tankFolder.add(options.hands, 'on').name('Hands (webcam)').listen().onChange(options.onHands);
  tankFolder.add(options.hands, 'status').name('Hands').listen().disable();
  tankFolder.add(options.motion, 'on').name('Movement (webcam)').listen().onChange(options.onMotion);
  tankFolder.add(options.motion, 'status').name('Movement').listen().disable();
  tankFolder.add(tank, 'strays', { 'Swim home to their own school': 'home', 'Join the nearest school': 'join' }).name('Pushed-out fish');
  tankFolder.add(tank.flock, 'separation', 0, 2, 0.05).name('School: keep apart');
  tankFolder.add(tank.flock, 'alignment', 0, 2, 0.05).name('School: swim the same way');
  tankFolder.add(tank.flock, 'cohesion', 0, 2, 0.05).name('School: stay together');
  tankFolder.add(controls, 'follow').name('Follow selected fish');
  tankFolder.add(controls.display, 'trails').name('Trails');
  tankFolder.add(controls, 'paused').name('Pause');

  // Visitors: a room on the visitor service, the QR code that leads phones to it, and the fish they send.
  const visitorsFolder = gui.addFolder("Visitors' fish");
  visitorsFolder.add(options.visitors, 'on').name('Take fish from phones').listen().onChange(options.onVisitors);
  visitorsFolder.add(options.visitors, 'status').name('Room').listen().disable();
  visitorsFolder.add(options.visitors, 'showCode').name('Show QR code');
  visitorsFolder.add(options.visitors, 'askFirst').name('Ask before letting coloured-in fish in');
  visitorsFolder.add({ clear: options.onClearVisitors }, 'clear').name("Clear visitors' fish");

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

  /** Whether a group, such as All fish or a school, is chosen instead of one fish. */
  function allChosen(): boolean {
    return controls.display.selected < 0;
  }

  function chosenGroup(): FishGroup | undefined {
    return groups[-1 - controls.display.selected];
  }

  /** The ids of the fish the panel is changing: the selected one, or every fish still in the chosen group. */
  function chosen(): number[] {
    if (!allChosen()) return [controls.display.selected];
    const ids = new Set(tank.fish.map((f) => f.id));
    return (chosenGroup()?.ids ?? []).filter((id) => ids.has(id));
  }

  function refreshGroups(): void {
    groups = fishGroups(tank, justAdded, speciesNames);
  }

  function fishOptions(): Record<string, number> {
    refreshGroups();
    return { ...Object.fromEntries(groups.map((g, i) => [g.name, groupId(i)])), ...Object.fromEntries(tank.fish.map((f) => [f.name, f.id])) };
  }

  function buildParams(): void {
    // Empty the folder instead of replacing it, so it keeps its place in the panel.
    for (const controller of [...params.controllers]) controller.destroy();
    if (allChosen()) {
      editButton.show(false);
      el.editor.hidden = true;
      el.error.hidden = true;
      el.equation.hidden = false;
      const members = chosen().map((id) => tank.get(id));
      const model = members[0]?.model;
      // Path settings are only shown when every fish in the group is on the same kind of path; moving one moves it for all.
      const shared = model !== undefined && model !== 'custom' && members.every((f) => f.model === model);
      el.equation.textContent = `${chosenGroup()?.name ?? 'No fish'}\nChanges apply to all of them.${shared ? '' : '\nThey are on different kinds of path, so path settings are hidden.'}`;
      if (!shared) return;
      const values = { ...members[0]!.params };
      for (const [key, spec] of Object.entries(paramSpecs(model))) {
        params
          .add(values, key, spec.min, spec.max, spec.step)
          .name(`${spec.symbol}  ${spec.label}`)
          .onChange((value: number) => {
            for (const fish of members) tank.setParam(fish.id, key, value);
          });
      }
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
    if (fish.model === 'free') el.equation.textContent = `${fish.name}\n${describeFree(fish.params)}`;
    else if (fish.model !== 'custom') el.equation.textContent = `${fish.name}\n${MODELS[fish.model].equation(fish.params)}`;
  }

  function select(id: number): void {
    // Groups are numbered by their place in the list, which can change as fish change school, so find it again by name.
    const wanted = id < 0 ? groups[-1 - id]?.name.replace(/ \(\d+\)$/, '') : undefined;
    fishController.options(fishOptions());
    if (wanted !== undefined) id = groupId(Math.max(0, groups.findIndex((g) => g.name.replace(/ \(\d+\)$/, '') === wanted)));
    controls.display.selected = id;
    state.fish = id;
    fishController.updateDisplay();
    // With a group chosen, the controls start from its first fish's settings.
    const fish = id < 0 ? tank.get(chosen()[0] ?? tank.fish[0]!.id) : tank.get(id);
    state.model = fish.model;
    Object.assign(behaviour, { pathStrength: fish.pathStrength, curiosity: fish.curiosity, drift: fish.drift, schools: fish.schools });
    Object.assign(look, { hue: fish.hue, size: Math.round(fish.size * 1000) / 1000 });
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
    buildParams();
  }

  select(first);
  return controls;
}
