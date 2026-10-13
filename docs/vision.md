# Vision

## In one sentence

A digital aquarium whose fish move in ways people define, by writing an equation, describing a motion in words, moving their body in front of it, or drawing a fish and releasing it into the tank.

## Where it comes from

- **Swish Fish.** An earlier project of Eleanor's that imagined a large physical aquarium of robotic fish, steered by people moving their hands. The aquarium is the same idea without the robots: the tank is light, and the hands are tracked by a camera.
- **The Animal Crossing: New Horizons aquarium.** The big tank where each fish follows its own fixed route. The pleasure is in watching and working out the paths. This is why the fish here have *paths* at all, instead of wandering at random.

Both matter for design decisions later. Swish Fish says people should be able to push the fish around. Animal Crossing says each fish should still have a route of its own that is worth watching when nobody is pushing.

## Three strands

The project is close to three projects in one.

### 1. Equation aquarium

Each fish swims along an equation you choose or type. This is what exists today: ten built-in motion models, typed x(t) and y(t), live sliders, in 2D. It can grow into 3D.

*Who it is for:* someone sitting at a laptop who likes maths, or is learning it.

### 2. Beyond equations

Describe a motion in words ("make them move in 3D like a tornado") and get fish that do it. A language model writes the equations; the aquarium checks and runs them.

*Who it is for:* someone who knows what they want to see but not how to write it.

### 3. Immersive and interactive

**This is the strand Eleanor cares about most.** The aquarium leaves the laptop screen: projected on a surface, reacting to people's movement through a camera or depth sensor, shown as an exhibition where visitors add their own fish from a phone or a coloured-in sheet of paper. It is also the excuse to try different immersive technologies one at a time.

*Who it is for:* a visitor walking past, with no instructions and about a minute of attention.

## One project, several modes

The working assumption is one codebase with several modes, not three separate apps.

| Mode | Where it runs | What you do |
| --- | --- | --- |
| Equation | Laptop browser | Edit equations and parameters, watch the paths |
| Describe | Laptop browser | Type a description, get a motion |
| Interactive | Projector plus camera | Move, and the fish respond; add fish from a phone or paper |
| Phone | Phone browser | Watch a saved aquarium; design a fish to send to a tank |

The same tank has to work at every size. A wall shows the whole of a large tank with hundreds of fish; a phone shows a few fish at a time and moves around the same water.

The modes share the fish, the tank and the look. They differ in what inputs are switched on and what controls are on screen. [Architecture](architecture.md) covers how.

## Principles

- **Visual first.** It is mainly something to look at. The graphics need a large upgrade, ideally from Eleanor's own illustrations or from generative art, and that work should not wait until the end.
- **Real fish, and made-up ones.** A real tank holds real species, with their real sizes, swimming styles and habits, drawn from what is known about how fish move. It can follow the rules of a real place, such as a British freshwater lake, or mix places. A made-up tank has no rules: invented fish, coloured-in fish, any path.
- **Fish first, then other sea animals.** Manta rays, whales and seals are wanted eventually. Nothing should be built in a way that only works for fish.
- **Every fish has a route.** Interaction bends a fish away from its route; when the interaction stops, the fish goes back.
- **Each technology is a small experiment.** Webcam hands, depth sensing, projection mapping and paper scanning are each tried in the smallest form that teaches something, before being built properly.
- **It works with no hardware.** Every interactive behaviour can be driven by a mouse, so it can be developed and shown on a plain laptop.
