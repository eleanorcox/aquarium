# Roadmap

A proposed order of work. It is a proposal: the order depends on answers in [open-questions.md](open-questions.md).

## Where things stand

As of 13 October 2026:

- No exhibition or date. This is a direction to build towards, so the order below is set by what is interesting and what teaches most, not by a deadline.
- Hardware is one laptop with a built-in webcam. No projector, separate camera or depth sensor.
- Build first, buy second. Each piece of hardware is bought only after the software has shown what it needs to do.
- Details are loose on purpose. Where the docs pick something specific, it is a starting point to react to.

## The reasoning

- Strand 3 is the priority, so the plan gets to something you can wave a hand at as early as possible, and does not finish strands 1 and 2 first.
- The cheapest experiments come first. Each stage should end with something to show and a decision about what to do next.
- Nothing needing a server or bought hardware happens until what can be learned without them has been.
- Everything is built test-first. [testing.md](testing.md) lists the first tests for each stage and what has to be judged by eye instead.
- Graphics run alongside from early on, because the project is mainly visual and the art style affects everything a visitor sees.

## Stages

### Stage 1: fish that can be pushed

Fish steer towards their path instead of being placed on it; curious fish approach the mouse and shy ones scatter; drift; flocking.

- **Shows:** the equation aquarium, but the fish react to the mouse and return to their routes.
- **Decides:** whether paths and behaviour really can share one simulation.
- **Includes:** the housekeeping from [architecture.md](architecture.md) that this touches anyway: stable fish ids and removing fish.

### Stage 1b: a tank bigger than the screen

The tank gets its own size; the screen becomes a movable, zoomable window onto it. Then a 500-fish test tank.

- **Shows:** the same tank whole on a laptop and as a scrolling window in a phone-sized browser, and a large school moving together.
- **Decides:** how many fish each kind of device can handle, and so whether the move to WebGL has to come before the graphics work in stage 3.
- **Why this early:** steering, flocking and every input convert between screen and tank positions. Doing this after them means redoing each one.

### Stage 2: hands

The laptop webcam tracks hands and they drive the same behaviour as the mouse.

- **Shows:** Swish Fish on a laptop. The first real immersive demo, with no extra hardware.
- **Decides:** which gestures feel natural, and whether camera lag is acceptable.

### Stage 3: a first look (alongside stages 1 and 2)

One of Eleanor's drawings digitised and swimming, and one generated fish, side by side. Both are real species and bend with the body-wave equation, so this stage is also the first test of natural swimming.

- **Shows:** what the aquarium could look like, and how a real swimming style reads on screen.
- **Decides:** illustrated, generated or a mix; Canvas 2D or WebGL.
- **Before it:** the real-fish motion survey, which is reading and writing only and can happen at any point. Its brief is in [assets.md](assets.md).
- **Needs:** fish pictures, hand-drawn or generated, to the brief in [assets.md](assets.md). Two or three are enough to start.

### Stage 3b: a small real tank

The first six or so species as data, schools for the species that school, and one biome with its switch.

- **Shows:** a tank that looks like a place, with a sardine school, a couple of tuna and a loner.
- **Decides:** how to handle scale, and how many fish can be drawn smoothly.
- **Depends on:** flocking from stage 1 and the look from stage 3. Grows from then on as drawings are added.

### Stage 4: on the wall

In two parts, with a purchase between them.

**4a, no new hardware.** Full-screen display with a separate operator window, tried on a monitor or television in a dark room. Motion detection through the laptop webcam facing the room. Corner correction built and tested on screen.

- **Shows:** the aquarium filling a screen and reacting to someone moving in front of the laptop.
- **Produces:** a short list of what to buy: what the projector must do, and whether a separate webcam is enough or a depth sensor is needed.

**4b, with a projector.** The same software on a real surface, with the camera lined up to the projection.

- **Shows:** the aquarium at room scale, reacting to someone walking past.
- **Decides:** wall, floor or table.

### Stage 5: visitors add fish

Save and load tanks; a phone page for choosing a fish; the real-time service; then colouring on the phone; then paper scanning.

- **Shows:** scan a code, make a fish, watch it swim in.
- **Decides:** whether this becomes a real exhibition piece.
- **Note:** this is the largest stage and the first with a hosted service. Saving a tank by link is the small first step and is useful on its own.

### Any time: side branches

These do not block the stages above and can be picked up when wanted.

- **3D paths.** Independent of everything in strand 3.
- **Describe a motion in words**, and **formations**. Formations are worth doing before stage 5, since they fill a tank well.
- **Phone viewing mode.** Small once tanks can be saved.
- **Discovering new species.** After saved tanks, and once the catalogue has enough species to make finding one mean something.
- **Beyond fish.** Rays, whales, seals. Later, starting with one animal to see what breaks.

## What depends on what

```
fish that can be pushed ──> hands ──> body tracking
          │                              ▲
          └──> flocking        projection┘

tank bigger than the screen ──> phone viewing, projection, schools of hundreds

saved tanks ──> phone viewing
     └──> real-time service ──> QR fish ──> paper-scan fish
                                               ▲
first look ──> fish artwork format ────────────┘

motion survey ──> natural swimming ──┐
first look ──────────────────────────┴──> species catalogue ──> biomes
flocking ──> schools ─────────────────────────┘

3D paths, describe-a-motion: independent
```

## Suggested next step

First the small test setup in [testing.md](testing.md#to-set-up-before-stage-1). Then stage 1, starting with its first test: a fish steering towards its path target stays within a stated distance of the route, on each of the ten built-in paths. That answers the main risk in [architecture.md](architecture.md) in a day or two, before anything else is committed.
