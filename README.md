# Equation Aquarium

A digital aquarium where every fish swims along a mathematical equation. Pick a fish, give it a sine wave, a Lissajous figure or a circle, and change its parameters while it swims.

The project is a way to learn 3D and immersive technology step by step: 2D in the browser, then 3D, then an external monitor, then a projector, and later webcam or depth-camera control.

## Run it

Needs Node.js 22.12 or newer (`.nvmrc` pins 24; with nvm, run `nvm install` then `nvm use`).

```sh
npm install
npm run dev      # local dev server
npm test         # unit tests for the simulation core
npm run build    # type-check and build static files into dist/
```

## How it is built

The simulation never knows how it is drawn.

- `src/core/` is the simulation: fish, motion equations and the tank. Plain TypeScript with no DOM, advanced on a fixed 1/60 s timestep so paths are identical on any screen.
- `src/render/` holds renderers that only read the tank. Today that is Canvas 2D; a Three.js renderer comes next.
- `src/ui/` holds inputs that only change the tank through its methods. Today that is a lil-gui panel; camera input comes later.

Positions are in tank units: the tank is 1 unit tall and as wide as the screen's aspect ratio.

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

Each fish faces along its velocity, the numerical derivative of its path. y points down, as on screen.

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
