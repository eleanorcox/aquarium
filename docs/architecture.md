# Architecture

What the ideas in [ideas.md](ideas.md) mean for the code. Nothing here is built yet; it is the set of changes to plan around.

## What we have

About 1,000 lines of TypeScript, built with Vite, tested with Vitest.

- [src/core/](../src/core/): the simulation. No DOM. A `Tank` holds `Fish`; each fish has a motion model and parameters.
- [src/render/](../src/render/): a Canvas 2D renderer that only reads the tank.
- [src/ui/](../src/ui/): a lil-gui panel that only changes the tank through its methods.

The rule that the simulation never knows how it is drawn is what makes "one project, several modes" possible. Keep it.

## The main tension: paths against behaviour

Today a fish's position is a pure function of time. [tank.ts](../src/core/tank.ts) asks "where is this fish at time t" and puts it there. The fish has no memory and no velocity of its own.

That is ideal for strand 1: paths are exact, repeatable and easy to test. It cannot do strand 3. A fish that scatters from a hand, or schools with its neighbours, depends on where it was a moment ago and what is around it.

**Proposed approach: the path becomes where the fish wants to be, not where it is.**

- Each fish keeps its equation. The equation gives a *target* that moves along the path.
- Each fish also has a real position and velocity. Every step, it steers towards its target.
- Other influences add to the steering: away from a hand, towards a hand, with the school.
- So does drift: a small, slowly changing nudge of the fish's own, so it wanders a little either side of its route. It is generated from the tank's seeded randomness, never the real clock, so runs stay repeatable.
- One number per fish, call it path strength, sets how hard it holds to the target.

With path strength at full and no other influences, the fish sits on its target and the result is today's equation aquarium. With it lower, a hand can push the fish away and it swims back afterwards, which is the Animal Crossing fish with Swish Fish hands. With it at zero, fish flock freely.

This is the first thing to build, because pointer, flocking, hand and body tracking all depend on it, and it decides whether strand 1 and strand 3 stay one codebase.

*Risk to check early:* a fish chasing a fast target may cut corners and blur a sharp path such as the heart. Equation mode can keep exact placement to avoid this.

## One kind of input for all interaction

A mouse, a tracked hand, a person in front of a projection and a touch on a phone are all the same thing to the fish: a point in the tank, possibly moving, that attracts or repels.

So the core gets one concept, an **influence**: a position in tank units, a velocity and a radius. An influence is a presence, not a command. How a fish responds depends on the fish: each has a temperament from shy to curious, taken from its species, so the same hand draws some fish in and sends others away. An influence may carry an override ("everything scatter") for gestures and for the operator, and a fast-moving one startles every fish. Each input source is a small adapter in `src/ui/` (or a new `src/input/`) that turns its device into a list of influences each frame.

This means every behaviour is developed with a mouse first, and adding a new sensor never touches the fish.

## Tank size and screen size are separate things

The aquarium has to work on a phone, a laptop and a wall several metres wide, showing a few fish on one and hundreds on another. Today it cannot: the tank's width *is* the screen's aspect ratio ([canvas2d.ts](../src/render/canvas2d.ts) hands it to `tank.resize`), so the same tank is a different shape on every device and holds the same fish on all of them.

**Proposed approach: a tank has its own size, and each screen is a window onto it.**

- **The tank** has a fixed width and height in its own units, saved with it. Routes, schools and fish counts belong to the tank. A big tank holds hundreds of fish; a small one holds five.
- **The view** belongs to the device: which part of the tank is on screen, and how zoomed in. Renderers and inputs go through the view to convert between screen and tank positions. The simulation never sees it.
- **One rule sets the zoom:** fish must be a comfortable size to look at. On a wall, that lets the whole of a big tank fit. On a phone, only part fits, so the view can be moved.
- **How the view moves** when the tank is bigger than the screen: drag to pan, pinch to zoom, or follow a chosen fish. Following a fish is probably the nicest way to watch on a phone.

What each device gets from the same rule:

| Device | Sees | Fish on screen | View moves |
| --- | --- | --- | --- |
| Phone, own small tank | The whole tank | A few | No |
| Phone, large tank | A window | A few at a time | Pan, zoom, follow |
| Laptop | Most or all of a medium tank | Tens | Sometimes |
| Wall | All of a large tank | Hundreds | No |

So "a few fish on a phone, hundreds on a wall" comes from two choices that can be combined freely: how big the tank is, and how much of it this screen shows.

**Things that follow from this**

- **Tank units become real units.** With real species, the natural unit is the metre. A tank 4 m wide on a wall 4 m wide shows fish life-size, which eases the sardine-against-tuna scale problem exactly where there is room for it.
- **Drawing hundreds of fish.** Skip fish outside the view. Draw distant or tiny fish more simply. Shrink fish pictures to the size they appear. This is a strong push towards WebGL, which can draw many copies of a picture cheaply; Canvas 2D will likely struggle with hundreds of bending fish.
- **Simulating hundreds of fish.** Flocking compares each fish with its neighbours, which gets slow if every fish checks every other. The usual fix is to sort fish into a grid so each only checks nearby cells. Trails, at 240 points per fish, are switched off or shortened in large tanks.
- **A phone viewing a large tank** still simulates the whole tank even though it shows a corner. Whether a phone can do that for several hundred fish needs measuring.
- **Reach of a hand.** How far a hand or finger affects fish should be set by its size on the screen, then converted to tank units. A fingertip on a phone and a person at a wall then both feel right.
- **Edges.** Routes wrap at the tank's edges, as now. If the tank also joined up left to right, like a cylinder, a phone could scroll round it for ever. Undecided.
- **Backgrounds** are sized to the tank, not the screen, and scroll with the view.

*Later concern:* two devices showing the same tank at the same moment (a phone looking into the wall's tank) need to agree on where the fish are. Fish on pure equation routes agree automatically if the devices share a clock. Pushed and flocking fish do not, and would need the real-time service.

## Smaller changes the ideas require

| Today | Problem | Change |
| --- | --- | --- |
| A fish's id is its position in the list, and fish are never removed | An exhibition tank must retire old fish | Stable ids, and a way to remove a fish |
| A fish's look is one `hue` number | Illustrated, generated and visitor-coloured fish need more | An `appearance` on each fish, separate from its motion |
| Positions are `{ x, y }` | 3D paths | Add z, defaulting to the middle of the tank, so 2D keeps working |
| One fish, one equation | Formations | A group that shares an equation, with a per-fish index |
| The starting tank is written in [main.ts](../src/main.ts) | Saving, sharing, visitor fish | A plain-data description of a tank that can be saved and loaded |

`Fish` is already plain data with compiled equations held separately, so saving is mostly a matter of choosing what to keep.

## Species as data

Real fish (see [ideas.md](ideas.md#real-fish)) add a layer above the individual fish: a **species** record that supplies defaults for everything else.

- A species is plain data: names, real length, swimming style, cruising speed, school size, depth band, biomes, and a pointer to its artwork.
- A fish refers to a species and may override anything, so equation mode can still put a tuna on a heart-shaped path.
- A biome is a named list of species plus a background. The tank holds the current biome and a switch for whether it is enforced.
- Real and made-up are tank settings of the same kind: rules about which fish may be added and whether species habits are enforced. They are checked when a fish is added and nowhere else, so the simulation and renderers do not know which kind of tank they are in.
- Adding a species should mean adding a data record and a drawing, with no new code.
- A species need not be a fish. Rays, whales and seals are planned for later, so the code talks about species and animals where it can, and the swimming layer below allows for bodies that bend up and down as well as side to side.

This also splits motion into three layers, each of which can be worked on alone:

| Layer | Question it answers | Comes from |
| --- | --- | --- |
| Route | Where is the fish heading? | The equation, or the species' habit |
| Steering | Where does it actually go? | Route, plus hands, school and predators |
| Swimming | How does its body bend? | Species' swimming style and current speed |

The swimming layer belongs to the renderer's side of the line: it changes how a fish is drawn, never where it is. The simulation only has to supply speed and turn rate.

## Modes

A mode is a choice of renderer, input adapters and on-screen controls over the same tank.

| Mode | Renderer | Inputs | Controls |
| --- | --- | --- | --- |
| Equation | 2D or 3D | Mouse to select | Full panel |
| Describe | 2D or 3D | Text | Text box and panel |
| Interactive | Full screen | Camera, network (new fish) | None on the display; a separate operator window |
| Phone | 2D | Touch | None, or a fish designer |

## Things that need more than a static site

The site is static files today. Three ideas change that, in rising order of effort:

1. **Describe a motion** needs one small server function that holds the API key and forwards the request.
2. **Body tracking with a depth sensor** needs a small program on the exhibition computer that reads the sensor and passes points to the browser. Local only, no internet.
3. **Adding fish by QR code or paper scan** needs a hosted service that passes messages between phones and the tank in real time, and somewhere to keep fish artwork.

None of these is needed for pointer, flocking, webcam hands, projection, graphics or saving by link. A great deal of strand 3 can be built before any server exists.

## Rendering

- Canvas 2D is enough for now and for simple illustrated fish.
- Bending an illustration as it swims, water effects and 3D all point to WebGL. Three.js is already the plan in the [README](../README.md) and can draw flat illustrated fish as well as 3D ones, so one WebGL renderer could serve both.
- Decide after the first graphics experiment, not before.
