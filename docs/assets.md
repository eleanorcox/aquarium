# Assets wanted

Things that would help and that someone else can make: Eleanor by hand, or another agent. Each section is written so it can be handed over as a brief on its own.

Nothing here is needed before stage 1 of the [roadmap](roadmap.md). The fish pictures are needed for stage 3.

Put finished files in an `assets/` folder at the top of the repo, laid out as shown in each section.

## 1. Fish pictures

One picture per species. The code bends the picture along its length to make the fish swim, so the fish must be drawn straight and still.

**Format**

- PNG with a real transparent background (an alpha channel). Image generators often paint a grey checkerboard instead of true transparency; that is not usable.
- 2048 pixels wide. Height as needed for the fish.
- The fish fills the width, with a margin of about 4% on every side so nothing is cut off.

**Pose**

- Exactly side-on, as in a field-guide plate.
- Facing right. The code flips it for swimming left.
- Body straight and horizontal, from nose to tail along the middle of the picture. Not curved, not mid-turn.
- Tail fin fully spread and upright. Other fins in a relaxed, neutral position, all visible.
- Mouth closed.

**Look**

- The fish only: no water, bubbles, shadow, ground, border or text.
- Even, soft lighting from above. No strong highlights or cast shadows, because they would look wrong once the fish flips and bends.
- Clean edges against the transparency, with no pale or dark halo.
- One style across the whole set. Until the art style is decided (see [open-questions.md](open-questions.md)), aim for a clear natural-history illustration: accurate shape and markings, flat enough to read at small size.
- Accurate to the species. Check fin count, fin position and markings against a reference photograph; generated fish often gain or lose fins.

**Naming**

`assets/fish/<common-name-in-lowercase-with-hyphens>.png`, for example `assets/fish/northern-pike.png`.

**First batch**

Six species, three for each biome named so far, chosen to be as different in shape as possible. Lengths are rough and are only here to show the range.

| File | Species | Scientific name | Biome | Rough adult length | Why this one |
| --- | --- | --- | --- | --- | --- |
| `pacific-sardine.png` | Pacific sardine | *Sardinops sagax* | Pacific saltwater | 20 cm | Small, swims in large schools |
| `yellowfin-tuna.png` | Yellowfin tuna | *Thunnus albacares* | Pacific saltwater | 150 cm | Large and fast; stiff body, tail does the work |
| `moorish-idol.png` | Moorish idol | *Zanclus cornutus* | Pacific saltwater | 20 cm | Tall, flat body with a long trailing fin |
| `northern-pike.png` | Northern pike | *Esox lucius* | British freshwater | 70 cm | Long lone hunter; hangs still, then darts |
| `european-perch.png` | European perch | *Perca fluviatilis* | British freshwater | 25 cm | Deep body, bold stripes, small groups |
| `european-eel.png` | European eel | *Anguilla anguilla* | British freshwater | 70 cm | Whole body bends as it swims |

Rays and flatfish are left out for now because a side-on view does not suit them.

**Not needed yet**

- Top-down views. Only wanted if the projection ends up on a floor or table.
- Separate tail and fin layers. One flat picture per fish is enough to start.
- Animation frames. The code makes the movement.

## 2. Species facts

One small data file per species, so that adding a fish means adding a picture and a file with no new code. Values should come from a named source; [FishBase](https://www.fishbase.se) is the standard one.

`assets/fish/<same-name-as-the-picture>.json`:

```json
{
  "commonName": "Northern pike",
  "scientificName": "Esox lucius",
  "lengthCm": { "typical": 70, "max": 150 },
  "water": "fresh",
  "regions": ["British freshwater"],
  "depth": "midwater",
  "swimmingStyle": "subcarangiform",
  "cruiseSpeedBodyLengthsPerSecond": 1,
  "behaviour": "Hangs still among plants, then darts at prey.",
  "groupSize": { "min": 1, "max": 1 },
  "sources": ["https://www.fishbase.se/summary/Esox-lucius.html"]
}
```

- `depth` is one of `surface`, `midwater`, `bottom`.
- `swimmingStyle` is one of `anguilliform`, `subcarangiform`, `carangiform`, `thunniform`, `ostraciiform`, `labriform`, `rajiform`.
- `groupSize` is how many usually swim together: 1 for a loner, hundreds for a schooling fish.
- The example's numbers are placeholders showing the shape of the file, not checked facts.
- Leave out any value that cannot be sourced; do not guess.

The field names may change once the code that reads them exists.

## 3. Research survey

A written survey of what is known about how real fish move, for [the real-fish ideas](ideas.md#real-fish). Saved as `docs/research/fish-motion.md`, with a link for every claim.

Questions to answer:

1. What equations describe the body wave of a swimming fish, and what values suit each swimming style?
2. How do tail-beat frequency and size of tail sweep relate to speed?
3. Which fish swim steadily and which burst and glide, and how is that modelled?
4. What are the main models of schooling, and what settings give a tight ball, a stream or a loose group?
5. Are there open datasets of real fish tracks or motion capture? For each: what species, 2D or 3D, how many fish, what licence, and how to download it.
6. Has anyone published how real fish move around a tank, as opposed to open water?

It should end with a short list of what is usable in this project and what is not.

## 4. Backgrounds (later)

Not needed until a biome exists. Noted so the fish style can be chosen with them in mind.

- One set per biome, in three separate layers so nearer layers can drift against farther ones: far water, middle distance (rocks, weed), near (plants at the edges). Middle and near layers are PNGs with transparency.
- 3840 by 2160 pixels, able to repeat left to right without a visible seam. Backgrounds are sized to the tank, not the screen, so a large tank repeats or stretches them and a phone scrolls across them.
- Dark and low in contrast behind where fish swim. A projector cannot project black, so dark artwork holds up best.
