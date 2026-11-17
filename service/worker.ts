// The visitor service on Cloudflare: one Durable Object per room, holding the tank's live connection.
// Its rules are in room.ts; this file only connects them to the network.
import { DurableObject } from 'cloudflare:workers';
import { SendLimit, admitFish, isRoomCode, newRoomCode, MAX_BODY_LENGTH } from './room';

interface Env {
  ROOMS: DurableObjectNamespace<Room>;
}

// Phones send from the aquarium's own address, which differs from this service's, so browsers need telling it is allowed.
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS } });

/** A random text of `bytes` bytes written in hex, from the browser-standard secure random numbers. */
const secret = (bytes: number) => [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
const random = () => crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;

export class Room extends DurableObject<Env> {
  // Kept in memory only: if the room sleeps, it starts counting again, which is harmless.
  private limit = new SendLimit();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // The tank pings to keep its connection from being dropped as idle; Cloudflare answers without waking the room.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/init') {
      // A room is set up once, with the key only its tank knows; a code already in use is refused.
      if (await this.ctx.storage.get('key')) return new Response('taken', { status: 409 });
      await this.ctx.storage.put('key', await request.text());
      return new Response('ok');
    }
    if (url.pathname === '/tank') {
      if (request.headers.get('upgrade') !== 'websocket') return new Response('expected a live connection', { status: 426 });
      const key = await this.ctx.storage.get<string>('key');
      if (!key || url.searchParams.get('key') !== key) return new Response('not this tank', { status: 403 });
      // Only one tank at a time: a reopened operator window replaces the old connection.
      for (const old of this.ctx.getWebSockets()) old.close(1000, 'replaced');
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server!);
      return new Response(null, { status: 101, webSocket: client });
    }
    if (url.pathname === '/fish' && request.method === 'POST') {
      const declared = Number(request.headers.get('content-length') ?? 0);
      if (declared > MAX_BODY_LENGTH) return json({ error: 'That fish is too big to send.' }, 413);
      const raw = await request.text();
      const tanks = this.ctx.getWebSockets();
      const sender = request.headers.get('cf-connecting-ip') ?? 'unknown';
      const admitted = admitFish(raw, tanks.length > 0, this.limit, sender, Date.now());
      if (admitted.deliver) for (const tank of tanks) tank.send(JSON.stringify(admitted.deliver));
      return json(admitted.body, admitted.status);
    }
    return new Response('not found', { status: 404 });
  }

  // The tank sends nothing else that needs an answer.
  webSocketMessage(): void {}

  webSocketClose(ws: WebSocket, code: number): void {
    ws.close(code, 'closing');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);

    // POST /rooms: a tank opens a room. It gets a code for its QR code and a key to prove it is the tank.
    if (parts.length === 1 && parts[0] === 'rooms' && request.method === 'POST') {
      for (let attempt = 0; attempt < 5; attempt++) {
        const room = newRoomCode(random);
        const key = secret(24);
        const stub = env.ROOMS.get(env.ROOMS.idFromName(room));
        const made = await stub.fetch('https://room/init', { method: 'POST', body: key });
        if (made.ok) return json({ room, key });
      }
      return json({ error: 'Could not open a room. Try again.' }, 503);
    }

    // /rooms/CODE/fish from phones, /rooms/CODE/tank for the tank's live connection.
    if (parts.length === 3 && parts[0] === 'rooms' && isRoomCode(parts[1]!) && (parts[2] === 'fish' || parts[2] === 'tank')) {
      const stub = env.ROOMS.get(env.ROOMS.idFromName(parts[1]!));
      const response = await stub.fetch(new Request(`https://room/${parts[2]}${url.search}`, request));
      if (response.status === 101) return response;
      // Copy the room's answer so the browser-permission headers can be added to it.
      const answer = new Response(response.body, response);
      for (const [name, value] of Object.entries(CORS)) answer.headers.set(name, value);
      return answer;
    }
    return json({ error: 'Not found.' }, 404);
  },
};
