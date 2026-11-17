# Roadmap

A proposed order of work. It is a proposal: the order depends on answers in [open-questions.md](open-questions.md).

## Where things stand

As of 27 October 2026:

| Stage | Status |
| --- | --- |
| 1, fish that can be pushed | Done; recorded as v2 |
| 1b, a tank bigger than the screen | Done; not yet judged by eye |
| 2, hands | Done; feedback added after a first try showed nothing; needs trying again |
| 3, a first look | Visual modes and natural swimming done; real drawings still to come |
| 3b, a small real tank | Done, with coloured generic bodies until there are pictures |
| 4a, on the wall without new hardware | Software done: display window, corner correction, movement through the webcam. Still to do: trying it in a dark room and writing the list of what to buy |
| 4b, with a projector | Needs a projector |
| 5, visitors add fish | Sharing a tank as a link is done; the rest needs a hosted service |

Side branches: formations, phone layout, the field-of-fish scene and free swimming are done. 3D, describing a motion in words (which needs an AI service and a key), and discovering species (which needs decisions on what triggers a discovery) are not started.

Other facts that shape the order:

- No exhibition or date. The order is set by what is interesting and what teaches most.
- Hardware is one laptop with a built-in webcam. Build first, buy second.
- Details are loose on purpose. Where the docs pick something specific, it is a starting point to react to.

## The reasoning

- Strand 3 is the priority, so the plan gets to something you can wave a hand at as early as possible, and does not finish strands 1 and 2 first.
- The cheapest experiments come first. Each stage should end with something to show and a decision about what to do next.
- Nothing needing a server or bought hardware happens until what can be learned without them has been.
- Everything is built test-first. [testing.md](testing.md) lists the first tests for each stage and what has to be judged by eye instead.
- Graphics run alongside from early on, because the project is mainly visual and the art style affects everything a visitor sees.

## Stages

### Stage 1: fish that can be pushed

*Status, 13 October 2026: built, tested and merged. Eleanor tried it and said it feels good, so the strengths of the forces stay as first set. Recorded as v2.*

Fish steer towards their path instead of being placed on it; curious fish approach the mouse and shy ones scatter; drift; flocking.

- **Shows:** the equation aquarium, but the fish react to the mouse and return to their routes.
- **Decides:** whether paths and behaviour really can share one simulation.
- **Includes:** the housekeeping from [architecture.md](architecture.md) that this touches anyway: stable fish ids and removing fish.

### Stage 1b: a tank bigger than the screen

*Status, 27 October 2026: built, tested and merged. Not yet judged by eye. The simulation handles 500 fish comfortably; drawing speed still needs reading off a real screen.*

The tank gets its own size; the screen becomes a movable, zoomable window onto it. Then a 500-fish test tank.

- **Shows:** the same tank whole on a laptop and as a scrolling window in a phone-sized browser, and a large school moving together.
- **Decides:** how many fish each kind of device can handle, and so whether the move to WebGL has to come before the graphics work in stage 3.
- **Why this early:** steering, flocking and every input convert between screen and tank positions. Doing this after them means redoing each one.

### Stage 2: hands

*Status, 27 October 2026: built and merged; off until switched on in the panel. The step from tracking points to influences is tested with made-up hands; the camera and the feel of the gestures need trying by Eleanor.*

The laptop webcam tracks hands and they drive the same behaviour as the mouse.

- **Shows:** Swish Fish on a laptop. The first real immersive demo, with no extra hardware.
- **Decides:** which gestures feel natural, and whether camera lag is acceptable.

### Stage 3: a first look (alongside stages 1 and 2)

*Status, 27 October 2026: begun early. Visual modes exist (Classic, Natural, Paper), and Natural bends fish with the body-wave equation. Still to come: real drawings, and the research survey's corrections to the swimming values.*

One of Eleanor's drawings digitised and swimming, and one generated fish, side by side. Both are real species and bend with the body-wave equation, so this stage is also the first test of natural swimming.

- **Shows:** what the aquarium could look like, and how a real swimming style reads on screen.
- **Decides:** illustrated, generated or a mix; Canvas 2D or WebGL.
- **Before it:** the real-fish motion survey, which is reading and writing only and can happen at any point. Its brief is in [assets.md](assets.md).
- **Needs:** fish pictures, hand-drawn or generated, to the brief in [assets.md](assets.md). Two or three are enough to start.

### Stage 3b: a small real tank

*Status, 27 October 2026: built. Six species from FishBase, biomes, real and made-up tanks, and Pacific and British river scenes. Species are drawn as coloured generic bodies until pictures exist.*

The first six or so species as data, schools for the species that school, and one biome with its switch.

- **Shows:** a tank that looks like a place, with a sardine school, a couple of tuna and a loner.
- **Decides:** how to handle scale, and how many fish can be drawn smoothly.
- **Depends on:** flocking from stage 1 and the look from stage 3. Grows from then on as drawings are added.

### Stage 4: on the wall

In two parts, with a purchase between them.

*Status, 27 October 2026: all of 4a's software is built: corner correction, the separate display window, and movement through the webcam. Still to do: trying it in a dark room, and writing the list of what to buy.*

**4a, no new hardware.** Full-screen display with a separate operator window, tried on a monitor or television in a dark room. Motion detection through the laptop webcam facing the room. Corner correction built and tested on screen.

- **Shows:** the aquarium filling a screen and reacting to someone moving in front of the laptop.
- **Produces:** a short list of what to buy: what the projector must do, and whether a separate webcam is enough or a depth sensor is needed.

**4b, with a projector.** The same software on a real surface, with the camera lined up to the projection.

- **Shows:** the aquarium at room scale, reacting to someone walking past.
- **Decides:** wall, floor or table.

### Stage 5: visitors add fish

*Status, 27 October 2026: saving a tank to a link is built (entry 28 in the decision log). The rest needs a hosted service.*

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
- **Free swimming.** Fish with no route. Most useful before the projection stage.
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

1. Eleanor tries what was built on 27 October: hands with the new feedback, the display window, movement, the real-fish scenes and the field of fish, and reads the draw time on `?scene=shoal`.
2. A dark-room trial of the display window on a monitor or television, ending in the list of what to buy.
3. Fish pictures, to the brief in [assets.md](assets.md), so real species stop being generic bodies.
