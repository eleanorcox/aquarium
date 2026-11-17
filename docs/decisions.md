# Decision log

A record of the design decisions in this project: what was decided, when, what prompted it, and what it replaced. It exists so the reasoning can be found later, in particular when writing about the work.

## How this log works

- **One entry per decision**, numbered in the order they were made, newest at the bottom.
- **Entries are not rewritten.** When a decision changes, a new entry is added that says what changed and why, and the old entry's status becomes "Replaced by" with a link. The old reasoning stays readable.
- **Add the entry when the decision is made**, in the same piece of work, not afterwards.
- **"What prompted it" is the part to get right.** It records the situation at the time: what was being built, what went wrong, what was asked for. Requests are written down in gist, not word for word.
- **Record the alternatives**, including the ones that lost, and why they lost.

Statuses:

- **Proposed:** written into the plan, not yet agreed or built.
- **Decided:** agreed.
- **Built:** decided and in the code.
- **Replaced by N:** no longer current.

Template:

```markdown
## N. Title

- **Date:**
- **Status:**
- **What prompted it:**
- **Decision:**
- **Alternatives considered:**
- **What follows from it:**
```

## Index

| No. | Decision | Date | Status |
| --- | --- | --- | --- |
| [1](#1-the-simulation-does-not-know-how-it-is-drawn) | The simulation does not know how it is drawn | 6 Oct 2026 | Built |
| [2](#2-fixed-timestep) | Fixed timestep | 6 Oct 2026 | Built |
| [3](#3-canvas-2d-for-the-first-renderer) | Canvas 2D for the first renderer | 6 Oct 2026 | Built; to be replaced, see 14 |
| [4](#4-the-tank-is-the-shape-of-the-screen) | The tank is the shape of the screen | 6 Oct 2026 | Replaced by 11 |
| [5](#5-typed-equations-through-mathjs) | Typed equations through math.js | 9 Oct 2026 | Built |
| [6](#6-one-project-with-modes) | One project with modes | 13 Oct 2026 | Decided as a working assumption |
| [7](#7-the-immersive-strand-leads) | The immersive strand leads | 13 Oct 2026 | Decided |
| [8](#8-build-first-buy-hardware-second) | Build first, buy hardware second | 13 Oct 2026 | Decided |
| [9](#9-real-and-made-up-fish-as-a-tank-setting) | Real and made-up fish as a tank setting | 13 Oct 2026 | Proposed |
| [10](#10-fish-steer-towards-their-path) | Fish steer towards their path | 13 Oct 2026 | Built, in the form set out in 19 |
| [11](#11-the-tank-has-its-own-size-screens-are-windows-onto-it) | The tank has its own size; screens are windows onto it | 13 Oct 2026 | Built, with the units set out in 22 |
| [12](#12-every-input-becomes-an-influence) | Every input becomes an influence | 13 Oct 2026 | Built |
| [13](#13-test-first) | Test-first | 13 Oct 2026 | Decided |
| [14](#14-move-to-webgl-through-threejs) | Move to WebGL, through Three.js | 13 Oct 2026 | Decided in direction; timing open |
| [15](#15-keep-this-log) | Keep this log | 13 Oct 2026 | Decided |
| [16](#16-the-fish-decides-how-to-respond-not-the-input) | The fish decides how to respond, not the input | 13 Oct 2026 | Built; refines 12 |
| [17](#17-fish-first-built-for-any-sea-animal) | Fish first, built for any sea animal | 13 Oct 2026 | Decided |
| [18](#18-cheaper-subagents-where-they-are-good-enough) | Cheaper subagents where they are good enough | 13 Oct 2026 | Decided |
| [19](#19-a-fishs-position-is-its-route-plus-an-offset) | A fish's position is its route plus an offset | 13 Oct 2026 | Built; refines 10 |
| [20](#20-equatium-as-a-working-name) | Equatium as a working name | 13 Oct 2026 | Decided; final name open |
| [21](#21-a-changelog-and-a-version-log) | A changelog and a version log | 13 Oct 2026 | Decided |
| [22](#22-tank-units-stay-tank-heights) | Tank units stay tank heights | 13 Oct 2026 | Built; refines 11 |
| [23](#23-behaviour-is-measured-in-fish-sizes) | Behaviour is measured in fish sizes | 13 Oct 2026 | Built |
| [24](#24-canvas-2d-stays-until-drawing-is-measured-on-a-real-screen) | Canvas 2D stays until drawing is measured on a real screen | 13 Oct 2026 | Decided; settles the timing left open in 14 for now |
| [25](#25-visual-modes-are-swappable-painters) | Visual modes are swappable painters | 27 Oct 2026 | Built |
| [26](#26-hand-tracking-runs-from-files-in-the-project) | Hand tracking runs from files in the project | 27 Oct 2026 | Built |
| [27](#27-swimming-and-schooling-follow-the-research) | Swimming and schooling follow the research | 27 Oct 2026 | Built |
| [28](#28-a-tank-is-shared-as-a-link) | A tank is shared as a link | 27 Oct 2026 | Built |
| [29](#29-hands-are-shown-not-only-felt) | Hands are shown, not only felt | 27 Oct 2026 | Built |
| [30](#30-the-display-window-only-draws) | The display window only draws | 27 Oct 2026 | Built |
| [31](#31-the-page-loads-both-windows-code-up-front) | The page loads both windows' code up front | 27 Oct 2026 | Built |
| [32](#32-real-species-are-data-and-tank-rules-are-checked-on-adding) | Real species are data, and tank rules are checked on adding | 27 Oct 2026 | Built |
| [33](#33-schools-can-keep-to-their-own-kind) | Schools can keep to their own kind | 27 Oct 2026 | Built; Colour schools changed by 34 |
| [34](#34-disturbed-fish-can-join-the-nearest-other-school) | Disturbed fish can join the nearest other school | 27 Oct 2026 | Built |

Entries 1 to 5 were written on 13 October 2026, looking back. Their dates come from the commit history and their reasons from the commit messages and the [README](../README.md) as they stood; they were not recorded at the time.

---

## 1. The simulation does not know how it is drawn

- **Date:** 6 October 2026 (commit `0ea49a8`)
- **Status:** Built
- **What prompted it:** The project was started as "a way to learn 3D and immersive technology step by step: 2D in the browser, then 3D, then an external monitor, then a projector, and later webcam or depth-camera control" (README). The drawing method and the inputs were expected to change several times.
- **Decision:** Three parts with one-way dependencies. `src/core/` is the simulation, with no access to the page. `src/render/` only reads the tank. `src/ui/` only changes the tank through its methods.
- **Alternatives considered:** Not recorded.
- **What follows from it:** A new renderer or input can be added without touching fish logic. The simulation can be tested without a browser. This is the decision that makes 6, 12 and 14 cheap.

## 2. Fixed timestep

- **Date:** 6 October 2026 (commit `0ea49a8`)
- **Status:** Built
- **What prompted it:** The same aquarium was meant to run on screens with different refresh rates, ending with a projector.
- **Decision:** The simulation advances in equal steps of 1/60 of a second, however often the screen redraws, "so a fish follows exactly the same path on a laptop, a 144 Hz monitor or a projector" ([main.ts](../src/main.ts)).
- **Alternatives considered:** Not recorded. The usual alternative is to advance by however much real time has passed each frame, which is simpler and gives slightly different results on every machine.
- **What follows from it:** Runs are repeatable, so tests can check exact positions (see 13). Two devices with a shared clock can agree on where equation-driven fish are.

## 3. Canvas 2D for the first renderer

- **Date:** 6 October 2026 (commit `0ea49a8`)
- **Status:** Built; to be replaced, see 14
- **What prompted it:** The first version needed a handful of simple fish shapes and trails in 2D, as the first step of the 2D-then-3D plan.
- **Decision:** Draw with the browser's Canvas 2D drawing commands. The README already named "a Three.js renderer" as what comes next.
- **Alternatives considered:** Not recorded.
- **What follows from it:** Quick to write and easy to read. Not suited to hundreds of fish, bending pictures or 3D, which is what leads to 14.

## 4. The tank is the shape of the screen

- **Date:** 6 October 2026 (commit `0ea49a8`)
- **Status:** Replaced by 11 on 13 October 2026
- **What prompted it:** One screen, one tank, filling the window.
- **Decision:** The tank is 1 unit tall and as wide as the screen's aspect ratio. Resizing the window resizes the tank.
- **Alternatives considered:** Not recorded.
- **What follows from it:** Simple, and the tank always fills the screen. But the same tank is a different shape on every device, and fish counts cannot differ between a phone and a wall.

## 5. Typed equations through math.js

- **Date:** 9 October 2026 (commit `6eafa8f`)
- **Status:** Built
- **What prompted it:** Letting people type their own x(t) and y(t), beyond the built-in paths.
- **Decision:** Parse typed equations with the math.js library. Check them before a fish uses them and show an error if they fail. Switch off the math.js functions that could change the library itself (`import`, `evaluate` and similar).
- **Alternatives considered:** Not recorded. Running typed text as JavaScript would have been the short route and is unsafe once equations are shared between people.
- **What follows from it:** Equations are plain text that can be saved, shared, and written by a language model, then checked the same way as a person's typing.

## 6. One project with modes

- **Date:** 13 October 2026
- **Status:** Decided as a working assumption
- **What prompted it:** Eleanor described the project as close to three projects in one (equations, described motion, immersive) and suggested it might be one large project with several modes, such as a projection or interactive mode, a phone mode and an equation mode.
- **Decision:** One codebase. A mode is a choice of renderer, inputs and on-screen controls over the same tank.
- **Alternatives considered:** Separate apps sharing a core library. Still open in [open-questions.md](open-questions.md): the exhibition display and the equation editor share almost no interface.
- **What follows from it:** The fish, tank and artwork are built once. Pressure on the core to serve both exact equation paths and interactive behaviour, which leads to 10.

## 7. The immersive strand leads

- **Date:** 13 October 2026
- **Status:** Decided
- **What prompted it:** Eleanor said the third strand, exploring different immersive technologies, is the one she is most interested in. No exhibition date exists, so nothing else sets the order.
- **Decision:** The roadmap heads for interaction as early as possible (pushable fish, then webcam hands) and treats 3D and language-model motion as side branches.
- **Alternatives considered:** Finishing the equation aquarium first, including 3D, as the README's original order had it.
- **What follows from it:** The first new work is in the simulation core, not in graphics or 3D.

## 8. Build first, buy hardware second

- **Date:** 13 October 2026
- **Status:** Decided
- **What prompted it:** Eleanor has no projector yet and wants to build first, so that she knows what to buy. The only hardware is a laptop with a built-in webcam.
- **Decision:** Every behaviour must work with a mouse on a plain laptop. The projection stage is split: first on a monitor with no new hardware, ending in a written list of what to buy; then on a real projector.
- **Alternatives considered:** Buying a projector and a depth sensor up front to experiment with.
- **What follows from it:** Supports 12. Hardware unknowns stay unknown for longer.

## 9. Real and made-up fish as a tank setting

- **Date:** 13 October 2026
- **Status:** Proposed
- **What prompted it:** Eleanor wanted fish based on real species instead of invented ones, with biome rules that can be switched off, while visitors' coloured-in fish and equation paths are plainly invented. She suggested a real-fish mode and a made-up-fish mode.
- **Decision:** Real or made-up is a rule on the tank about which fish may be added and whether species habits are enforced. It is checked when a fish is added and nowhere else.
- **Alternatives considered:** Two separate apps or code paths; a single tank type where everything mixes freely.
- **What follows from it:** One set of fish, steering and drawing code serves both. Biomes are the same kind of rule.

## 10. Fish steer towards their path

- **Date:** 13 October 2026
- **Status:** Built 13 October 2026, in the form set out in 19
- **What prompted it:** Today a fish is placed exactly where its equation says, with no velocity or memory. Scattering from a hand and flocking both need a fish that can be somewhere other than on its path. The two inspirations pull the same way: Animal Crossing fish have fixed routes, Swish Fish fish are pushed by hands.
- **Decision:** The equation gives a moving target. The fish has its own position and velocity and steers towards the target, plus any other influences. A per-fish path strength sets how hard it holds to the route. Equation mode keeps exact placement.
- **Alternatives considered:** Two separate simulations, one for equations and one for behaviour. Adding a temporary offset to the equation position that fades out, which is simpler but cannot do flocking.
- **What follows from it:** One simulation for all strands. Risk: a steering fish may cut the corners of sharp paths. The first test of stage 1 measures this, and the decision is confirmed or changed on its result.

## 11. The tank has its own size; screens are windows onto it

- **Date:** 13 October 2026
- **Status:** Built 13 October 2026, with the units set out in 22; replaces 4
- **What prompted it:** Eleanor asked for it to handle very different screen sizes: a phone, a laptop and a projection on a large wall. The wall should show hundreds of fish; a phone only a few, probably with scrolling around the environment.
- **Decision:** A tank has a fixed size, saved with it. Each device has a view: which part of the tank is on screen and how zoomed in, set so fish are a comfortable size. A tank that does not fit can be panned, zoomed or watched by following a fish.
- **Alternatives considered:** Keeping 4 and scaling the number of fish to the screen, which gives every device a different aquarium. Separate small and large tank types with different code.
- **What follows from it:** Tank units can be real metres, which helps with real fish at true scale. Hundreds of fish become a speed question for both simulation and drawing, which adds to the case for 14. Scheduled early (stage 1b) because every input and renderer converts between screen and tank positions.

## 12. Every input becomes an influence

- **Date:** 13 October 2026
- **Status:** Built 13 October 2026
- **What prompted it:** The list of inputs wanted: mouse, webcam hands, a camera or depth sensor in front of a projection, touch on a phone. Plus 8, which needs everything to work without hardware.
- **Decision:** The simulation knows one kind of input, an influence: a point in the tank with a velocity, a radius and a kind (attract or scatter). Each device has a small adapter that produces influences.
- **Alternatives considered:** Handling each device separately in the simulation.
- **What follows from it:** Behaviours are developed with a mouse and work unchanged with a camera. Adapters can be tested with recorded input.

## 13. Test-first

- **Date:** 13 October 2026
- **Status:** Decided
- **What prompted it:** Eleanor asked for the implementation to be done test-first. The project already had 30 tests on the simulation and was about to change the core substantially.
- **Decision:** Every change in behaviour starts with a failing test. Things that can only be judged by eye are checked on fixed, repeatable scenes. Details in [testing.md](testing.md).
- **Alternatives considered:** Testing after building. Not seriously weighed.
- **What follows from it:** Code that can only be checked by eye is kept thin. The risk in 10 is settled by a test instead of an opinion.

## 14. Move to WebGL, through Three.js

- **Date:** 13 October 2026
- **Status:** Decided in direction; timing open. Replaces 3 when built.
- **What prompted it:** Three plans made on this date that Canvas 2D handles badly: hundreds of fish on a wall (11), bending a fish picture so it swims, and 3D tanks. After a comparison of the two, Eleanor concluded that WebGL will definitely be needed eventually.
- **Decision:** The renderer will move to WebGL, using the Three.js library on top of it, as the README had planned since 6 October. The Canvas 2D renderer stays until the WebGL one can replace it.
- **Alternatives considered:**
  - *Staying on Canvas 2D.* Fine for today's few simple fish; cannot do 3D at all.
  - *PixiJS.* A WebGL library made for 2D pictures, and probably the easier fit for a flat aquarium. Ruled out as the main choice because it has no 3D, and 3D is planned.
  - *WebGL directly, with no library.* Most control, far more code to write and maintain.
- **What follows from it:** A second renderer beside the first, possible because of 1. When to do it is to be set by the 500-fish test in stage 1b: before the graphics work if Canvas 2D is already too slow, during it otherwise.

## 15. Keep this log

- **Date:** 13 October 2026
- **Status:** Decided
- **What prompted it:** Eleanor asked for a document recording design decisions, when they were made and what prompted them, including changes from one architectural choice to another such as Canvas 2D to WebGL, to draw on later when writing about the work.
- **Decision:** This file, kept as described at the top.
- **Alternatives considered:** Leaving the reasoning in commit messages and the planning docs, where it gets overwritten as plans change.
- **What follows from it:** Every decision from here on adds an entry as it is made.

## 16. The fish decides how to respond, not the input

- **Date:** 13 October 2026
- **Status:** Built 13 October 2026; refines 12
- **What prompted it:** Eleanor suggested a curiosity factor: curious fish go towards a hand instead of scattering from it.
- **Decision:** An influence no longer has a kind. It is a presence, and each fish responds according to its own temperament, from shy to curious, with the starting value set by its species. Two exceptions: an influence can carry an override for gestures and the operator, and a fast-moving influence startles every fish.
- **Alternatives considered:** Keeping attract and scatter as two kinds of influence, as first written in 12, which makes every fish in the tank react identically.
- **What follows from it:** A mixed tank reacts in a mixed way. Temperament becomes a species fact. The stage 1 tests are written in terms of curious and shy fish.

## 17. Fish first, built for any sea animal

- **Date:** 13 October 2026
- **Status:** Decided
- **What prompted it:** Eleanor wants manta rays, whales, seals and other sea animals eventually, starting with fish.
- **Decision:** Only fish are built for now. The catalogue is of species, the code avoids assuming a fish where it reasonably can, and the swimming layer leaves room for bodies that bend up and down.
- **Alternatives considered:** Designing for all sea animals now, which would slow the first stages for animals that are a long way off. Ignoring them until later, which risks fish-only assumptions throughout.
- **What follows from it:** Some care over naming now. The scale question gets harder later, since a whale is over a hundred times the length of a sardine.

## 18. Cheaper subagents where they are good enough

- **Date:** 13 October 2026
- **Status:** Decided
- **What prompted it:** Eleanor asked for rules on using subagents, using cheaper ones where effective: exploring code, for example, can go to a cheaper model than writing it.
- **Decision:** Rules in [CLAUDE.md](../CLAUDE.md): do small things directly, match the model to the kind of work, move up a tier when a result is thin, and check a subagent's report before relying on it. Design decisions and changes to the simulation core are not delegated.
- **Alternatives considered:** Running everything on the main model, which is simplest and costs most.
- **What follows from it:** The briefs in [assets.md](assets.md) can be handed to cheaper agents. The rules are a first version and should change as we see what works.

## 19. A fish's position is its route plus an offset

- **Date:** 13 October 2026
- **Status:** Built; refines 10
- **What prompted it:** The risk recorded in 10, that a fish chasing its route target would cut corners. Before writing the first stage 1 test it was measured: a fish chasing its target with a spring soft enough to be pushed trailed the target by 0.04 to 0.11 of the tank's height across the built-in paths, which is one to three fish lengths. Even with a spring nearly seven times stiffer it trailed by 0.01 to 0.04. So plain chasing fails.
- **Decision:** Keep the idea in 10 but change what is simulated. A fish's position is its route position plus an offset. The offset has its own velocity, is pulled back to zero by a spring whose stiffness is the fish's path strength, and is pushed by influences, drift and schooling. This is what chasing becomes once the fish is also told how its target is moving; simulating the offset directly gets the same result with no error.
- **Alternatives considered:**
  - *Plain chasing,* as measured above.
  - *A much stiffer spring.* Less lag, but a fish too stiff to push.
  - *An offset that simply fades,* with no velocity of its own. Rejected in 10 because it cannot school; the offset here responds to forces worked out from where the fish really are, so it can.
- **What follows from it:**
  - An unpushed fish is exactly on its route, so equation mode needs no special case and every earlier path test still passes unchanged. The first stage 1 test checks this exactly, on all ten built-in paths.
  - Drag does not weaken with path strength. A fish that barely holds its route drifts back slowly, and a curious fish settles beside a pointer instead of wobbling around it. This came from a failing test, where a curious fish swam through the pointer.
  - Path strength at zero means a fish never returns to its route, but it still moves with it. A fish with no route at all, swimming freely, is not built and would be a new kind of route.
  - "Top speed" is a limit on speed relative to the route. A route can still be as fast as its equation makes it.
  - Offsets wrap round where the route wraps and stop at the tank's edge otherwise.

## 20. Equatium as a working name

- **Date:** 13 October 2026
- **Status:** Decided; final name open
- **What prompted it:** Eleanor had been calling the project Equatium, including in the titles of her screencasts, while the code and README said "Equation Aquarium". She is not sold on it as the final name, because the project may end up not being an equation aquarium in every mode.
- **Decision:** Call it Equatium everywhere for now: page title, panel, README, package name and docs. Treat the final name as open.
- **Alternatives considered:** Keeping "Equation Aquarium", which has the same weakness and is longer. Waiting for a final name, which leaves the code and the screencasts disagreeing.
- **What follows from it:** "Equation aquarium" in lower case still means the first strand of the project. A later rename touches the same five places.

## 21. A changelog and a version log

- **Date:** 13 October 2026
- **Status:** Decided
- **What prompted it:** Eleanor asked for a log of each version, having recorded screencasts of v1 and v2 to show how the interaction is changing, then suggested it might be a changelog instead, or both.
- **Decision:** Both, with separate jobs. [CHANGELOG.md](../CHANGELOG.md) at the top of the repo is the conventional short list of what was added and changed, updated with each change. [versions.md](versions.md) says what each version was like to use and names its screencast. Each version gets a git tag.
- **Alternatives considered:** A changelog alone, which is where people expect to look but has no natural place for how a version feels or for the videos. A version log alone, which mixes long feature lists into the narrative.
- **What follows from it:** Two files to keep in step. The version log links to the changelog for the lists instead of repeating them.

## 22. Tank units stay tank heights

- **Date:** 13 October 2026
- **Status:** Built; refines 11
- **What prompted it:** Building 11. The plan there said tank units could become real metres, with a tank having any width and height. But every built-in path and typed equation assumes a tank one unit tall: centre lines, amplitudes and `cy` are all written against that.
- **Decision:** A tank is always one unit tall. Its size is its width, plus how small its fish are. A "big" tank, for a wall, is a wide one full of small fish; a phone's own tank is a narrow one with a few large fish. The default tank is 16:9.
- **Alternatives considered:** Tanks of any width and height in metres. More literal, but it means rewriting all ten paths and the typed-equation variables, for no visible difference yet.
- **What follows from it:** Paths and saved equations keep working unchanged. Real sizes can come later as one number per tank, how many metres tall it is, used to turn a species' real length into a fish size. A view decides how far to zoom from the size of a typical fish, so a tank of small fish is shown zoomed in on a small screen and whole on a large one.

## 23. Behaviour is measured in fish sizes

- **Date:** 13 October 2026
- **Status:** Built
- **What prompted it:** The first tank of small fish. Schooling distances and drift had been fixed lengths tuned for fish of one size, so small fish kept apart by many times their own length and wandered several lengths off their routes. Zooming in also shortened the pointer's reach in the tank without weakening its push.
- **Decision:** How far a fish sees its schoolmates, how much space it keeps, and how far it drifts are all multiples of its own size. The pointer's reach is set in pixels, and its push is in proportion to its reach.
- **Alternatives considered:** Separate settings per tank, which would need retuning for every fish size.
- **What follows from it:** A school of small fish looks like a scaled-down school of large ones, and the pointer feels the same at any zoom. When species arrive, a sardine and a tuna in one tank each school at their own scale with no extra settings.

## 24. Canvas 2D stays until drawing is measured on a real screen

- **Date:** 13 October 2026
- **Status:** Decided; settles the timing left open in 14 for now
- **What prompted it:** The 500-fish test that 14 was waiting for. It measured the simulation, which could be timed here: on this machine one step takes 0.3 ms for 100 schooling fish, 3.4 ms for 500 and 33 ms for 2,000, against a frame of 16.7 ms. The first version took 9.9 ms for 500; creating nothing in the schooling loop and working out each fish's velocity once a step made it three times faster.
- **Decision:** No move to WebGL yet. The simulation handles 500 fish in about a fifth of a frame. Drawing could not be timed here, since a headless browser without a graphics card says nothing useful, so the panel now shows step and draw times, and the move is decided once Eleanor has read them on her own screen with the 500-fish scene.
- **Alternatives considered:** Moving to WebGL now on the expectation that Canvas 2D will be too slow. Likely right in the end, but it would be a guess, and stage 3's artwork experiment is a better moment.
- **What follows from it:**
  - 2,000 schooling fish is out of reach for the simulation as it stands. Fish in a dense school all see each other, so the work still grows with the square of the school's size. The usual cure is for each fish to attend only to its nearest few schoolmates. Not needed for hundreds.
  - `npm run speed` reports these timings, to compare before and after changes to the simulation.

## 25. Visual modes are swappable painters

- **Date:** 27 October 2026
- **Status:** Built
- **What prompted it:** Eleanor wanted to test different visuals side by side, calling the existing look Classic mode.
- **Decision:** A visual mode decides everything about how the tank looks: the water, the fish, their trails and the ring around the pointer. It is chosen per screen, from the panel or with `?visuals=name`, and can be switched while the fish swim. The renderer keeps everything that is not about looks: the view, zoom, and which fish are on screen. Three modes to start: Classic (unchanged), Natural (fish that bend as they swim) and Paper (ink fish on squared paper).
- **Alternatives considered:**
  - *One renderer with settings for colours and shapes.* Fine for small changes, but a new look such as illustrated fish or WebGL needs different code, not different settings.
  - *Calling them themes.* Kept "visual modes" as Eleanor named them, always with "visual" in front, because "mode" already means equation, interactive and phone mode in these docs.
- **What follows from it:**
  - Stage 3's comparison of drawn and generated fish becomes a matter of adding visual modes.
  - A WebGL renderer can arrive as visual modes of its own, one at a time, beside the Canvas 2D ones.
  - Natural pulls part of stage 3 forward: the body-wave equation is built and tested, side-on swimming is drawn in the stylised way for now (the body visibly ripples), and until there are species each fish's swimming style comes from its id.

## 26. Hand tracking runs from files in the project

- **Date:** 27 October 2026
- **Status:** Built
- **What prompted it:** Stage 2 uses Google's MediaPipe hand-tracking model. It needs a trained model file (7.8 MB) and a compiled runtime (13 MB, in three versions for different browsers), which are normally downloaded from Google and a public package server each time the page opens. Eleanor often works without wifi, and an exhibition may have none; she chose to keep them in the project.
- **Decision:** The model file is kept in the repository at `public/mediapipe/hand_landmarker.task`. The runtime comes from the installed `@mediapipe/tasks-vision` package, version 1.1.0 pinned exactly, and is copied into `public/mediapipe/wasm` after every `npm install`; that copy is not committed. Version 1.1.0 was chosen over the newer 1.1.1 because 1.1.1 was under two weeks old.
- **Alternatives considered:** Downloading both at run time, which adds nothing to the project but stops hand tracking without internet. Committing the runtime as well, which adds 39 MB of files that `npm install` already provides.
- **What follows from it:**
  - Hand tracking works offline once `npm install` has run.
  - A built site is about 46 MB, mostly the three runtime versions. One of them, the "module" version, is probably unused and could be left out of the build.
  - The package is Apache-2.0. The model's licence has not been confirmed from a source; check the model card before publishing the repository or the site.
  - Headless test browsers here cannot open a camera, so camera start-up is checked by hand. The step that turns tracking points into influences is tested.

## 27. Swimming and schooling follow the research

- **Date:** 27 October 2026
- **Status:** Built
- **What prompted it:** The sourced survey in [research/fish-motion.md](research/fish-motion.md), written by a research subagent and checked here against its main sources (Di Santo et al. 2021, 44 species; Seo et al. 2025; Couzin et al. 2002). Several values in the code had been written from memory.
- **Decision:**
  - *Body wave.* Envelopes are now polynomials with a constant term, so the head moves a little and the least movement is about a quarter of the way back, as in measured fish. Eel and mackerel envelopes come from published fits; trout and tuna remain unsourced and are marked so. Wavelengths are the 44-species medians: eel-like 0.75, trout-like 0.93, mackerel-like 1.0, tuna-like 1.14 body lengths. The tail swings 0.1 body lengths either way in every style.
  - *Tail beat.* Unchanged: it already matched Bainbridge's measured line at 3 body lengths a second, and the survey confirms the Strouhal number it uses. Below about 2.75 body lengths a second the measured line is not valid, so the slow beat of a still fish stays a choice.
  - *Schooling.* A fish lines up with and moves towards its three nearest schoolmates, not everyone in sight. Studies of fish find they react to one to three neighbours; the "seven nearest" figure often quoted comes from starlings. Fish still keep clear of anyone too close.
- **Alternatives considered:** Keeping the remembered values, which were close but wrong in the details the survey corrected. Following one or two neighbours, which is closer to some studies but risks schools splitting in a small tank.
- **What follows from it:**
  - Two tests had encoded the remembered values: that the swing grows steadily from the nose, and that a tuna is nearly still to halfway. Both now encode the measurements.
  - Schools pack a little more tightly, and a step of 500 schooling fish takes about 4.2 ms instead of 3.4 ms.
  - Still unsourced: trout and tuna envelopes, and cruising speeds by style. The survey lists open datasets, including the 44-species kinematics, from which per-species values could be read.

## 28. A tank is shared as a link

- **Date:** 27 October 2026
- **Status:** Built
- **What prompted it:** The first, server-free step of stage 5 in the [roadmap](roadmap.md), picked up while Eleanor was away because it needed no decisions from her.
- **Decision:** A tank's setup (its width, the time, schooling strengths, and each fish's path, settings, name, colour and size) is saved as plain data, compressed, and written into the address as `?tank=...`. Loading checks every value: anything that is not a saved tank, an unknown path, a broken number, an equation that fails or tries to reach outside the maths, more than 2,000 fish, an empty tank or an impossible size is refused with a reason, and the page falls back to the default scene. Settings out of range are brought into range instead of refused.
- **Alternatives considered:** Saving in the browser only, which cannot be shared. A server, which stage 5 will need for visitors' fish but which is not needed to share a tank.
- **What follows from it:**
  - A five-fish tank is a link of about 500 characters; 500 fish fit in under 20,000.
  - Saved data has a version number, so a later format can still read old links.
  - Where fish are at the moment of saving is not saved, only their routes and the time. Fish on routes carry on exactly; pushed, drifting and schooling fish start again from their routes.

## 29. Hands are shown, not only felt

- **Date:** 27 October 2026
- **Status:** Built
- **What prompted it:** Eleanor tried the webcam: the camera came on, but she could not tell what her hands were doing and saw no ring in the tank. A check with MediaPipe's own test photos showed the model and the hand reader work (a fist photo was found, read as a fist and turned into a scatter). The most likely fault was the tracking loop stopping on its first error without any sign, because an error inside it ended the loop while the panel still said "On".
- **Decision:** Tracking errors are caught, reported in the panel, and, if the graphics card was the cause, tracking carries on using the processor. The preview shows the tracked points over the camera picture. Each hand is drawn in the tank as a coloured disc, one colour for an open hand and another for a fist, labelled with its shape. The panel says what the camera sees: "No hands seen", "1 hand: open", or the problem.
- **Alternatives considered:** Drawing hands like the pointer, as a faint ring. That was the original design, and it gave no way to tell a missing hand from a faint one.
- **What follows from it:** Whatever goes wrong on Eleanor's machine should now say what it is. Influences carry a `kind` and, for hands, a `shape`, used only for drawing.

## 30. The display window only draws

- **Date:** 27 October 2026
- **Status:** Built
- **What prompted it:** Stage 4a: when projecting, the projector should show only the tank while the controls stay on the laptop screen.
- **Decision:** The page opens either as the operator window (the app as before, with the panel) or, with `?display`, as a display window. The operator window runs the one simulation and sends each frame's fish positions to the display window over a BroadcastChannel, the browser's built-in way for windows on one machine to talk. The display window draws them in its own view, filling its screen, with its own corner correction. It sends back touches on the projection and which part of the tank it shows, so hands seen by the camera land on the projected picture.
- **Alternatives considered:**
  - *Both windows running the simulation in step.* Fish pushed by hands or schooling would drift apart between the two, since every input would have to reach both at the same moment.
  - *The display window running the simulation and the operator sending commands.* The panel is built directly on the tank's objects, so it would need rebuilding as a remote control.
- **What follows from it:**
  - Drawing code now works from a plain description of fish (`DrawnTank`, `DrawnFish`), not the simulation itself.
  - Trails are not sent to the display window.
  - The operator window must stay visible, not minimised: browsers pause animation in hidden windows, which would freeze the projection.
  - The hand-tracking library is now loaded only when hands are switched on, which makes every page start faster.
  - Headless test browsers here barely run animation, so the two windows together have not been seen working; the message format is tested.

## 31. The page loads both windows' code up front

- **Date:** 27 October 2026
- **Status:** Built
- **What prompted it:** After the display window (30) was added, the operator window no longer appeared in a headless browser. Tracking it down: the page loaded the operator's code on demand, and in the built site loading the maths library on demand never finished, with no error, while everything else loaded on demand without trouble and the same library loaded fine at start-up. The exact cause inside the build tool was not found.
- **Decision:** The page loads both the operator and the display code at start-up and picks which to run. Neither waits at the top level as it loads. Only the camera code, which does not include the maths library, is still loaded on demand.
- **Alternatives considered:** Finding and fixing the build tool's behaviour, which could have taken a long time with no guarantee; keeping on-demand loading for everything but the maths library, which is fragile.
- **What follows from it:** The display window loads a little more code than it needs. Commits f421824 to the one before this entry were broken in the built site and in the dev server under headless testing; Eleanor may have seen a blank page if she tried them.

## 32. Real species are data, and tank rules are checked on adding

- **Date:** 27 October 2026
- **Status:** Built; carries out 9 and 17
- **What prompted it:** Stage 3b. Six species files were gathered from FishBase by a research subagent to the brief in [assets.md](assets.md).
- **Decision:**
  - Every file in `assets/fish/` is checked and loaded into the catalogue at start-up. Adding a species is adding a file.
  - A species arrives as a lone fish or a school. Its size squeezes real length (a fish four times as long is drawn twice the size); its swimming style, temperament and colour come from its file; its route is a gentle wave in its depth band at a cruising speed set by its swimming style.
  - School size is about the middle of the species' usual numbers, limited so big fish come in small groups.
  - A tank is real or made-up, and may be limited to a biome. A real tank refuses made-up fish and, if it has a biome, species from elsewhere, each with a reason. A made-up tank takes anything.
  - Fish that swim with their fins (the Moorish idol) are drawn with the stiffest body the body wave allows, since fin swimming is not drawn yet.
- **Alternatives considered:** Species written into the code, which would make adding one a programming job.
- **What follows from it:**
  - Cruising speed by style, school sizes and temperaments are game choices, not sourced; the species files say so field by field. Colours are chosen by eye and marked as such.
  - Species are drawn as coloured versions of the generic bent body until pictures exist.

## 33. Schools can keep to their own kind

- **Date:** 27 October 2026
- **Status:** Built
- **What prompted it:** Eleanor asked for a scene where each group of fish is a different colour, and then made clear that the colours should mix only because of her: when she stirs them, not on their own. Separately, real species had been schooling with any other schooling fish, so sardines could join passing tuna.
- **Decision:** A fish may belong to a named school and then schools only with fish in the same school; fish with no school set school with each other, as before. Each real species arrives as its own school. The Colour schools scene leaves all its fish in one shared school but puts each colour on its own small route, far enough apart that no fish ever sees another colour's school unless pushed there. A test checks that over 20 seconds left alone.
- **Alternatives considered:** Separate schools per colour, which would stop the colours mixing even when stirred. Crossing routes, which would mix the colours without Eleanor doing anything.
- **What follows from it:** Mixing comes from people, and the loose hold on each fish's route slowly sorts the colours out again afterwards.

## 34. Disturbed fish can join the nearest other school

- **Date:** 27 October 2026
- **Status:** Built; changes the Colour schools scene described in 33
- **What prompted it:** Eleanor tried the first Colour schools and wanted something else: when she disrupts the fish, they should go to the nearest group, so the schools gradually become rainbows. And loads of fish.
- **Decision:** A tank setting, Pushed-out fish: swim home (as before, the default) or join the nearest school. With joining on, a fish that a pointer, hand or movement has pushed in the last second, and pushed at least six of its own lengths off its route, takes the route and schoolmates of the nearest other school. It keeps its colour, and is not sent on again until it has arrived. Colour schools is now eight single-colour schools of 40, each its own school, with joining switched on once the scene has settled.
- **Alternatives considered:**
  - *Join only if another school is nearer than its own.* Tried first. A hand pushes fish sideways out of its way, not towards the next school, so almost nothing changed school.
  - *Any fish far enough off its route.* Tried second. A school of 40 is naturally wider than that distance, so fish at the edge changed school with nobody touching them.
  - *All colours sharing one school.* Neighbouring schools pulled at each other's edges and swapped fish on their own.
- **What follows from it:** Mixing is caused only by people, which tests check both ways: 30 seconds alone changes nothing, and a hand swept along one row sends more than ten fish to other schools.

## 35. Free swimming: a fish with no route steers itself

- **Date:** 17 November 2026
- **Status:** Built
- **What prompted it:** Eleanor asked for free-swimming fish, put off since 13 October. They suit projection, where fish all on fixed loops can look too orderly.
- **Decision:**
  - Free swimming is a motion like the others, so it is chosen in the same list, saved in links, and set for all fish at once with All fish.
  - A free fish's route never moves from the tank's corner, so its offset is its position and everything that pushes offsets (pointers, hands, movement, schooling) works on it unchanged. In place of the spring back to a route it steers itself: it keeps up a cruising speed in the way it is going, drift turns it rather than shoving it sideways, it levels out when climbing or diving, and it turns away from edges and back into its depth range. Heading straight at an edge it turns rather than braking.
  - Its settings are cruising speed, preferred depth and depth range.
  - Free fish school twice as hard as fish on routes, because nothing else holds a free school together. Tried 1, 2, 3 and 5 on a school of 30: at 1 it thinned out over 20 seconds, 2 held it, more made it lumpy.
  - Switching a fish to free swimming lets it go from where it is, still heading the same way. Giving a free fish a route makes the gap its offset, so it swims to the route instead of jumping.
  - Free fish take no part in changing school (decision 34): they have no route to trade.
- **Alternatives considered:** A separate kind of fish outside the route-and-offset model, which would have needed its own handling in every input and in schooling.
- **What follows from it:**
  - What a free fish does with nothing happening is cruise, meander and school. Whether that looks purposeful enough is for judging by eye in the Free swimming scene.
  - The steering strengths are first guesses, as before.
  - Real species still arrive on routes. Letting them arrive free is a small step if wanted.

## 36. Groups of fish in the Fish list

- **Date:** 17 November 2026
- **Status:** Built; extends All fish
- **What prompted it:** Eleanor wanted to add lots of fish at once and to edit lots of fish at once.
- **Decision:**
  - The Fish list offers groups above the single fish: All fish, the fish just added, each school, each formation and all free swimmers. Groups are worked out afresh from the tank whenever the list is refreshed, so they need no upkeep and are never saved. Schools are named by species, or else by a colour word from their hue, since colour is how they are told apart on screen.
  - A group changes Motion, Behaviour and the new Look settings (colour and size) for all its fish. Path settings appear for a group only when all its fish are on the same kind of path, and then a moved slider sets that one value on every fish.
  - Adding takes a number and a way of arriving: separate fish on a mix of routes, a school sharing a route, or a free-swimming school. More than 20 in a school makes the fish smaller, so a school of 300 still fits the tank.
- **Alternatives considered:** Selecting fish by dragging a box round them on screen. It would be good on a big tank but clashes with dragging to look around, and groups by school cover the common case.
- **What follows from it:** A group chosen in the list is not highlighted on screen yet.

## 37. Published on GitHub Pages at a subdomain

- **Date:** 17 November 2026
- **Status:** Built; settles the open licence check in 29
- **What prompted it:** Eleanor asked to start hosting. She has a domain, eleanorcox.rocks, kept for a personal website still to be made.
- **Decision:**
  - The site is published to GitHub Pages by a workflow that runs the tests, builds, and publishes on every push to main. A failing test stops the publish.
  - It lives at a subdomain, aquarium.eleanorcox.rocks, so the main domain stays free for the website. The domain is pointed at GitHub with one DNS record at the domain's host. GitHub provides HTTPS, which browsers require before they allow the webcam.
  - The hand-tracking model's licence is confirmed from Google's model card: Apache License 2.0. A copy of the licence and a note of where the model came from are published beside it.
- **Alternatives considered:** Hosting with the domain's own host (Squarespace), which serves Squarespace sites, not arbitrary files. Netlify or Cloudflare Pages, which would work equally well but add another account. A path on the main domain, which waits on the website existing.
- **What follows from it:** The repository has to stay public while it is hosted free on Pages. Visitors adding fish by QR code (stage 5) needs a live server, which Pages cannot be; that will need somewhere else, and the static site can stay here.

## 38. How visitors make fish, and how long they stay

- **Date:** 17 November 2026
- **Status:** Decided; being built (plan in [visitors.md](visitors.md))
- **What prompted it:** Eleanor wanted to work on visitors adding fish by QR code while hosting waits on GitHub. Answers open questions 20, 21, 22 and 24.
- **Decision:**
  - Visitors pick one of a few fish outlines, then either choose colours and a pattern or colour the outline in with a finger, both from the start. Colouring in is kept inside the outline, like a colouring sheet, rather than free drawing; Eleanor's refinement of drawing, and the same idea as the paper sheets planned later.
  - Fish made from choices appear at once. Coloured-in fish wait for the operator to approve them, since a word or rude shape can still be coloured inside an outline. This part is a default chosen by Claude for Eleanor to change if she wants.
  - Visitor fish stay until the operator clears them.
  - No accounts: a visitor makes a fish and sends it, and nothing about them is kept.
  - A hosted service is acceptable. It will be a Cloudflare Worker with one Durable Object per tank, checked against Cloudflare's documentation before building.
  - Visitor fish swim freely, not on routes.
- **Alternatives considered:** Fixed choices first and drawing later, which needs no moderation; fish that leave after a while or when the tank is full; a link to follow your fish.
- **What follows from it:** The operator has an approval queue to watch while drawn fish are coming in. A busy event may need a limit on how many visitor fish a tank holds, for drawing speed.

## 39. How the visitor pieces fit together

- **Date:** 17 November 2026
- **Status:** Built; carries out 38
- **What prompted it:** Building the phone page, the service and the operator's side.
- **Decision:**
  - The phone page is a page of its own, `visit.html`, with its own small code (about 15 KB), so phones do not download the operator's maths library. The main page still chooses between operator and display (decision 31).
  - The service is a Cloudflare Worker with one Durable Object per room. It only checks fish, limits each phone to three a minute, and passes fish to the tank over a live connection; it keeps no fish and no pictures. If no tank is connected, the phone is told so instead of the fish being lost.
  - The operator holds the queue of coloured-in fish and decides on its own, so letting a fish in needs no reply to the service.
  - The tank checks every fish again on arrival, trusting nothing that came over the network.
  - A room's code and key are remembered in the operator's browser, so a reloaded page keeps the same QR code. A room that keeps refusing the tank is given up and a new one opened.
  - The QR code is drawn on the canvas after the tank, so corner correction straightens it with everything else.
  - Coloured-in fish keep white paper where they were not coloured, so a lightly coloured fish still shows up in dark water.
- **Alternatives considered:** The phone page inside the main page, which would make phones download everything; the service holding fish until approved, which needs more storage and messages and gains nothing while the operator is present.
- **What follows from it:** Going live needs a Cloudflare account; the site is then built with the service's address. Testing on a phone at home needs the laptop's network address, not localhost.
