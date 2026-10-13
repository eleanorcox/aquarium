# Ideas

Every idea so far, grouped by strand. Each has the smallest version worth building, what it needs, and what is unknown.

Sizes are rough guesses for the smallest version only: **S** is a few days, **M** is a week or two, **L** is a month or more.

## Summary

| Idea | Strand | Size | Needs a server | Needs hardware |
| --- | --- | --- | --- | --- |
| More built-in paths and typed equations | 1 | done | no | no |
| 3D paths | 1 | M | no | no |
| Describe a motion in words | 2 | M | yes, small | no |
| Formations (one description, many fish) | 2 | M | no | no |
| Fish respond to a pointer | 3 | S | no | no |
| Flocking | 3 | S | no | no |
| Curious and shy fish | 3 | S | no | no |
| Drift (wandering off the route a little) | 3 | S | no | no |
| Webcam hand gestures | 3 | M | no | laptop webcam |
| Projection | 3 | S | no | projector |
| Body tracking in front of a projection | 3 | L | no | camera or depth sensor |
| Add a fish by QR code | 3 | L | yes | no |
| Colour in a paper fish and scan it | 3 | L | yes, shared with QR | camera, printer |
| Save and share an aquarium | all | S, then L | no, then yes | no |
| Any screen size (phone to wall, few fish to hundreds) | all | M | no | no |
| Phone viewing mode | all | S | no | no |
| Illustrated fish | all | M | no | scanner or phone camera |
| Generative fish and water | all | M | no | no |
| Research into real fish motion | real fish | S | no | no |
| Natural swimming (body motion) | real fish | M | no | no |
| Species catalogue | real fish | M, grows with artwork | no | no |
| Schools and loners | real fish | S after flocking | no | no |
| Biomes | real fish | S after catalogue | no | no |
| Discovering new species | all | M | no | no |
| Beyond fish (rays, whales, seals) | real fish | L | no | no |

## Strand 1: equation aquarium

### 3D paths

Add z(t), so a fish can swim a helix or a knot, and draw the tank with depth.

- **Smallest version:** a Three.js renderer beside the Canvas 2D one, drawing today's 2D fish in a 3D box, then a third typed equation for z.
- **Needs:** the core's positions to become 3D (see [Architecture](architecture.md)).
- **Unknown:** how 3D fits the interactive strand. A projection on a wall and a hand in front of a webcam are both flat inputs. See [open questions](open-questions.md).

## Strand 2: beyond equations

### Describe a motion in words

Type "a slow figure of eight that speeds up at the edges" and the fish does it.

- **Smallest version:** a text box. The description goes to Claude, which replies with x(t) and y(t) in the math.js syntax the aquarium already accepts, plus starting values for the `a`, `b`, `c` sliders. The reply goes through the existing equation check, so a bad answer is rejected with a message the same way a typo is.
- **Needs:** a very small server function to hold the API key, because the site is otherwise static files. This is the first thing in the project that is not purely front-end.
- **Unknown:** how often the equations match what the person meant. Worth testing with twenty or so descriptions before building any interface.

### Formations

"Like a tornado" describes a group, not one fish. One fish on a helix does not read as a tornado; thirty fish on the same helix at different heights and phases does.

- **Smallest version:** one equation shared by a group, with each fish given its own index `i` and count `n` as variables, so `phase = 2 * pi * i / n` spreads them out. Useful by hand even without a language model.
- **Needs:** the idea of a group of fish in the core.
- **Why it matters:** this is what makes strand 2 look impressive, and it also gives the exhibition a way to fill a tank quickly.

## Strand 3: immersive and interactive

### Fish respond to a pointer

Fish follow the mouse, or scatter from it, then return to their routes.

- **Smallest version:** mouse only, two behaviours (attract and scatter), a slider for how strongly fish hold to their route.
- **Needs:** the biggest change to the core, described in [Architecture](architecture.md): fish that can be pushed off their path. Everything else in this strand builds on it.

### Drift

A fish swimming along a line does not hold it perfectly. It wanders a little above and below, irregularly, and comes back.

- **Not the same as the sine path:** a sine wave is a regular, repeating route. Drift is small, uneven and never quite repeats, laid on top of whatever the route is.
- **Not quite covered by steering alone:** steering lets a fish be *pushed* off its route. With nothing pushing, it would still follow the route exactly. Drift is the fish pushing itself: a gentle, slowly changing nudge added to its steering, alongside hands and the school.
- **Smallest version:** one number per fish for how much it drifts, with its starting value from the species. Zero gives the exact route, which equation mode keeps.
- **Why it is worth having:** ten fish on the same route stop looking like copies of each other, and routes look swum instead of drawn.
- **Must stay repeatable:** the wandering comes from the tank's own seeded randomness, so the same tank still plays back identically.

### Curious and shy fish

Not every fish reacts to a hand the same way. A curious fish comes over to look; a shy one scatters.

- **Smallest version:** one number per fish, from shy to curious, with its starting value taken from the species. A hand is then just a presence, and each fish decides what to do about it.
- **Makes the tank feel alive:** a mixed tank reacts in a mixed way, with some fish gathering round a hand while others keep their distance. A sudden fast movement can still startle everything, curious or not.
- **Changes an earlier idea:** attract and scatter were going to be two kinds of pointer. They become two ends of a fish's temperament, with gestures able to override it (see [Architecture](architecture.md)).
- **Unknown:** whether curiosity should wear off, so a fish that has inspected a hand loses interest and goes back to its route.

### Flocking

Fish school together: keep apart from close neighbours, match their direction, drift towards the group. The classic "boids" rules.

- **Smallest version:** a per-fish switch for whether it schools, and three sliders for the three rules.
- **Needs:** the same change as the pointer idea.
- **Unknown:** how flocking and routes combine. A school could follow one shared route, or flocking could be a mode with routes off.

### Webcam hand gestures

The laptop webcam tracks hands; a hand works like the pointer above. This is Swish Fish on a laptop.

- **Smallest version:** an open hand attracts, a fist scatters. Hand tracking runs in the browser with MediaPipe's hand landmark model, so there is no server and the video never leaves the laptop.
- **Needs:** the pointer behaviour to exist first.
- **Unknown:** how it feels with the usual webcam lag, and which gestures people find without being told.

### Projection

The aquarium fills a wall, floor or table through a projector.

- **Smallest version:** a full-screen view with no controls, on a projector plugged in as a second screen. A second browser window on the laptop keeps the controls.
- **Then:** corner-pin correction, so the picture can be squared up when the projector is at an angle; a dark background tuned for projection, since a projector cannot project black.
- **Before buying anything:** a projection view can be built and judged on a monitor or television: full screen, dark room, viewed from across the room. The aim of that work is a written list of what the projector must do (brightness, resolution, how close to the surface it sits), so the right one is bought once.
- **Unknown:** wall, floor or table. This choice changes the camera position, the fish's point of view (side-on for a wall, top-down for a floor) and the artwork.

### Body tracking in front of a projection

People walk in front of the projected tank and the fish follow or scatter.

- **Smallest version:** an ordinary webcam and motion detection (where did the picture change between frames), turned into pointer-style points. No skeletons.
- **Better version:** a depth sensor such as an Intel RealSense, Orbbec or Luxonis OAK-D. Depth sensors see in infrared, so the projected picture does not confuse them, which is the main weakness of a plain webcam here. They do not connect to a browser directly; a small program on the same computer reads the sensor and passes points to the page.
- **Needs:** calibration between what the camera sees and where the projection lands, so a person standing at the left edge affects fish at the left edge.
- **Unknown:** almost everything about the hardware, which is the point of trying it. The only camera to hand is the laptop's built-in webcam, which can test motion detection by facing the room, but cannot be placed apart from the screen. A separate webcam is the first likely purchase, a depth sensor the second, and neither until the software has shown what is needed.

### Add a fish by QR code

A visitor scans a code on the wall, designs a fish on their phone and sees it swim into the big tank.

- **Smallest version:** pick from fixed lists (body shape, colour, swimming motion), press a button, the fish appears. No drawing, no account.
- **Then:** colouring the fish in on the phone with a finger.
- **Needs:** a server that passes messages from phones to the tank in real time. This is the largest single piece of new infrastructure in the project.
- **Unknown, and important:** free drawing in public needs moderation, because someone will draw something rude. Fixed lists avoid this entirely, which is another reason to start there. Also: how many fish before the tank is full, and what happens to old ones.

### Colour in a paper fish and scan it

A printed sheet with a fish outline; colour it with pens, hold it under a camera, and it appears in the tank with your colouring.

- **Smallest version:** a sheet with markers printed in the corners. A fixed camera photographs it, the markers are used to flatten the photo, the fish outline is cut out, and the result becomes that fish's skin.
- **Prior art:** teamLab's *Sketch Aquarium* does exactly this, and is worth studying for how they stage it.
- **Needs:** the same route into the tank as the QR fish, and the same fish artwork format as the illustrated fish below. The scanning station is a second small app.
- **Unknown:** lighting. Scans under exhibition lighting will vary far more than scans on a desk.

## Real fish

Added 13 October 2026. The fish are based on real species, not invented ones, and move the way those species move. This cuts across all three strands: it gives strand 1 more interesting equations, and gives the exhibition fish people recognise.

### Real fish and made-up fish

A tank is set to one of two kinds, so the two ideas of what a fish is do not have to be reconciled.

- **Real:** species from the catalogue, at their real relative sizes, swimming and schooling as that species does, optionally limited to one biome.
- **Made-up:** anything goes. Generated fish, visitors' coloured-in fish, any colour, any size, any equation for a route. A real species can be dropped in and put on a heart-shaped path.
- **Smallest version:** a setting on the tank that decides which fish can be added and whether their species' habits are enforced. The fish, the steering and the drawing code are the same in both.
- **How the strands map on:** equation mode and paper-coloured fish are naturally made-up; a biome tank is naturally real. The exhibition could be either.

### Two kinds of motion

"How a fish moves" means two different things, and they are separate pieces of work:

- **The route:** where the fish goes around the tank. This is what the equations describe today.
- **The swimming:** how the body bends to get there. Tail beat, body wave, fins. Nothing does this yet; today's fish are rigid shapes.

Real-fish research feeds both, but mostly the second.

### Research into real fish motion

Find out what equations and data exist before designing anything.

- **Known starting points** (from memory, to be checked against sources):
  - Biologists sort swimming into named styles by how much of the body bends: eels bend along their whole length (anguilliform), trout and mackerel mostly the back half (subcarangiform, carangiform), tuna almost only the tail (thunniform), boxfish just wag the tail fin (ostraciiform). Rays and wrasse swim with their fins instead (rajiform, labriform).
  - The body wave has a standard equation, from Lighthill's work and used widely in robotic fish: a wave travelling from head to tail whose size grows towards the tail, roughly `y(s, t) = (c1·s + c2·s²)·sin(k·s − ω·t)`, with `s` the distance along the body. Different `c1`, `c2` and `k` give the different styles above.
  - Tail-beat frequency rises with speed, and efficient swimmers keep the Strouhal number (tail-beat frequency × tail sweep ÷ speed) at about 0.2 to 0.4. That one rule ties the swimming to the route: a faster fish beats its tail faster by a known amount.
  - Many fish do not swim steadily but burst and glide.
  - Schooling has its own models: Reynolds's boids, and Couzin's zones model, where a fish avoids neighbours that are very close, lines up with those at middle distance and moves towards those further away.
- **Not yet known:** whether there are open motion-capture or tracking datasets of real fish paths that could be replayed or learned from. Needs a proper search.
- **Smallest version:** a short written survey in this folder, with sources, ending in a list of what is usable.

### Natural swimming (body motion)

Each fish's body bends as it swims, in the style of its species, at a rate set by its speed.

- **Smallest version:** the body-wave equation applied to a fish picture, with three presets (eel, trout, tuna) and tail beat tied to speed.
- **Fits strand 1:** the body wave is another equation a user can see and change. A fish then has an equation for where it goes and one for how it swims.
- **Needs:** fish drawn in a way that can bend, which is the same requirement as the illustrated fish below.
- **A problem to solve:** a fish bends side to side. Seen from the side, as our fish are, that bend is towards and away from the viewer, so the true wave is hardly visible; from above it is fully visible. Side-on, the choice is between an honest look (the tail narrows and widens as it swings) and a stylised one (the body visibly ripples, as in most 2D games). Whales and dolphins are the reverse: they bend up and down, which shows properly from the side. This needs trying by eye in stage 3.

### Species catalogue

A list of real species, each with the facts that drive how it looks and behaves.

- **Per species:** common and scientific name, real length, body shape, swimming style, cruising speed, whether it schools and in what numbers, how deep it swims, where it lives.
- **Smallest version:** about six species chosen to be as different as possible, for example sardine (small, large schools), tuna (large, fast, small groups), an eel (whole-body swimmer), a ray (fin swimmer), a pike (lone ambusher that hangs still then darts), a perch.
- **Source:** FishBase is the standard open database for sizes and habitats.
- **Cost to be aware of:** every species needs artwork. The catalogue grows at the speed drawings can be made, so the data should be the easy part.
- **Unknown:** scale. A sardine is about 20 cm and a tuna can pass 2 m; at true scale either the sardine is a dot or the tuna fills the tank. Likely answer is a compressed scale that keeps the order but shrinks the range, with true scale as an option.
- **Helps the exhibition:** a visitor choosing "a mackerel" from a list is a fixed choice with no moderation problem, and more interesting than "body type 3".

### Schools and loners

Some species swim alone, some in pairs or small groups, some in hundreds.

- **Smallest version:** adding a schooling species adds a school, with flocking settings taken from the species.
- **Needs:** flocking, and the group idea from formations.
- **Possible later rule:** predators and prey, where sardines bunch and scatter when a tuna comes close. In code a predator is just another thing fish avoid, the same as a hand.
- **Unknown:** how many fish can be drawn smoothly. A convincing sardine school is hundreds of fish, far beyond the handful in the tank today. See "Any screen size" below.

### Biomes

A tank has a setting such as "Pacific saltwater" or "British freshwater lake", and only species from that place can be added. The rule can be switched off to mix anything with anything.

- **Smallest version:** a biome is a named filter on the catalogue, plus a background and water colour. One switch turns the filter off.
- **Later rules a biome could carry:** depth bands (which species keep to the surface, midwater or bottom), day and night, plants and rocks.
- **Needs:** the catalogue first; it is small once that exists.

### Beyond fish

Manta rays, whales, seals and other sea animals, eventually. Fish first.

- **What it changes:** the catalogue is of species, not of fish, and nothing in the code should assume a fish. Worth getting the naming right from the start even though only fish are built at first.
- **What each needs that fish do not:**
  - *Rays* swim by flapping their fins and are poorly shown side-on.
  - *Whales, dolphins and seals* bend up and down, not side to side, and come to the surface to breathe, so their routes have a rule fish routes do not.
  - *Size.* A large whale is over a hundred times the length of a sardine, which stretches the tank-size and scale questions much further.
- **Smallest version, when the time comes:** one animal that is not a fish, probably a manta ray or a dolphin, to find out what breaks.

## Across all strands

### Discovering new species

In a personal aquarium, on a phone or saved, you make your own fish, and now and then you also come across a species you have not seen before and can add it.

- **Smallest version:** a collection saved with your aquarium. Occasionally a visitor swims through the tank; tap it to add the species to your collection, after which you can add it to the tank whenever you like.
- **Echoes the inspiration:** this is close to how Animal Crossing fills its museum, and gives a reason to come back.
- **Ways a discovery could be triggered** (suggestions, none decided): time spent watching; time of day; which biome the tank is; rarity, so some species turn up seldom; visiting an exhibition and scanning its code.
- **Needs:** saved tanks, and enough species in the catalogue for there to be something to find. With six species there is nothing to discover, so this follows the catalogue's growth.
- **Unknown:** whether discovery is only for real species or also for made-up ones.

### Save and share an aquarium

- **Smallest version:** the whole tank written into the page's web address, so a link *is* the aquarium. No accounts, no server. Also remembered in the browser between visits.
- **Later:** accounts and aquariums stored on a server, if links turn out not to be enough.

### Any screen size

The same aquarium on a phone, a laptop and a wall: a few fish on the phone, hundreds on the wall.

- **How:** a tank has its own size, and each screen is a window onto it, zoomed so fish are a comfortable size. A wall shows all of a big tank. A phone shows part of it and can move around. The full design is in [Architecture](architecture.md#tank-size-and-screen-size-are-separate-things).
- **Smallest version:** a tank with a fixed size, shown whole on a laptop whatever the window shape, with drag to pan and scroll to zoom. Then a test tank of 500 fish to find where drawing and simulation slow down.
- **Needs:** nothing first, and nearly everything else needs it. It replaces the current link between tank width and screen shape, so it is cheapest to do early.
- **Unknown:** how many fish a phone and a laptop can each handle; how large a tank should be for each use.

### Phone viewing mode

Open your aquarium on your phone and just watch.

- **Smallest version:** a layout with no panel that works in portrait, opened from a saved link. A small tank fits whole; a large one is watched by following a fish or dragging around.
- **Needs:** any screen size, above.

### Illustrated fish

Eleanor draws fish on paper; they are digitised and swim.

- **Smallest version:** one drawing, scanned, background removed, bent along its length as it swims so the tail moves. One picture per fish, no separate parts.
- **Then:** separate tail and fins, a few body types, colour that can be changed.
- **Worth noticing:** this is the same process as the colouring sheet, where the "illustration" comes from a visitor. Build it once for both.

### Generative fish and water

Fish and tank drawn by code, so every fish is different.

- **Smallest version:** fish built from a handful of numbers (body length, depth, tail shape, pattern, colours), so a fish can be saved or sent as a few numbers. Light rippling on the tank floor, particles drifting in the water.
- **Not either/or:** illustrated bodies with generated colour and pattern is a likely end point.
