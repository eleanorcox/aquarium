# Visitors add fish (stage 5)

The plan for the stage where a visitor scans a QR code on the tank, makes a fish on their phone and watches it swim in. Decisions behind it are 37 and 38 in the [decision log](decisions.md).

## What a visitor does

1. Scans the QR code shown in a corner of the tank. It opens the phone page for that tank.
2. Picks a kind of fish: one of a few outlines, different in shape (for example long and slim, round, tall with long fins).
3. Either chooses quickly, two colours and a pattern (plain, stripes or spots), or colours the outline in with a finger, like a colouring sheet. Then how shy or curious it is, and a name.
4. Presses Send. A fish made from choices swims into the tank within a second or two. A coloured-in one waits until the operator approves it, and the phone says so.

No account, nothing to install, and nothing kept about the visitor.

## What the operator does

- Starts taking visitors in the panel. That opens a room for this tank on the service and shows the QR code.
- Approves or turns away drawn fish, each shown as a small picture in a queue.
- Removes any visitor fish, or clears them all. Visitor fish stay until cleared.

## How it fits together

```
phone page ──POST fish──> service (one "room" per tank) ──live connection──> operator window ──> tank
                                       <──approvals──
```

- **Phone page.** Part of the same site, opened as `?visit=ROOM`. The same choice as `?display`: one site, three windows.
- **Service.** A Cloudflare Worker with one Durable Object per room. A Durable Object is a small program Cloudflare keeps running for one thing, here one tank, which holds the tank's live connection (a WebSocket: a connection that stays open so either end can send at any time). Its rules (checking fish, limiting how often one phone can send, holding drawn fish until approved) are plain code tested without Cloudflare, like the simulation core.
- **Operator window.** Holds the live connection, adds fish as they arrive, and sends approvals back.
- **A visitor fish in the tank** swims freely (decision 35), with its own outline, colours, pattern, temperament and name. Coloured-in fish are pictures, kept outside the simulation; the tank only knows a picture's id.

## Built in pieces, each working on its own

Pieces 1 to 6 are built (17 November 2026) and tried end to end on the laptop: a phone page sending fish from choices and coloured in, the queue, letting in, and the QR code decoding to the right address. Piece 7 waits for a Cloudflare account.

1. **The visitor fish format.** What a phone sends, checked strictly, since anyone can send anything. Shared by phone, service and tank.
2. **Visitor fish in the tank.** Adding one, a Visitors' fish group in the Fish list, and Clear visitors' fish.
3. **Fish outlines and colouring.** A few outlines; two colours, stripes and spots on them; and a coloured-in outline as a picture that bends as the fish swims, in all three visual modes. The outlines are the same idea as the paper colouring sheet, so they are drawn to serve both.
4. **The phone page.** Choosing an outline, quick choices or colouring in, a live preview of the fish swimming, Send.
5. **The service, on the laptop.** Rooms, the live connection, approvals, and limits on sending.
6. **The operator side.** Starting a room, the QR code on the tank and the display window, and the approval queue.
7. **Going live.** Needs a Cloudflare account (free). Until then everything runs on the laptop, and a phone on the same wifi can reach it.

## Not in this stage

- Paper colouring sheets scanned by a camera. They will use the same route into the tank.
- Visitors following or nudging their fish afterwards.
- Saving coloured-in fish in shared tank links: pictures are too big for a link.

## What the service can rely on

Checked against Cloudflare's documentation on 17 November 2026:

- Durable Objects are on the free plan if they use Cloudflare's SQLite storage. The free plan allows 100,000 Durable Object requests and 100,000 Worker requests a day, which is far beyond one event. [Pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/), [Worker limits](https://developers.cloudflare.com/workers/platform/limits/)
- A room whose tank is connected but quiet can hibernate, and is not charged while it does. [WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- `wrangler dev` runs Durable Objects on the laptop. [Development](https://developers.cloudflare.com/workers/development-testing/)
- A Worker on our own subdomain would need the whole domain moved to Cloudflare, which is not wanted. Cloudflare Pages can serve a subdomain with only a CNAME record, as GitHub Pages does. So the service lives at its Cloudflare address and the site calls it there. [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/), [Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
- Limiting how often a phone can send is done inside the room, which is exact; Cloudflare's own rate-limiting feature is approximate. [Rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
