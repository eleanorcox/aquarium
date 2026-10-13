// Control panel. It changes the tank only through Tank methods, never by drawing.
import GUI from 'lil-gui';
import { MODELS, MODEL_NAMES, paramSpecs, type ModelId } from '../core/motion';
import type { Tank } from '../core/tank';
import type { PointerInput, PointerMode } from '../input/pointer';
import { SCENES } from '../scenes/scenes';
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
  trails: boolean;
  onAddFish: () => number;
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
      tank.setModel(controls.display.selected, model);
      buildParams();
    });
  const params = gui.addFolder('Parameters');

  const behaviourFolder = gui.addFolder('Behaviour');
  const setBehaviour = () => tank.setBehaviour(controls.display.selected, behaviour);
  behaviourFolder.add(behaviour, 'pathStrength', 0, 1, 0.01).name('Holds its route').onChange(setBehaviour);
  behaviourFolder.add(behaviour, 'curiosity', -1, 1, 0.01).name('Shy ↔ curious').onChange(setBehaviour);
  behaviourFolder.add(behaviour, 'drift', 0, 1, 0.01).name('Drift').onChange(setBehaviour);
  behaviourFolder.add(behaviour, 'schools').name('Schools').onChange(setBehaviour);

  const actions = {
    addFish: () => select(onAddFish()),
    removeFish: () => {
      // The panel always shows one fish, so the last one stays.
      if (tank.fish.length < 2) return;
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
  gui.add(actions, 'addFish').name('Add fish');
  gui.add(actions, 'removeFish').name('Remove fish');

  const tankFolder = gui.addFolder('Tank');
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
  tankFolder.add(tank.flock, 'separation', 0, 2, 0.05).name('School: keep apart');
  tankFolder.add(tank.flock, 'alignment', 0, 2, 0.05).name('School: swim the same way');
  tankFolder.add(tank.flock, 'cohesion', 0, 2, 0.05).name('School: stay together');
  tankFolder.add(controls, 'follow').name('Follow selected fish');
  tankFolder.add(controls.display, 'trails').name('Trails');
  tankFolder.add(controls, 'paused').name('Pause');

  el.editor.addEventListener('submit', (e) => {
    e.preventDefault();
    const error = tank.setEquations(controls.display.selected, { x: el.xInput.value, y: el.yInput.value });
    el.error.textContent = error ?? '';
    el.error.hidden = error === null;
    if (error === null) showEquation();
  });

  function fishOptions(): Record<string, number> {
    return Object.fromEntries(tank.fish.map((f) => [f.name, f.id]));
  }

  function buildParams(): void {
    // Empty the folder instead of replacing it, so it keeps its place in the panel.
    for (const controller of [...params.controllers]) controller.destroy();
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
    const fish = tank.get(controls.display.selected);
    if (fish.model !== 'custom') el.equation.textContent = `${fish.name}\n${MODELS[fish.model].equation(fish.params)}`;
  }

  function select(id: number): void {
    controls.display.selected = id;
    state.fish = id;
    const fish = tank.get(id);
    state.model = fish.model;
    Object.assign(behaviour, { pathStrength: fish.pathStrength, curiosity: fish.curiosity, drift: fish.drift, schools: fish.schools });
    fishController.options(fishOptions());
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
    buildParams();
  }

  select(first);
  return controls;
}
