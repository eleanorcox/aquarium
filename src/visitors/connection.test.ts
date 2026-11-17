import { describe, expect, it } from 'vitest';
import { VisitorConnection, type SocketLike } from './connection';
import type { VisitorFish } from './visitorFish';

const bubbles: VisitorFish = { version: 1, name: 'Bubbles', outline: 'round', hues: [20, 200], pattern: 'spots', temperament: 0 };

/** Stand-ins for the network, storage and timers, so a connection can be tested without any of them. */
function setUp(options: { remembered?: string } = {}) {
  const kept = new Map<string, string>(options.remembered ? [['equatium.room', options.remembered]] : []);
  const sockets: (SocketLike & { url: string; sent: string[]; open(): void; receive(data: string): void; drop(): void })[] = [];
  const timers: { at: number; run: () => void }[] = [];
  const rooms: string[] = [];
  const arrived: VisitorFish[] = [];
  let now = 0;
  const connection = new VisitorConnection({
    fetch: (async (url: string) => {
      rooms.push(url);
      return new Response(JSON.stringify({ room: `ROOM${rooms.length}A`.slice(0, 6), key: 'secret' }));
    }) as typeof fetch,
    makeSocket: (url) => {
      const socket = {
        url,
        sent: [] as string[],
        onopen: null as (() => void) | null,
        onmessage: null as ((e: { data: unknown }) => void) | null,
        onclose: null as (() => void) | null,
        send(data: string) {
          this.sent.push(data);
        },
        close() {
          this.onclose?.();
        },
        open() {
          this.onopen?.();
        },
        receive(data: string) {
          this.onmessage?.({ data });
        },
        drop() {
          this.onclose?.();
        },
      };
      sockets.push(socket);
      return socket;
    },
    later: (ms, run) => void timers.push({ at: now + ms, run }),
    kept: { getItem: (k) => kept.get(k) ?? null, setItem: (k, v) => void kept.set(k, v) },
    onFish: (fish) => arrived.push(fish),
  });
  const wait = (ms: number) => {
    now += ms;
    for (const timer of timers.filter((t) => t.at <= now)) {
      timers.splice(timers.indexOf(timer), 1);
      timer.run();
    }
  };
  return { connection, sockets, rooms, arrived, kept, wait };
}

describe("the operator's connection to its room", () => {
  it('opens a room on the service and connects to it as the tank, with its key', async () => {
    const { connection, sockets, rooms } = setUp();
    await connection.start('https://service.example');
    expect(rooms).toEqual(['https://service.example/rooms']);
    expect(sockets[0]!.url).toBe('wss://service.example/rooms/ROOM1A/tank?key=secret');
    sockets[0]!.open();
    expect(connection.status).toBe('open');
    expect(connection.room).toBe('ROOM1A');
  });

  it('uses the same room again after the page is reloaded, so a printed QR code keeps working', async () => {
    const remembered = JSON.stringify({ service: 'http://laptop.local:8787', room: 'KEPT22', key: 'k' });
    const { connection, sockets, rooms } = setUp({ remembered });
    await connection.start('http://laptop.local:8787');
    expect(rooms).toEqual([]);
    expect(sockets[0]!.url).toBe('ws://laptop.local:8787/rooms/KEPT22/tank?key=k');
  });

  it('passes on fish that arrive, checking each one again, and ignores anything else', async () => {
    const { connection, sockets, arrived } = setUp();
    await connection.start('https://service.example');
    sockets[0]!.open();
    sockets[0]!.receive(JSON.stringify({ type: 'fish', fish: bubbles }));
    sockets[0]!.receive(JSON.stringify({ type: 'fish', fish: { ...bubbles, outline: 'shark' } }));
    sockets[0]!.receive('pong');
    sockets[0]!.receive('{broken');
    expect(arrived).toEqual([bubbles]);
  });

  it('keeps the connection alive with a ping every half minute', async () => {
    const { connection, sockets, wait } = setUp();
    await connection.start('https://service.example');
    sockets[0]!.open();
    wait(30_000);
    wait(30_000);
    expect(sockets[0]!.sent).toEqual(['ping', 'ping']);
  });

  it('connects again when the connection drops', async () => {
    const { connection, sockets, wait } = setUp();
    await connection.start('https://service.example');
    sockets[0]!.open();
    sockets[0]!.drop();
    expect(connection.status).toBe('reconnecting');
    wait(5000);
    expect(sockets).toHaveLength(2);
    expect(sockets[1]!.url).toBe(sockets[0]!.url);
  });

  it('opens a new room if its old one keeps refusing it', async () => {
    const remembered = JSON.stringify({ service: 'https://service.example', room: 'GONE22', key: 'k' });
    const { connection, sockets, rooms, wait } = setUp({ remembered });
    await connection.start('https://service.example');
    for (let i = 0; i < 3; i++) {
      sockets.at(-1)!.drop();
      wait(10_000);
    }
    await new Promise((settle) => setTimeout(settle, 0));
    expect(rooms).toHaveLength(1);
    expect(sockets.at(-1)!.url).toContain('/rooms/ROOM1A/');
  });

  it('stops for good when switched off, and does not reconnect', async () => {
    const { connection, sockets, wait } = setUp();
    await connection.start('https://service.example');
    sockets[0]!.open();
    connection.stop();
    wait(60_000);
    expect(sockets).toHaveLength(1);
    expect(connection.status).toBe('off');
  });

  it('says so when the service cannot be reached', async () => {
    const { connection } = setUp();
    const failing = new VisitorConnection({
      fetch: (async () => {
        throw new TypeError('offline');
      }) as typeof fetch,
      makeSocket: () => {
        throw new Error('not reached');
      },
      later: () => {},
      kept: { getItem: () => null, setItem: () => {} },
      onFish: () => {},
    });
    await failing.start('https://service.example');
    expect(failing.status).toBe('failed');
    expect(connection.status).toBe('off');
  });
});
