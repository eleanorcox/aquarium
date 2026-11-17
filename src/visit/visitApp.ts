// The phone page: wires the choices, the colouring sheet, the preview and Send to the page.
// The decisions (what makes a fish, when Send is allowed, what the service said) live in the files beside this.
import { PICTURE, inkOutline } from '../visitors/outlines';
import { MAX_NAME_LENGTH, OUTLINES, type Outline } from '../visitors/visitorFish';
import { StrokeBook, type Stroke } from './colouring';
import { HUES, drawColouring, drawFish, drawSwimming, paint } from './drawing';
import { canSend, newChoices, toFish, type Choices } from './fishState';
import { sendFish, type SendResult } from './send';
import { serviceAddress } from './service';

const OUTLINE_LABELS: Record<Outline, string> = { slim: 'Slim', round: 'Round', tall: 'Tall' };
const BRUSHES = [
  { label: 'Thin', size: 5 },
  { label: 'Medium', size: 11 },
  { label: 'Thick', size: 22 },
];

const swatches = (name: string) => HUES.map((hue) => `<button type="button" class="swatch" data-${name}="${hue}" style="background:${paint(hue)}" aria-label="Colour ${hue}"></button>`).join('');

const TEMPLATE = `
  <h1>Make a fish</h1>
  <canvas id="preview" class="preview" aria-label="Your fish, swimming"></canvas>

  <section>
    <h2>Kind of fish</h2>
    <div class="kinds">
      ${OUTLINES.map((o) => `<button type="button" class="kind" data-outline="${o}"><canvas width="240" height="90"></canvas><span>${OUTLINE_LABELS[o]}</span></button>`).join('')}
    </div>
  </section>

  <section>
    <div class="tabs" role="tablist">
      <button type="button" role="tab" data-mode="choose">Choose colours</button>
      <button type="button" role="tab" data-mode="colour">Colour it in</button>
    </div>

    <div id="choose" class="panel">
      <h3>Main colour</h3>
      <div class="swatches" id="main">${swatches('main')}</div>
      <h3>Second colour</h3>
      <div class="swatches" id="second">${swatches('second')}</div>
      <h3>Pattern</h3>
      <div class="segments" id="patterns">
        <button type="button" data-pattern="plain">Plain</button>
        <button type="button" data-pattern="stripes">Stripes</button>
        <button type="button" data-pattern="spots">Spots</button>
      </div>
    </div>

    <div id="colour" class="panel">
      <canvas id="sheet" class="sheet" aria-label="Colour in your fish with a finger"></canvas>
      <div class="swatches" id="paints">${swatches('paint')}</div>
      <div class="segments" id="brushes">${BRUSHES.map((b) => `<button type="button" data-brush="${b.size}">${b.label}</button>`).join('')}</div>
      <div class="segments">
        <button type="button" id="undo">Undo</button>
        <button type="button" id="clear">Clear</button>
      </div>
    </div>
  </section>

  <section>
    <h2>Shy or curious?</h2>
    <input id="temperament" type="range" min="-1" max="1" step="0.1" value="0" aria-label="Shy or curious" />
    <div class="ends"><span>Shy: swims away from you</span><span>Curious: comes to look</span></div>
  </section>

  <section>
    <h2>Name</h2>
    <input id="name" type="text" maxlength="${MAX_NAME_LENGTH}" required autocomplete="off" autocapitalize="words" enterkeyhint="done" placeholder="Name your fish" />
  </section>

  <div class="send-bar"><button type="button" id="send" class="send" disabled>Send</button></div>
  <div id="result" class="result" hidden></div>
`;

/** Builds the page inside `root` for a visitor to the tank `room`. */
export function startVisitApp(root: HTMLElement, room: string): void {
  root.innerHTML = TEMPLATE;
  const $ = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const all = <T extends HTMLElement>(selector: string) => [...root.querySelectorAll<T>(selector)];

  let choices: Choices = newChoices();
  const book = new StrokeBook();
  let brush = BRUSHES[1]!.size;
  let paintHue = HUES[0]!;
  const set = (change: Partial<Choices>) => {
    choices = { ...choices, ...change };
    refresh();
  };

  // The picture the preview bends; redrawn when the choices change, not every frame.
  const art = document.createElement('canvas');
  art.width = PICTURE.width;
  art.height = PICTURE.height;
  const artCtx = art.getContext('2d')!;

  const preview = $<HTMLCanvasElement>('#preview');
  const sheet = $<HTMLCanvasElement>('#sheet');
  const sheetScale = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
  sheet.width = PICTURE.width * sheetScale;
  sheet.height = PICTURE.height * sheetScale;
  const sheetCtx = sheet.getContext('2d')!;
  const dpr = window.devicePixelRatio || 1;

  for (const canvas of all<HTMLCanvasElement>('.kind canvas')) {
    const outline = (canvas.parentElement as HTMLElement).dataset.outline as Outline;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#eef5f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Drawn as on the colouring sheet, centred, with a little room at the sides for the tail fin.
    const width = canvas.width * 0.94;
    ctx.save();
    // The outline's middle line sits a quarter of a picture width down.
    ctx.translate(canvas.width * 0.03, canvas.height / 2 - width * 0.25);
    inkOutline(ctx, outline, width);
    ctx.restore();
  }

  function refresh(): void {
    for (const b of all('[data-outline]')) b.setAttribute('aria-pressed', String(b.dataset.outline === choices.outline));
    for (const b of all('[data-mode]')) b.setAttribute('aria-selected', String(b.dataset.mode === choices.mode));
    $('#choose').hidden = choices.mode !== 'choose';
    $('#colour').hidden = choices.mode !== 'colour';
    for (const b of all('[data-main]')) b.setAttribute('aria-pressed', String(Number(b.dataset.main) === choices.hues[0]));
    for (const b of all('[data-second]')) b.setAttribute('aria-pressed', String(Number(b.dataset.second) === choices.hues[1]));
    for (const b of all('[data-pattern]')) b.setAttribute('aria-pressed', String(b.dataset.pattern === choices.pattern));
    for (const b of all('[data-paint]')) b.setAttribute('aria-pressed', String(Number(b.dataset.paint) === paintHue));
    for (const b of all('[data-brush]')) b.setAttribute('aria-pressed', String(Number(b.dataset.brush) === brush));
    $<HTMLButtonElement>('#undo').disabled = choices.strokes.length === 0;
    $<HTMLButtonElement>('#clear').disabled = choices.strokes.length === 0;
    $<HTMLButtonElement>('#send').disabled = !canSend(choices);
    drawColouring(sheetCtx, choices.outline, choices.strokes, sheetScale);
    drawFish(artCtx, choices);
  }

  // Choices.
  for (const b of all('[data-outline]')) b.addEventListener('click', () => set({ outline: b.dataset.outline as Outline }));
  for (const b of all('[data-mode]')) b.addEventListener('click', () => set({ mode: b.dataset.mode as Choices['mode'] }));
  for (const b of all('[data-main]')) b.addEventListener('click', () => set({ hues: [Number(b.dataset.main), choices.hues[1]] }));
  for (const b of all('[data-second]')) b.addEventListener('click', () => set({ hues: [choices.hues[0], Number(b.dataset.second)] }));
  for (const b of all('[data-pattern]')) b.addEventListener('click', () => set({ pattern: b.dataset.pattern as Choices['pattern'] }));
  for (const b of all('[data-paint]')) b.addEventListener('click', () => ((paintHue = Number(b.dataset.paint)), refresh()));
  for (const b of all('[data-brush]')) b.addEventListener('click', () => ((brush = Number(b.dataset.brush)), refresh()));
  $('#undo').addEventListener('click', () => (book.undo(), set({ strokes: book.strokes })));
  $('#clear').addEventListener('click', () => (book.clear(), set({ strokes: book.strokes })));
  $<HTMLInputElement>('#temperament').addEventListener('input', (e) => set({ temperament: Number((e.target as HTMLInputElement).value) }));
  $<HTMLInputElement>('#name').addEventListener('input', (e) => set({ name: (e.target as HTMLInputElement).value }));

  // Colouring in: a finger drags a stroke, shown as it is made and kept when the finger lifts.
  let current: Stroke | undefined;
  const at = (e: PointerEvent) => {
    const box = sheet.getBoundingClientRect();
    return { x: ((e.clientX - box.left) / box.width) * PICTURE.width, y: ((e.clientY - box.top) / box.height) * PICTURE.height };
  };
  sheet.addEventListener('pointerdown', (e) => {
    sheet.setPointerCapture(e.pointerId);
    current = { hue: paintHue, size: brush, points: [at(e)] };
    set({ strokes: [...book.strokes, current] });
  });
  sheet.addEventListener('pointermove', (e) => {
    if (!current) return;
    current.points.push(at(e));
    set({ strokes: [...book.strokes, current] });
  });
  const lift = () => {
    if (!current) return;
    book.add(current);
    current = undefined;
    set({ strokes: book.strokes });
  };
  sheet.addEventListener('pointerup', lift);
  sheet.addEventListener('pointercancel', lift);

  // The preview: the picture bent by the body wave, in place.
  let phase = 0;
  let last = performance.now();
  const swim = (now: number) => {
    if (!root.contains(preview)) return;
    phase += ((now - last) / 1000) * 2 * Math.PI * 1.4;
    last = now;
    const width = preview.clientWidth;
    const height = preview.clientHeight;
    if (preview.width !== Math.round(width * dpr)) {
      preview.width = Math.round(width * dpr);
      preview.height = Math.round(height * dpr);
    }
    const ctx = preview.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSwimming(ctx, art, width, height, phase);
    requestAnimationFrame(swim);
  };
  requestAnimationFrame(swim);

  // Sending.
  const result = $('#result');
  const show = (html: string, actions: [label: string, run: () => void][], name?: string) => {
    result.innerHTML = `${html}<div class="actions"></div>`;
    // The name is the visitor's own text, so it goes in as text and never as markup.
    for (const slot of result.querySelectorAll('[data-name]')) slot.textContent = name ?? '';
    const holder = result.querySelector('.actions')!;
    for (const [label, run] of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', run);
      holder.append(button);
    }
    result.hidden = false;
  };
  const again = () => startVisitApp(root, room);
  const back = () => (result.hidden = true);

  const finish = (outcome: SendResult, name: string, retry: () => void) => {
    if (outcome.status === 'swimming') show('<h2>Look at the tank!</h2><p><b data-name></b> is swimming in.</p>', [['Make another fish', again]], name);
    else if (outcome.status === 'waiting') show('<h2>Nearly there</h2><p><b data-name></b> is waiting to be let in. It will appear in the tank soon.</p>', [['Make another fish', again]], name);
    else if (outcome.status === 'refused') {
      show('<h2>The tank said no</h2><p data-name></p>', [['Go back and fix it', back]], outcome.reason);
    } else show("<h2>No luck</h2><p>Couldn't reach the tank. Check your connection and try again.</p>", [['Try again', retry], ['Go back', back]]);
  };

  const send = async () => {
    if (!canSend(choices)) return;
    const button = $<HTMLButtonElement>('#send');
    button.disabled = true;
    button.textContent = 'Sending…';
    // The picture sent is always exactly picture size, whatever the sheet's resolution on this phone.
    const picture = choices.mode === 'colour' ? art.toDataURL('image/png') : undefined;
    const fish = toFish(choices, picture);
    const attempt = async () => {
      const outcome = await sendFish(serviceAddress(), room, fish);
      button.textContent = 'Send';
      button.disabled = !canSend(choices);
      finish(outcome, fish.name, () => (show('<p>Sending…</p>', []), void attempt()));
    };
    await attempt();
  };
  $('#send').addEventListener('click', () => void send());

  refresh();
}
