// The operator's side of visitors adding fish: the room's connection, fish arriving in the tank, the queue
// of coloured-in fish waiting to be let in, and the address for the QR code.
import type { Tank } from '../core/tank';
import { PICTURES } from '../render/pictures';
import { serviceAddress } from '../visit/service';
import { addVisitorFish, clearVisitorFish } from '../visitors/arrive';
import { VisitorConnection, type SocketLike } from '../visitors/connection';
import { qrPattern, visitAddress } from '../visitors/invite';
import type { VisitorFish } from '../visitors/visitorFish';
import { WaitingFish } from '../visitors/waiting';

export interface VisitorDesk {
  /** For the panel: whether a room is open, how it is going, and the operator's choices. */
  state: { on: boolean; status: string; showCode: boolean; askFirst: boolean };
  setOn(on: boolean): void;
  clear(): void;
  /** The phone page's address and its QR code while visitors are being taken and the code is wanted, or null. */
  invite(): { address: string; pattern: boolean[][] } | null;
  /** Call once a frame: brings the status line up to date. */
  update(): void;
}

const KEPT_ON = 'equatium.visitors';

const STATUS = { off: 'Off', opening: 'Opening a room…', reconnecting: 'Connection lost, trying again…', failed: "Can't reach the visitor service" } as const;

/**
 * Sets up the desk. It starts taking fish at once if `start` is set, or if it was taking them when the page was
 * last left, so a reloaded exhibition page carries on.
 */
export function setUpVisitorDesk(tank: Tank, kept: Pick<Storage, 'getItem' | 'setItem'>, onArrived: () => void, start = false): VisitorDesk {
  const state = { on: false, status: 'Off', showCode: true, askFirst: true };
  const waiting = new WaitingFish();
  let pictures = 0;
  let invited: { address: string; pattern: boolean[][] } | null = null;

  const letIn = (fish: VisitorFish) => {
    // Pictures are kept outside the tank under an id of their own; the tank only knows the id.
    const pictureId = fish.picture === undefined ? undefined : `visitor-${Date.now()}-${pictures++}`;
    if (pictureId !== undefined) PICTURES.add(pictureId, fish.picture!);
    addVisitorFish(tank, fish, pictureId);
    onArrived();
  };

  const connection = new VisitorConnection({
    fetch: (...args) => fetch(...args),
    makeSocket: (url) => new WebSocket(url) as unknown as SocketLike,
    later: (ms, run) => void setTimeout(run, ms),
    kept,
    onFish: (fish) => {
      if (fish.pattern === 'coloured' && state.askFirst) {
        waiting.add(fish);
        showWaiting();
      } else letIn(fish);
    },
  });

  // The queue of coloured-in fish, as small pictures with their names, in the corner of the operator's screen.
  const queue = document.createElement('aside');
  queue.id = 'waiting';
  queue.hidden = true;
  document.body.append(queue);
  function showWaiting(): void {
    const list = waiting.list();
    queue.hidden = list.length === 0;
    queue.replaceChildren();
    if (list.length === 0) return;
    const title = document.createElement('p');
    title.className = 'waiting-title';
    title.textContent = `${list.length} coloured-in fish waiting`;
    queue.append(title);
    for (const { id, fish } of list) {
      const item = document.createElement('div');
      item.className = 'waiting-fish';
      const picture = document.createElement('img');
      // Only PNG data addresses pass the fish check, so this cannot load anything from elsewhere.
      picture.src = fish.picture ?? '';
      picture.alt = '';
      const name = document.createElement('span');
      // A visitor's own text: shown as text, never as markup.
      name.textContent = fish.name;
      const yes = document.createElement('button');
      yes.textContent = 'Let in';
      yes.addEventListener('click', () => {
        const fish = waiting.letIn(id);
        if (fish) letIn(fish);
        showWaiting();
      });
      const no = document.createElement('button');
      no.textContent = 'Turn away';
      no.addEventListener('click', () => {
        waiting.turnAway(id);
        showWaiting();
      });
      const actions = document.createElement('div');
      actions.className = 'waiting-actions';
      actions.append(yes, no);
      item.append(picture, name, actions);
      queue.append(item);
    }
  }

  const setOn = (on: boolean) => {
    state.on = on;
    try {
      kept.setItem(KEPT_ON, on ? 'on' : 'off');
    } catch {
      // Not remembered; a reloaded page starts with visitors off.
    }
    if (on) void connection.start(serviceAddress());
    else connection.stop();
  };
  let wasOn = false;
  try {
    wasOn = kept.getItem(KEPT_ON) === 'on';
  } catch {
    // Storage refused: start off.
  }
  if (start || wasOn) setOn(true);

  return {
    state,
    setOn,
    clear() {
      for (const fish of tank.fish) if (fish.picture !== undefined) PICTURES.remove(fish.picture);
      clearVisitorFish(tank);
      onArrived();
    },
    invite() {
      const room = connection.status === 'open' || connection.status === 'reconnecting' ? connection.room : undefined;
      if (!state.on || !state.showCode || room === undefined) return null;
      const address = visitAddress(location.href, room);
      if (invited?.address !== address) invited = { address, pattern: qrPattern(address) };
      return invited;
    },
    update() {
      const status = connection.status;
      state.status = status === 'open' ? `${connection.room}: open${waiting.list().length ? `, ${waiting.list().length} waiting` : ''}` : STATUS[status];
      if (status === 'failed' || status === 'off') state.on = false;
    },
  };
}
