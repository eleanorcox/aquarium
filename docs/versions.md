# Version log

A record of each version of the aquarium: what it could do, how interacting with it differed from the version before, and the screencast that shows it. It exists to keep track of progress and to draw on later when writing about the work.

The [decision log](decisions.md) says why things were built the way they were. This log says what each version was like to use.

## How this log works

- **A version is a point worth showing**, usually the end of a roadmap stage. Not every commit.
- **Each version has a git tag** (`v1`, `v2`, ...) on the commit it was recorded from, so that exact version can be run again with `git checkout v2`.
- **Each version has a screencast**, recorded by Eleanor. The videos are too large for the repository (28 MB and 74 MB so far), so they are kept outside it in `~/Videos/Screencasts/` and listed here by file name.
- **Entries are not rewritten** once the next version exists, apart from fixing mistakes.
- Newest at the bottom.

Template:

```markdown
## vN: short name

- **Date:**
- **Tag and commit:**
- **Screencast:**
- **Roadmap stage:**
- **What it does:**
- **What changed in how it feels to use:**
- **Rough edges at the time:**
```

## Index

| Version | Name | Date | Stage | Screencast |
| --- | --- | --- | --- | --- |
| [v1](#v1-basic-motion) | Basic motion | 9 Oct 2026 | Before stage 1 | `Equatium v1 - basic motion.webm` |
| [v2](#v2-schooling-drift-curiosity) | Schooling, drift, curiosity | 13 Oct 2026 | Stage 1 | `Equatium v2 - schooling, drift, curiosity.webm` |

---

## v1: basic motion

- **Date:** code as of 9 October 2026; screencast recorded 13 October 2026
- **Tag and commit:** `v1`, commit `6eafa8f`
- **Screencast:** `~/Videos/Screencasts/Equatium v1 - basic motion.webm` (28 MB)
- **Roadmap stage:** before stage 1. This is the equation aquarium the planning started from.
- **What it does:**
  - Five fish in a 2D tank, each following an equation, drawn as simple glowing shapes with trails.
  - Ten built-in paths: sine wave, zigzag, bounce, circle, Lissajous figure, figure eight, rose curve, spirograph, breathing spiral and heart.
  - Sliders for each path's parameters, changing the path while the fish swims.
  - Typed equations: write your own x(t) and y(t), or turn a built-in path into equations and edit it.
- **What it feels like to use:** an instrument panel. You choose a fish, change numbers and watch its path change. The fish take no notice of you; the pointer only selects them. Every fish is exactly on its path at every moment, so two fish given the same path are identical.
- **Rough edges at the time:** the tank changes shape with the window. Fish cannot be removed.

## v2: schooling, drift, curiosity

- **Date:** 13 October 2026
- **Tag and commit:** `v2`, commit `d53284c`, on the `stage-1-pushable-fish` branch
- **Screencast:** `~/Videos/Screencasts/Equatium v2 - schooling, drift, curiosity.webm` (74 MB)
- **Roadmap stage:** stage 1, fish that can be pushed
- **What it does**, beyond v1:
  - Fish react to the pointer. Shy fish scatter from it, curious fish come towards it and stop short, and all of them swim back to their routes afterwards.
  - A fast sweep of the pointer startles every fish. The pointer can also be set to attract all, scatter all, or do nothing.
  - Drift: fish wander a little either side of their routes, each in its own way.
  - Schooling: fish set to school keep apart, swim the same way and stay together. Seven fish share one figure-of-eight route and form a school around it.
  - Each fish has four behaviour settings in the panel: how hard it holds its route, shy to curious, drift, and whether it schools.
  - Fish can be removed.
- **What changed in how it feels to use:** the fish notice you. In v1 the pointer was a tool for choosing a fish; in v2 it is a presence in the water, and different fish respond to it differently. The tank also stopped looking mechanical: with drift and schooling, fish on the same route are no longer copies of one another, and a group moves as a group.
- **What stayed the same:** the look, the ten paths, typed equations, and the 2D tank shaped by the window. A fish left alone with no drift is still exactly on its equation.
- **Rough edges at the time:**
  - The strengths of every effect are first guesses, not yet tuned by eye.
  - A fish cannot swim freely with no route. Wanted eventually, particularly for projection, and put off for now.
  - Schooling is only practical for tens of fish.
  - All schooling fish school together, as there are no species yet.
