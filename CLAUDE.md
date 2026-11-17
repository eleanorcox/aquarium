# Equatium

Equatium is the working name (not final; it may stop fitting once not every mode is about equations). A digital aquarium whose fish follow equations, respond to people's movement, and can be shown on anything from a phone to a projected wall. TypeScript, Vite, Vitest. The plan lives in [docs/](docs/README.md); read [docs/roadmap.md](docs/roadmap.md) and [docs/architecture.md](docs/architecture.md) before planning or building anything.

How we work, git, writing and subagent rules are shared by all the projects and live in [../CLAUDE.md](../CLAUDE.md). This file adds what is specific to the aquarium.

## Commands

```sh
nvm use            # Node 24, pinned in .nvmrc; older Node fails at startup
npm install        # also copies the hand-tracking runtime into public/mediapipe/wasm
npm run dev        # local dev server
npm test           # all tests, once
npm run speed      # time the simulation; run before and after changing how it steps
npm run typecheck  # type check only
npm run build      # type check, then build into dist/
```

Run `npm test` and `npm run typecheck` before calling anything done. [docs/testing.md](docs/testing.md) lists the first tests for each stage.

## Code rules

- `src/main.ts` only chooses the window: `src/operator.ts` is the app, `src/display/` the projector window that draws frames sent to it.
- `src/core/` is the simulation, and is "the core" in the shared rules. No DOM, no browser APIs, no real clock, no `Math.random` except through the function passed in.
- `src/render/` only reads the tank. `src/ui/` and `src/input/` only change it through its methods. Input adapters take positions in tank units and times in seconds, and never touch the page, so they can be tested.
- The simulation advances on a fixed 1/60 s timestep. The same starting tank and steps must always give the same result.
- Catalogue code says "species", not "fish", where it reasonably can: rays, whales and seals are planned.

## Subagents

Additions to the shared table:

| Work | Agent | Model |
| --- | --- | --- |
| Checking assets against [docs/assets.md](docs/assets.md) | general-purpose | `haiku` |
| Research with sources: the fish-motion survey, species facts | general-purpose | `sonnet` |
| Changes to the simulation in `src/core/` | main session | not delegated |
