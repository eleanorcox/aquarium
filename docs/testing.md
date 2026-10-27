# Testing plan

We build this test-first. This doc says what that means here, what it covers, what it cannot cover, and which tests come first in each stage of the [roadmap](roadmap.md).

## How we work

For every change in behaviour:

1. **Write one test that describes the behaviour, and watch it fail.** A test that has never failed has not been shown to test anything.
2. **Write the least code that makes it pass.**
3. **Tidy up** with the tests still passing.
4. Repeat with the next behaviour.

Two further rules:

- **A bug gets a failing test before it gets a fix.**
- **An experiment is not exempt, but it is different.** When we do not yet know what the behaviour should be (how should scattering feel?), we try things by eye in a throwaway branch first. Once we know what we want, we write the tests and build it properly. Experimental code is not merged without them.

## What exists today

- 113 tests in eleven files, run with Vitest by `npm test`. All pass. There were 30 before stage 1.
- They test the simulation in `src/core/`, the inputs in `src/input/`, the view and draw list in `src/render/` and the fixed scenes in `src/scenes/`. Nothing tests the canvas drawing or the panel.
- The tests and the type check run automatically on every push and pull request ([ci.yml](../.github/workflows/ci.yml)).
- `npm run test:watch` reruns tests as files change, and [testing.ts](../src/core/testing.ts) builds and advances a test tank in one line.

The core is easy to test because of three choices already made, which every later stage must keep:

- **No DOM in the simulation**, so tests need no browser.
- **A fixed timestep**, so a test can say "after 600 steps" and mean an exact moment.
- **Randomness is passed in** (`new Tank(width, random)`), so a test can supply its own and get the same result every run.

## What test-first can and cannot do here

This project is mainly visual and partly about hardware. Tests can prove a fish is in the right place; they cannot prove it looks like a fish swimming. Being clear about the split stops us writing tests that prove nothing, or skipping tests that would have helped.

| Kind of code | Example | How it is checked |
| --- | --- | --- |
| Rules and maths | Steering, flocking, the view, saving, biome rules | Test-first, always |
| Turning device input into influences | Hand landmarks to "open hand at this point" | Test-first, using recorded input |
| Deciding what to draw | Which fish are in view, at what size and bend | Test-first, on the list of things to draw |
| Putting pixels on screen | Canvas and WebGL calls, shaders | By eye, using fixed scenes (below) |
| Feel | Does scattering feel alive, is the lag acceptable | By eye, with other people |
| Hardware | Does the camera see people in front of a projection | By trying it |

The design aim that follows: **keep the parts that can only be checked by eye as thin as possible.** A renderer should be handed a finished list of what to draw and do nothing clever. An input adapter should turn raw device data into plain numbers in one small function, with everything after that testable.

## Kinds of test

### Behaviour tests

The main kind. Small, fast, on the core. Named as a sentence about what the aquarium does, as the existing ones are: `'breaks the trail when a fish wraps so no line crosses the tank'`.

### Always-true tests

Some things must hold for every fish in every situation, and are checked across many fish, paths and random seeds at once:

- The same starting tank and the same steps give exactly the same result.
- No position is ever not-a-number or infinite.
- No fish leaves the tank.
- No fish exceeds its top speed.

These catch the bugs nobody thought to write a test for. They run over every built-in path and every species automatically, so adding a path or a species adds coverage with no new test.

### Recorded-input tests

For cameras. A short recording of what the tracker produced (hand landmark positions over a few seconds) is saved as a file, and tests replay it. The camera and the tracking model are never run in tests.

### Speed checks

"500 fish step in under 4 ms" is a requirement like any other, but timing varies between machines, so these are kept apart from the main tests: run on request with `npm run speed`, reported as numbers, and compared with the last run. They do not block a change unless something gets dramatically slower. Files are named `name.speed.ts`.

Drawing cannot be timed without a real screen, so the panel has a Speed section showing the time spent stepping and drawing each frame.

### Asset checks

Pictures and data files made by other people or agents are checked by tests against the briefs in [assets.md](assets.md): the PNG has real transparency, is the right width, has a margin; the species file has every required value in an allowed form. A bad asset then fails a test instead of showing up as a strange-looking fish.

### Whole-app checks (later)

A real browser opens the app and confirms it starts, shows a tank and adds a fish. A handful at most, added when there is more than one mode to break. Not needed yet.

### Fixed scenes for checking by eye

Not automatic tests, but part of the plan. A scene is a named, repeatable tank (same fish, same seed) opened by a web address, for example "one fish of each swimming style" or "500 sardines and a pointer". Anything that has to be judged by eye is judged on the same scenes each time, so "it looked better last week" can be checked.

The scenes are in [scenes.ts](../src/scenes/scenes.ts), each with a note on what to look for. Open one by adding `?scene=name` to the address, or choose it from the Scene list in the panel:

| Address | Scene | For judging |
| --- | --- | --- |
| `?scene=mixed` | Mixed tank (the default) | The overall feel |
| `?scene=paths` | Every path | That routes are exact and turns smooth |
| `?scene=temperaments` | Shy to curious | The response to the pointer, slow and fast |
| `?scene=drift` | Drift | Drift from none to full |
| `?scene=school` | One school | Schooling, and a school parting round the pointer |
| `?scene=shoal` | Five hundred fish | Speed, and dragging and zooming around a tank bigger than the screen |
| `?scene=field` | A field of fish | Being in the middle of one huge school, filling the screen; parting it with a hand |

Tests check that every scene is the same tank each time and keeps its fish inside the tank. A new scene is covered by those tests as soon as it is added.

Visual modes are checked the same way from the other side: a test draws every scene in every visual mode onto a stand-in canvas and fails if any drawing call receives a number that is not a real number, which is how broken bending geometry shows up. It cannot tell whether a look is good; that is by eye, with `?scene=name&visuals=name`.

## Test rules

- Tests sit beside the code they test, as `name.test.ts`.
- No real clock, no real randomness, no network and no camera in any test.
- "Close enough" is always a stated number with a reason, never a default.
- A test checks behaviour that someone using the aquarium could notice, not how the code is arranged inside. Tests should survive a rewrite of the insides.
- Third-party libraries (lil-gui, math.js, Three.js, MediaPipe) are not tested. Our use of them is.
- No coverage target. The measure is whether each behaviour in this doc has a test.

## First tests for each stage

These are the behaviours to write tests for first, not a complete list. Each is one or more failing tests before any code.

### Stage 1: fish that can be pushed

*Built. The tests are in [steering.test.ts](../src/core/steering.test.ts), [tank.test.ts](../src/core/tank.test.ts) and [pointer.test.ts](../src/input/pointer.test.ts). Eleanor judged the feel by eye and was happy with it.*

- An unpushed fish is exactly on its route, on every built-in path. *The first test written. A measurement beforehand showed a fish that merely chases its route cannot do this, which changed the design: see entry 19 in [decisions.md](decisions.md).*
- All 30 earlier tests keep passing unchanged.
- A fish pushed off its route is back within the stated distance inside a stated time.
- A curious fish moves nearer to an influence; a shy one moves further away; one beyond the influence's radius does nothing.
- An influence with a scatter override sends a curious fish away too, as does one moving faster than the stated startle speed.
- Lower path strength means a larger displacement from the same push.
- A fish with drift strays from its route but never further than a stated distance; a fish with zero drift does not stray at all.
- Two fish with the same route and drift do not stray identically, and the same tank replayed strays identically.
- Two fish that are too close move apart. A fish among neighbours heading one way turns that way. A fish apart from its group moves towards it.
- A fish that is not set to school ignores all three rules.
- A fish can be removed, and the others keep their ids.
- The always-true tests, with influences and flocking switched on.

### Stage 1b: a tank bigger than the screen

*Built. The tests are in [view.test.ts](../src/render/view.test.ts), [viewGestures.test.ts](../src/input/viewGestures.test.ts), [drawList.test.ts](../src/render/drawList.test.ts), [neighbours.test.ts](../src/core/neighbours.test.ts) and the schooling tests in [steering.test.ts](../src/core/steering.test.ts). Still to do: judging panning, zooming and the 500-fish scene by eye.*

- Changing the screen size does not change the tank's size or any fish's path. *This reverses today's behaviour, so the existing test of `resize` changes first.*
- A screen position converted to a tank position and back gives the starting position, at any pan and zoom.
- A tank that fits is shown whole and centred; the view cannot be moved.
- A tank that does not fit can be panned, but never past its edges.
- The zoom rule: a typical fish is never shown smaller than the stated minimum size.
- Following a fish keeps it within the middle of the view.
- Fish outside the view are left off the list of things to draw; fish straddling the edge are kept.
- The grid-based neighbour search gives the same neighbours as checking every pair.
- An influence's reach is the same size on screen at any zoom.
- Speed check: time to step 100, 500 and 2,000 flocking fish. *Run with `npm run speed`. On 13 October 2026: 0.3 ms, 3.4 ms and 33 ms a step, against a 16.7 ms frame.*

### Stage 2: hands

*Built. The tests are in [hands.test.ts](../src/input/hands.test.ts). They use made-up hands built from the standard 21-point layout, not recordings, because there is no camera here. Recordings from Eleanor's webcam would make better tests.*

- A recording of an open hand is read as "attract"; a recording of a fist as "scatter".
- A hand flickering between the two for a frame or two does not flip the behaviour.
- A hand's position on camera lands at the matching place in the tank, mirrored so moving right moves right.
- When the hand leaves the picture, its influence fades out instead of staying where it was.
- Two hands give two influences.

### Stage 3: a first look

*Partly built: the body-wave tests are in [swimming.test.ts](../src/render/swimming.test.ts).*

- The body wave is smallest at the head and largest at the tail.
- The eel preset bends along its whole length; the tuna preset stays nearly straight until the tail.
- A faster fish beats its tail faster, by the stated relationship; a still fish barely moves.
- The wave carries on smoothly when a fish changes speed, with no jump.
- Asset checks for fish pictures.

### Stage 3b: a small real tank

*Built. The tests are in [species.test.ts](../src/species/species.test.ts).*

- Every species file in the repo loads and passes its checks.
- A fish takes its size, speed and swimming style from its species; a fish can override them.
- Adding a schooling species adds a group within that species' usual numbers.
- With a biome enforced, a species from elsewhere is refused with a clear reason. With the rule off, it is accepted.
- A real tank refuses a made-up fish; a made-up tank accepts anything.
- The always-true tests, across every species.

### Stage 4: on the wall

*Corner correction and the display window are built; the tests are in [cornerPin.test.ts](../src/render/cornerPin.test.ts) and [frames.test.ts](../src/display/frames.test.ts). The two windows working together needs checking in a real browser. Movement detection is tested on made-up camera pictures in [motion.test.ts](../src/input/motion.test.ts).*

- Corner correction: the four corners of the picture land on the four chosen points, and a point in the middle lands in the middle.
- A camera position goes through the camera-to-projection mapping and back unchanged.
- Motion detection on made-up frames: no change gives no influences; a block moving across gives one influence that follows it.
- Small flicker, as from a projector, gives no influences.
- The operator window's changes reach the display window.

### Stage 5: visitors add fish

*Saving is built; its tests are in [save.test.ts](../src/core/save.test.ts). "A tank saved by an older version still loads" waits for a second version of the format.*

- A tank saved and loaded again produces identical fish positions after the same number of steps.
- A tank survives the round trip through a web address.
- A tank saved by an older version still loads.
- A damaged or deliberately hostile saved tank is refused cleanly and changes nothing.
- A fish sent from a phone with values outside the allowed lists is refused.
- When the tank is full, the oldest visitor fish leaves and the new one enters.
- Paper scanning, on saved photographs: the corner markers are found, the sheet is flattened, and the area outside the fish outline is transparent.

### Side branches

- **3D:** a fish with no z equation sits at the middle depth, and every 2D test still passes.
- **Formations:** each fish in a group gets its own index and the group's count, and a group of one behaves as a single fish.
- **Describe a motion:** tested with made-up replies, never a live model. A good reply becomes a swimming fish; a reply with broken equations, missing parts or anything other than equations is refused with a message. How well real replies match what people asked for is measured separately, on a set of saved descriptions, and is not part of the automatic tests.

## Done means

A piece of work is finished when:

1. Each behaviour it adds had a failing test first, and those tests now pass.
2. All earlier tests still pass, and the type check passes.
3. Anything judged by eye has been looked at on its fixed scenes.
4. At the end of a stage: a screencast is recorded and the version is added to [versions.md](versions.md).
5. Speed checks have been run if the change touches stepping or drawing.
