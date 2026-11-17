// The operator window's live connection to its room on the visitor service: opening the room, staying
// connected, and passing on each fish that arrives. Network, storage and timers are passed in, so it can be tested.
import { parseVisitorFish, type VisitorFish } from './visitorFish';

/** The little of a WebSocket this needs: a connection that stays open so either end can send at any time. */
export interface SocketLike {
  onopen: (() => void) | null;
  onmessage: ((e: { data: unknown }) => void) | null;
  onclose: (() => void) | null;
  send(data: string): void;
  close(): void;
}

export interface RoomDetails {
  service: string;
  room: string;
  key: string;
}

export type ConnectionStatus = 'off' | 'opening' | 'open' | 'reconnecting' | 'failed';

const KEPT_ROOM = 'equatium.room';
const PING_EVERY_MS = 30_000;
const RETRY_AFTER_MS = 5000;
/** A room that refuses this many tries in a row has probably gone, so a new one is opened. */
const TRIES_BEFORE_NEW_ROOM = 3;

export class VisitorConnection {
  status: ConnectionStatus = 'off';
  details: RoomDetails | null = null;
  private socket: SocketLike | null = null;
  /** Counts connections, so timers and events from an old one are ignored. */
  private generation = 0;
  private failures = 0;

  constructor(
    private deps: {
      fetch: typeof fetch;
      makeSocket: (url: string) => SocketLike;
      later: (ms: number, run: () => void) => void;
      kept: Pick<Storage, 'getItem' | 'setItem'>;
      onFish: (fish: VisitorFish) => void;
    },
  ) {}

  get room(): string | undefined {
    return this.details?.room;
  }

  /**
   * Connects to this tank's room on the service, opening one if this browser has not got one there already,
   * or if `fresh` because the old one has gone.
   */
  async start(service: string, fresh = false): Promise<void> {
    this.status = 'opening';
    const generation = ++this.generation;
    this.details = (fresh ? null : this.remembered(service)) ?? (await this.openRoom(service));
    if (generation !== this.generation) return;
    if (!this.details) {
      this.status = 'failed';
      return;
    }
    this.connect();
  }

  stop(): void {
    this.generation++;
    this.status = 'off';
    this.socket?.close();
    this.socket = null;
  }

  private connect(): void {
    const { service, room, key } = this.details!;
    const generation = ++this.generation;
    let opened = false;
    const socket = this.deps.makeSocket(`${service.replace(/^http/, 'ws')}/rooms/${room}/tank?key=${encodeURIComponent(key)}`);
    this.socket = socket;
    socket.onopen = () => {
      if (generation !== this.generation) return;
      opened = true;
      this.failures = 0;
      this.status = 'open';
      this.ping(generation);
    };
    socket.onmessage = (e) => {
      if (generation !== this.generation || typeof e.data !== 'string') return;
      try {
        const message: unknown = JSON.parse(e.data);
        if (typeof message !== 'object' || message === null || (message as { type?: unknown }).type !== 'fish') return;
        // The service checked it, but the tank checks again: it trusts nothing that came over the network.
        const fish = parseVisitorFish((message as { fish?: unknown }).fish);
        if (typeof fish !== 'string') this.deps.onFish(fish);
      } catch {
        // Not a message this version knows; ignored.
      }
    };
    socket.onclose = () => {
      if (generation !== this.generation) return;
      this.status = 'reconnecting';
      if (!opened) this.failures++;
      if (this.failures >= TRIES_BEFORE_NEW_ROOM) {
        this.failures = 0;
        this.details = null;
        void this.start(service, true);
        return;
      }
      this.deps.later(RETRY_AFTER_MS, () => {
        if (generation === this.generation) this.connect();
      });
    };
  }

  private ping(generation: number): void {
    this.deps.later(PING_EVERY_MS, () => {
      if (generation !== this.generation) return;
      this.socket?.send('ping');
      this.ping(generation);
    });
  }

  private async openRoom(service: string): Promise<RoomDetails | null> {
    try {
      const response = await this.deps.fetch(`${service}/rooms`, { method: 'POST' });
      const { room, key } = (await response.json()) as { room?: unknown; key?: unknown };
      if (!response.ok || typeof room !== 'string' || typeof key !== 'string') return null;
      const details = { service, room, key };
      try {
        this.deps.kept.setItem(KEPT_ROOM, JSON.stringify(details));
      } catch {
        // Not remembered; a reloaded page opens a new room.
      }
      return details;
    } catch {
      return null;
    }
  }

  /** The room this browser opened on this service before, if any. */
  private remembered(service: string): RoomDetails | null {
    try {
      const details = JSON.parse(this.deps.kept.getItem(KEPT_ROOM) ?? 'null') as Partial<RoomDetails> | null;
      if (details?.service === service && typeof details.room === 'string' && typeof details.key === 'string') return details as RoomDetails;
    } catch {
      // Damaged or refused storage: a new room is opened.
    }
    return null;
  }
}
