// Control panel. It changes the tank only through Tank methods, never by drawing.
import GUI from 'lil-gui';
import { MODELS, MODEL_NAMES, paramSpecs, type ModelId } from '../core/motion';
import type { Tank } from '../core/tank';
import type { ViewState } from '../render/canvas2d';

export interface Controls {
  view: ViewState;
  paused: boolean;
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

export function createPanel(tank: Tank, el: PanelElements, onAddFish: () => number): Controls {
  const gui = new GUI({ title: 'Equation Aquarium' });
  const state = { fish: 0, model: 'sine' as ModelId };
  const controls: Controls = {
    view: { selected: 0, trails: true },
    paused: false,
    select,
  };

  const fishController = gui.add(state, 'fish', fishOptions()).name('Fish').onChange((id: number) => select(id));
  gui
    .add(state, 'model', MODEL_OPTIONS)
    .name('Motion')
    .onChange((model: ModelId) => {
      tank.setModel(controls.view.selected, model);
      buildParams();
    });
  let params = gui.addFolder('Parameters');

  const actions = {
    addFish: () => select(onAddFish()),
    editAsEquation: () => {
      tank.setModel(controls.view.selected, 'custom');
      select(controls.view.selected);
      el.xInput.focus();
    },
  };
  const editButton = gui.add(actions, 'editAsEquation').name('Edit as equation');
  gui.add(actions, 'addFish').name('Add fish');
  gui.add(controls.view, 'trails').name('Trails');
  gui.add(controls, 'paused').name('Pause');

  el.editor.addEventListener('submit', (e) => {
    e.preventDefault();
    const error = tank.setEquations(controls.view.selected, { x: el.xInput.value, y: el.yInput.value });
    el.error.textContent = error ?? '';
    el.error.hidden = error === null;
    if (error === null) showEquation();
  });

  function fishOptions(): Record<string, number> {
    return Object.fromEntries(tank.fish.map((f) => [f.name, f.id]));
  }

  function buildParams(): void {
    params.destroy();
    params = gui.addFolder('Parameters');
    const fish = tank.get(controls.view.selected);
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
    const fish = tank.get(controls.view.selected);
    if (fish.model !== 'custom') el.equation.textContent = `${fish.name}\n${MODELS[fish.model].equation(fish.params)}`;
  }

  function select(id: number): void {
    controls.view.selected = id;
    state.fish = id;
    state.model = tank.get(id).model;
    fishController.options(fishOptions());
    gui.controllersRecursive().forEach((c) => c.updateDisplay());
    buildParams();
  }

  select(0);
  return controls;
}
