# Equation Aquarium

A digital aquarium where every fish swims along a mathematical equation. Pick a fish, give it a sine wave, a Lissajous figure or a circle, and change its parameters while it swims.

The project is a way to learn 3D and immersive technology step by step: 2D in the browser, then 3D, then an external monitor, then a projector, and later webcam or depth-camera control.

## Run it

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
| Sine wave | x(t) = x₀ + v·t, y(t) = y₀ + A·sin(ωt + φ) |
| Lissajous | x(t) = cₓ + A·sin(a·s + δ), y(t) = c_y + B·sin(b·s), s = speed·t |
| Circle | x(t) = cₓ + R·cos(ωt), y(t) = c_y + R·sin(ωt) |

Each fish faces along its velocity, the numerical derivative of its path.

## Deploying

`npm run build` produces static files with relative paths, so `dist/` can be hosted at a subdomain root or under a subpath of a larger site.
