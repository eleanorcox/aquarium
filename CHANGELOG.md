# Changelog

What changed in each version of Equatium, as short lists. For what each version was like to use, and its screencast, see the [version log](docs/versions.md).

Versions are numbered v1, v2 and so on, each with a git tag of the same name. Newest first.

## Unreleased

### Added

- Free swimming: a new Motion, "Free swimming (no route)". The fish keeps its own cruising speed and heading, wanders if it drifts, swims mostly level, turns away from the tank's edges and keeps to its depth range. Pushed fish carry on from where they end up instead of returning. Free fish school together, and a fish switched to or from free swimming carries on from where it is. Choose All fish to set every fish free at once.
- A Free swimming scene (`?scene=free`): two schools and three loners, none on a route.
- A Colour schools scene (`?scene=colours`): 320 fish in eight schools, each its own colour, circling apart. Knock fish out of a school with the pointer or a hand and they head for the nearest other school, keeping their colour, so the schools gradually become rainbows. Left alone, no fish changes school.
- Pushed-out fish, in the Tank section: knocked-out fish either swim home to their own school or join the nearest other school.
- Each real species schools only with its own kind, so a sardine school no longer merges with passing tuna.

- All fish, at the top of the Fish list: Motion and the Behaviour settings then change every fish at once. Only the setting moved is changed, so each fish keeps its others.

- Phone layout: on a narrow screen the controls start hidden behind a Show controls button, and take the full width when shown. Any link with `?watch` also opens with the controls hidden, for just watching.
- Real fish: six species from FishBase (Pacific sardine, yellowfin tuna, Moorish idol, northern pike, European perch, European eel), each sized, coloured, swimming and schooling from its facts. A Real fish section in the panel sets the tank to real species only or made-up, limits it to a biome, and adds species. Pacific and British river scenes.
- Formations: Make a formation turns the selected fish into a group sharing one equation, in which each fish knows its place as `i` of `n`. Editing any member's equation changes them all. A Whirlpool scene is one formation of 48 fish.
- A field of fish scene (`?scene=field`): 700 small fish in one school streaming past, filling the screen so you are in the middle of it.
- Visual modes, chosen from Visuals in the panel or with `?visuals=name`: Classic (the original look), Natural (fish that bend as they swim, eel-like to tuna-like, in sunlit water) and Paper (ink fish on squared paper).
- Press H to hide the panel and equation, for watching or recording the tank on its own.
- Movement (webcam), in the panel: the webcam watches the room and anything moving, such as people walking past a projection, disturbs the fish nearby. Each moving area shows in the tank as a yellow disc labelled movement. Ignores the whole picture getting lighter or darker, as from a flickering projector.
- Display window for a projector: **Open display window** in the Projector section opens a window with only the tank, to drag onto the projector's screen. Click it for full screen, press C to adjust its corners and R to reset them. The laptop window keeps the controls and runs the tank.
- Corner correction, in the panel's Projector section: drag the four corners of the picture to square it up on a surface a projector hits at an angle. Remembered in this browser.
- Copy link to this tank, in the panel: the address then holds the whole tank, and opening it shows the same fish on the same routes. Broken or tampered links are refused with a reason.
- Hand feedback: the webcam preview shows the tracked points of each hand, each hand appears in the tank as a coloured disc labelled open hand or fist, and the panel says what the camera sees or what went wrong.
- Hands (webcam) in the panel: an open hand moves through the fish like the pointer, letting each fish decide, and a fist scatters them. Two hands work at once. A small mirrored preview shows what the camera sees. Works offline.

- Fixed scenes: six named tanks that are the same every time, chosen from a Scene list in the panel or with `?scene=name` in the address.
- A tank can be bigger than the screen. Drag to move around it, zoom with the wheel or a pinch, or tick Follow selected fish.
- A scene of 500 small fish in five schools.
- A Speed section in the panel showing how many fish are on screen and the time spent stepping and drawing each frame.

### Fixed

- The page stayed blank in the built site after the display window was added, because of how the maths library loaded. Both windows' code now loads at start-up.

### Changed

- The hand-tracking library loads only when hands are switched on, so the page starts faster.
- Natural mode's swimming uses published measurements of real fish: the head moves a little, eels carry more than one wave along their bodies and tuna less than one.
- Schooling fish follow their three nearest schoolmates, as real fish do, instead of everyone in sight.
- The tank keeps its own shape, 16:9 by default, instead of taking the shape of the window. A window of another shape shows a dark margin.
- Small fish school more tightly and drift less, in proportion to their size.
- The pointer's reach is set in pixels and feels the same at any zoom.
- Scenes with schools start with the school already spread out.
- Schooling is about three times faster.
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
