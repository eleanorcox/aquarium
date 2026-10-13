# Changelog

What changed in each version of Equatium, as short lists. For what each version was like to use, and its screencast, see the [version log](docs/versions.md).

Versions are numbered v1, v2 and so on, each with a git tag of the same name. Newest first.

## Unreleased

### Added

- Fixed scenes: five named tanks that are the same every time, chosen from a Scene list in the panel or with `?scene=name` in the address.

### Changed

- The project is called Equatium, as a working name, in the page title, panel, README and package name. It was "Equation Aquarium".

## v2: schooling, drift, curiosity (13 October 2026)

### Added

- Fish react to the pointer and swim back to their routes afterwards.
- Temperament, from shy to curious, for each fish: shy fish flee the pointer, curious fish approach and stop short of it.
- A fast sweep of the pointer startles every fish.
- Pointer settings: each fish decides, attract all, scatter all, off; and how far the pointer reaches.
- Drift: fish wander a little either side of their routes.
- Schooling: schooling fish keep apart, swim the same way and stay together, with a strength slider for each rule.
- A setting for how hard each fish holds its route.
- A Behaviour section in the panel for the selected fish, and a Tank section for the pointer and schooling.
- A Remove fish button.
- A faint ring showing the pointer's reach.
- A school of seven fish sharing one route in the starting tank.

### Changed

- The starting fish have a mix of temperaments and a little drift.
- A fish faces the way it is actually moving, including when pushed, not only along its route.
- The starting tank is the same on every load. Start positions and sizes were random before.
- Fish keep their ids when other fish are removed.
- A finger dragged across the tank on a touch screen moves the fish instead of scrolling the page.

### Behind the scenes

- Tests and the type check run automatically on every push.
- 44 new tests, 74 in all.

## v1: basic motion (9 October 2026)

### Added

- A 2D tank of fish that each follow an equation, with trails.
- Ten built-in paths: sine wave, zigzag, bounce, circle, Lissajous figure, figure eight, rose curve, spirograph, breathing spiral and heart.
- Sliders for each path's parameters.
- Typed equations for x(t) and y(t), with three live sliders, and a button to turn a built-in path into editable equations.
- Add fish, trails on or off, pause.
