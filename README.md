# Equatium

Equatium is a digital aquarium where every fish swims along a mathematical equation. Pick a fish, give it a sine wave, a Lissajous figure or a circle, and change its parameters while it swims. Move the pointer over the tank and the fish react: shy ones scatter, curious ones come to look, and all of them swim back to their routes.

The project is a way to learn 3D and immersive technology step by step: 2D in the browser, then 3D, then an external monitor, then a projector, and later webcam or depth-camera control.

Where the project is heading is written up in [docs/](docs/README.md). What has changed so far is in the [changelog](CHANGELOG.md).

Equatium is a working name, short for equation aquarium.

## Run it

Needs Node.js 22.12 or newer (`.nvmrc` pins 24; with nvm, run `nvm install` then `nvm use`).

```sh
npm install
npm run dev      # local dev server
npm test         # all tests
npm run speed    # time the simulation with 100, 500 and 2,000 fish
npm run build    # type-check and build static files into dist/
```

## How it is built

The simulation never knows how it is drawn.

- `src/core/` is the simulation: fish, motion equations and the tank. Plain TypeScript with no DOM, advanced on a fixed 1/60 s timestep so paths are identical on any screen.
- `src/render/` holds renderers that only read the tank. Today that is Canvas 2D; a Three.js renderer comes next.
- `src/ui/` holds the control panel, which only changes the tank through its methods.
- `src/input/` turns devices into influences the fish react to. Today that is the pointer; camera input comes later.

Positions are in tank units: every tank is 1 unit tall and has a width of its own, 16:9 by default. The screen is a window onto the tank. When the whole tank fits it is shown whole; a wide tank of small fish is shown zoomed in, and you can drag to move around it, zoom with the wheel or a pinch, or follow a fish.

### Motion models

| Model | Equations |
| --- | --- |
| Sine wave | x = x₀ + v·t, y = y₀ + A·sin(ωt + φ) |
| Zigzag | x = x₀ + v·t, y = y₀ + A·(2/π)·asin(sin ωt) |
| Bounce | x = x₀ + v·t, y = y₀ − A·\|sin ωt\| |
| Circle | x = cₓ + R·cos ωt, y = c_y + R·sin ωt |
| Lissajous | x = cₓ + A·sin(a·s + δ), y = c_y + B·sin(b·s), s = speed·t |
| Figure eight | lemniscate of Bernoulli: x = cₓ + A·cos s/(1 + sin²s), y = c_y + A·sin s·cos s/(1 + sin²s) |
| Rose curve | r = R·cos(kθ), θ = ωt |
| Spirograph | hypotrochoid: x = cₓ + (R − r)·cos θ + d·cos((R − r)/r·θ), y = c_y + (R − r)·sin θ − d·sin((R − r)/r·θ) |
| Breathing spiral | r = R·(0.55 + 0.45·sin νt), θ = ωt |
| Heart | x = cₓ + S·16·sin³s, y = c_y − S·(13cos s − 5cos 2s − 2cos 3s − cos 4s) |

Each fish faces the way it is moving. y points down, as on screen.

### Behaviour

The equation gives each fish its route. Its position is the route plus an offset, which a spring pulls back to zero, so a fish left alone is exactly on its route. Four settings per fish decide what moves it off:

| Setting | Range | What it does |
| --- | --- | --- |
| Holds its route | 0 to 1 | How hard the fish is pulled back. Lower means it is pushed further and returns more slowly. |
| Shy ↔ curious | −1 to 1 | Shy fish flee the pointer; curious fish approach and stop short of it; 0 takes no notice. |
| Drift | 0 to 1 | How much the fish wanders either side of its route of its own accord. |
| Schools | on or off | Schooling fish keep apart, swim the same way and stay together. Put several on one route and they form a school around it. |

The pointer can also attract or scatter every fish whatever its temperament, and a fast sweep startles them all. The strengths of these effects are in `src/core/steering.ts` and are first guesses.

### Movement

Tick **Movement (webcam)** to have the webcam watch the room instead of hands. Anything moving in the picture, such as someone walking past a projection, becomes a presence the fish react to, each by its own temperament. It compares each camera picture with the one before, so it needs no tracking model, and it ignores the whole picture getting lighter or darker, as when a projector flickers.

### Projecting

**Open display window** in the panel's **Projector** section opens a second window showing only the tank. Drag it onto the projector's screen and click it for full screen. The window you opened it from keeps the controls and runs the tank; keep it visible, not minimised, or the projection freezes. Touching or pointing at the projection works like the pointer, and with hands switched on, the camera picture is spread across the projected tank.

### Projector corner correction

A projector that is not square-on to its surface throws a lopsided picture. In the display window, press **C** and drag the four handles; **R** resets them. In a single window, use **Adjust corners** in the **Projector** section and drag the four handles to where the picture's corners should be; the whole picture stretches to fit, keeping straight lines straight. The pointer and hands still land where the fish are drawn. The corners are remembered in this browser; **Reset corners** undoes them.

### Sharing a tank

**Copy link to this tank** in the panel puts the tank's fish and settings into the address, compressed, and copies it. Opening the link shows the same tank in any browser, with no account or server. Links that are damaged or tampered with are refused with a reason.

### Hands

Tick **Hands (webcam)** in the panel and allow the camera. Your hand moves through the tank like the pointer: an open hand lets each fish react in its own way, and a fist scatters them. The camera picture is flipped like a mirror and spread across the part of the tank on screen.

Hand tracking uses Google's MediaPipe hand landmarker. Its model file is kept in `public/mediapipe/`, and its runtime is copied there from the installed package by `npm install`, so it works without an internet connection.

### Visual modes

Choose **Visuals** in the panel, or add `?visuals=name` to the address: `classic` (the default), `natural` or `paper`. Natural fish bend as they swim using the travelling body wave from studies of real fish (`src/render/swimming.ts`). Press **H** to hide the panel.

### Real fish

The **Real fish** section of the panel sets the tank to **Real species only** or **Made-up**, limits a real tank to a **Biome**, and adds a **Species**: a school or a lone fish, sized, coloured and swimming from the facts in its file. A real tank refuses made-up fish and species from other places, saying why. The species are in `assets/fish/`, one JSON file each, sourced from FishBase; adding a file adds a species. Try the `pacific` and `river` scenes.

### Formations

**Make a formation** turns the selected fish into a group of copies that share one equation, sized by **Formation size**. Each fish knows its place as `i` and the group's size as `n`, so one equation can spread them out: `x = cx + 0.3 * cos(t + 2 * pi * i / n)`, `y = cy + 0.3 * sin(t + 2 * pi * i / n)` makes a turning ring. Editing the equation of any member changes it for all of them. The `whirlpool` scene is one formation of 48 fish.

### Scenes

Add `?scene=name` to the address, or use the Scene list in the panel, to open a fixed tank that is the same every time: `mixed` (the default), `paths`, `temperaments`, `drift`, `school`, `pacific` and `river` (real species), `whirlpool` (one formation of 48 fish), `shoal` (500 fish in a tank wider than the screen) or `field` (700 fish in one school, filling the screen). They are for judging by eye how a change looks and feels.

### Your own equations

Choose **Your own equation** as the motion, or press **Edit as equation** to start from the selected fish's current path. Type x(t) and y(t) in [math.js](https://mathjs.org/) syntax using:

- `t`: time in seconds
- `W`: tank width (the tank is 1 tall)
- `cx`, `cy`: the tank centre
- `a`, `b`, `c`: sliders you can change while the fish swims
- `i`, `n`: in a formation, this fish's place counting from 0, and how many fish there are. A fish on its own is 0 of 1.
- functions such as `sin`, `cos`, `abs`, `sqrt`, `exp`, `pi`

For example, `x = cx + 0.4 * sin(a * t / 2)` and `y = cy + 0.2 * sin(b * t) * cos(c * t)`. A typed path that leaves the tank wraps around to the other side. Equations are checked before the fish uses them, and an error message says what is wrong. Functions that could change math.js itself (`import`, `evaluate` and similar) are switched off.

## Deploying

`npm run build` produces static files with relative paths, so `dist/` can be hosted at a subdomain root or under a subpath of a larger site.
