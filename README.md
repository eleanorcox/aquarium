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

### Hands

Tick **Hands (webcam)** in the panel and allow the camera. Your hand moves through the tank like the pointer: an open hand lets each fish react in its own way, and a fist scatters them. The camera picture is flipped like a mirror and spread across the part of the tank on screen.

Hand tracking uses Google's MediaPipe hand landmarker. Its model file is kept in `public/mediapipe/`, and its runtime is copied there from the installed package by `npm install`, so it works without an internet connection.

### Visual modes

Choose **Visuals** in the panel, or add `?visuals=name` to the address: `classic` (the default), `natural` or `paper`. Natural fish bend as they swim using the travelling body wave from studies of real fish (`src/render/swimming.ts`). Press **H** to hide the panel.

### Scenes

Add `?scene=name` to the address, or use the Scene list in the panel, to open a fixed tank that is the same every time: `mixed` (the default), `paths`, `temperaments`, `drift`, `school` or `shoal` (500 fish in a tank wider than the screen). They are for judging by eye how a change looks and feels.

### Your own equations

Choose **Your own equation** as the motion, or press **Edit as equation** to start from the selected fish's current path. Type x(t) and y(t) in [math.js](https://mathjs.org/) syntax using:

- `t`: time in seconds
- `W`: tank width (the tank is 1 tall)
- `cx`, `cy`: the tank centre
- `a`, `b`, `c`: sliders you can change while the fish swims
- functions such as `sin`, `cos`, `abs`, `sqrt`, `exp`, `pi`

For example, `x = cx + 0.4 * sin(a * t / 2)` and `y = cy + 0.2 * sin(b * t) * cos(c * t)`. A typed path that leaves the tank wraps around to the other side. Equations are checked before the fish uses them, and an error message says what is wrong. Functions that could change math.js itself (`import`, `evaluate` and similar) are switched off.

## Deploying

`npm run build` produces static files with relative paths, so `dist/` can be hosted at a subdomain root or under a subpath of a larger site.
