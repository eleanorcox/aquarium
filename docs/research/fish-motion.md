# How real fish move: a sourced survey

Written 27 October 2026 for the real-fish ideas in [ideas.md](../ideas.md#real-fish). The questions come from [assets.md, section 3](../assets.md).

**How to read this.** Every claim has a link. "Checked" means I opened the page or PDF and read the number. "Secondary" means the number came from a search summary or from a later paper quoting an older one, and should be checked against the original before it is relied on. "Unsourced" means I found nothing. Where a number comes from my own arithmetic on sourced numbers, it says so.

## Summary

- The body of a swimming fish carries a wave that travels from head to tail and grows in size towards the tail. A **quadratic envelope** (the size of the wave at each point along the body is a constant plus a term in distance plus a term in distance squared) fits 92% of 44 species measured. The classic four-way split (eel, trout, mackerel, tuna) is a continuum, and the measured differences are smaller than the textbook says: [Di Santo et al. 2021](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf).
- The "tail amplitude about 0.1 of body length" figure is right if it means **half** the sideways swing. Measured swing from one extreme to the other (peak-to-peak) is about 0.18 to 0.2 of body length. The convention matters; see the note under question 1.
- Strouhal number of 0.2 to 0.4 is confirmed. Median measured 0.29 across 44 species.
- Wavelengths were roughly right but the eel is longer than planned: median 0.75 body lengths in the 44-species study, against the 0.6 planned.
- Tail-beat frequency does rise linearly with speed, but the amplitude stays roughly constant. Bainbridge's line is only claimed for frequencies above 5 Hz.
- Some fish swim steadily and some alternate a short burst with a glide. The rummy-nose tetra is the best-documented glider and has published numbers and open data.
- Schooling: Couzin's three-zone model has published parameter ranges and four named outcomes. For real fish, the evidence leans towards "pay attention to one or two neighbours" rather than a fixed distance, with a "seven neighbours" rule coming from starling flocks and not tested the same way in fish.
- Moving round a tank is a specific topic with real data: fish hug walls, and the wall changes group shape.

## 1. Body wave equations and values by swimming style

### The four undulating styles

The standard grouping is by how much of the body bends. The review by [Sfakiotakis, Lane and Davies (1999)](https://ieeexplore.ieee.org/document/757275) (PDF copy: [ims.ut.ee](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)) says the four modes "reflect changes mainly in the wavelength and the amplitude envelope of the propulsive wave". I read this PDF:

| Style | What bends (Sfakiotakis et al. 1999) | Example |
|---|---|---|
| Anguilliform | Whole body, large amplitude; at least one full wavelength on the body | eel, lamprey |
| Subcarangiform | Amplitude small at the front, rising only in the back half | trout |
| Carangiform | Movement confined to the last third of the body, stiff tail fin | (jack and mackerel family) |
| Thunniform | Sideways movement only at the tail fin and the narrow part before it (the peduncle); tail fin gives over 90% of thrust | tuna |

The review also lists the styles that do not use the body wave: ostraciiform (only the tail fin swings; boxfish, in rigid bodies), labriform (pectoral fins paddle or flap, slow speeds) and rajiform (pectoral fins ripple, rays and skates). It says fin-driven undulation is used "at generally low speeds (below 3 BL/s)" (BL = body lengths).

**Correction to the "from memory" list.** Putting mackerel in carangiform and tuna in thunniform matches the review's drawing, but the review puts the mackerel and tuna *together* as scombrids in the text about thunniform ("thunniform mode is encountered in scombrids, such as the tuna and the mackerel"). The classification is a convenience. The 44-species study measured mackerel and tuna and concluded the classical categories "are poor descriptors of the diversity of fish" swimming; measured differences between the styles are real on average but the spread within each style is large ([Di Santo et al. 2021, checked](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)). Treat the style names as presets, not as biology.

### The equation

The form `y(s,t) = (c1·s + c2·s²)·sin(k·s − ω·t)` is used in robot-fish work. A fish-robot patent states it assumes "the linear wave amplitude envelope c1, the quadratic wave amplitude envelope c2, the body wave number K, and the body wave frequency ω" are known for a given fish ([US patent 7865268](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7865268), secondary: I saw only a search extract). Points to be careful about:

- **Sign.** With `sin(k·s − ω·t)` and s counted from the nose, the wave travels from head to tail, as it should. `sin(k·s + ω·t)` would run tail to head. This is my reading of the algebra; no source states it, but [Seo et al. (2025)](https://arxiv.org/html/2507.11665v2) write the wave as `A(x) sin[2π(x/λ − f t)]` with x from the nose, which agrees.
- **No constant term.** Without a constant, the head does not move at all. Measured heads do move slightly. [Seo et al.](https://arxiv.org/html/2507.11665v2) (checked) give `A(x)/L = a0 + a1(x/L) + a2(x/L)²`, with a0 = 0.02, a1 = −0.08, a2 = 0.16 for a mackerel-based model, attributed to [Videler and Hess 1984](https://cob.silverchair.com/jeb/article/109/1/209/4156/Fast-Continuous-Swimming-of-Two-Pelagic-Predators). My arithmetic from those numbers: head 0.020, middle 0.020, tail 0.100. So the mackerel is nearly flat until halfway, then rises sharply.
- **What the measured median looks like.** Across 44 species, amplitude rose from a median of 0.03 body lengths at the head to 0.18 at the tail, rising slowly over the front third and sharply after the middle. The maximum was always in the last 10% of the body ([Di Santo et al. 2021, checked](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)). Their measure is **peak-to-peak** (the distance from one extreme to the other), so the half-swing is roughly 0.09. That agrees with 0.10 in the mackerel model above, where Seo et al. give the tail's peak-to-peak as 0.2. **The planned "0.1 at the tail" is therefore right as a half-swing (the `A` that multiplies the sine), not as a total swing.**
- **Eel envelope.** A later paper quotes Tytell and Lauder (2004) as `0.0367 + 0.0323(x/L) + 0.0310(x/L)²` ([search extract, secondary](https://link.springer.com/10.1038/s41598-023-41074-9); original: [Tytell and Lauder 2004](https://sites.harvard.edu/glauder/files/2022/03/Tytell.Lauder.2004.pdf), which I could not read). That gives head 0.037, middle 0.060, tail 0.100, so the eel's mid-body is 60% of its tail swing: the whole body bends, as expected. The normalisation (half or full swing) is not confirmed.
- **The envelope is not a clean function of style.** In the 44-species data the three polynomial coefficients are strongly correlated with each other and the fitted curves overlap for all four classes ([Di Santo et al. 2021](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)). Their dataset is public (see question 5), so the per-species coefficients could be read from it if needed.

### Wavelength (body wave length, in body lengths)

| Style | Planned | Measured median, 44 species | Source |
|---|---|---|---|
| Anguilliform | 0.6 | **0.75** (more than one wave on the body) | [Di Santo et al.](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf) |
| Subcarangiform | 0.9 | **0.93** | same |
| Carangiform | 1.0 | not stated in the text I read; about 1.0 for a mackerel model | [Seo et al.](https://arxiv.org/html/2507.11665v2), quoting Videler and Hess |
| Thunniform | 1.3 | **1.14** (less than one wave on the body) | [Di Santo et al.](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf) |

Notes:

- The study says "wavelength decreased significantly from thunniform (median = 1.14) to subcarangiform (median = 0.93) and anguilliform species (median = 0.75)". The text then says thunniform species had *less than one wave* on the body during a tail beat, which is consistent with a wavelength a little over 1.
- The spread is large: some species have a standard deviation of about 20% of body length, and the Atlantic salmon (expected subcarangiform) had 0.74 while an amphioxus (expected anguilliform) had 1.14.
- American eels at 0.5 to 2 body lengths per second have been reported with wavelengths of 0.4 to 0.7 ([Scientific Reports 2023, secondary](https://link.springer.com/10.1038/s41598-023-41074-9)), so 0.6 for an eel is within that, but the 44-species median is higher.
- Di Santo et al. found speed has no effect on wavelength (correlation 0.03) or on tail amplitude (0.18), but a strong effect on frequency (0.95). Another source gives the whole-field wavelength range as 0.5 to 1.5 body lengths ([Seo et al., quoting Di Santo](https://arxiv.org/html/2507.11665v2)).
- **Suggested change:** eel 0.75, trout 0.9, mackerel 1.0, tuna 1.1. Thunniform 1.3 has no source.

## 2. Tail-beat frequency, tail sweep and speed

- **Frequency rises linearly with speed** in the classic fit from [Bainbridge (1958)](https://www.umesc.usgs.gov/data_library/fisheries/fish_passage/bainbridge.html) (trout, dace, goldfish). As quoted by [Seo et al. 2025](https://arxiv.org/html/2507.11665v2) (checked): `U = L(0.75 f − 1)` with f in hertz, "valid for f > 5 Hz". Rearranged (my arithmetic): `f ≈ 1.33 (U/L) + 1.33`. **Do not extend this to slow swimming**: at zero speed it gives 1.33 Hz, which only means the line is not meant to go there. The 44-species data support the linear trend (correlation 0.95 between speed and frequency; [Di Santo et al.](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)).
- **Tail swing is roughly constant** at moderate-to-high speed: about 0.18 body lengths peak-to-peak ([Bainbridge as quoted by Seo et al.](https://arxiv.org/html/2507.11665v2); [Di Santo](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf) median tail 0.18). Normalised tail amplitudes are mostly 0.1 to 0.3 across species ([Seo et al. quoting Di Santo](https://arxiv.org/html/2507.11665v2)). A newer abstract says the fit has "local departures from linearity and resonant amplitude effects at higher speeds" in bass and bluefish ([SICB abstract](https://sicb.org/abstracts/revisiting-the-relationship-between-tail-beat-frequency-amplitude-and-speed-in-swimming-fishes/)). For a graphics model a straight line is fine.
- **Distance per tail beat:** one beat moves the fish 0.6 to 0.8 body lengths, per a later paper citing Bainbridge ([NOAA report, secondary](https://swfsc-publications.fisheries.noaa.gov/publications/CR/1971/7114.PDF)). Not checked in the original.
- **Strouhal number** is tail-beat frequency times the total tail swing, divided by speed. Defined with peak-to-peak amplitude in [Sfakiotakis et al.](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf). Triantafyllou and colleagues found most swimmers, fish and dolphins alike, at 0.25 to 0.35 (summary of their work in [Seo et al.](https://arxiv.org/html/2507.11665v2) and a [search extract of the Rohr and Fish paper](https://math.wcupa.edu/sciences-mathematics/biology/fFish/documents/2006RohrampFish.pdf)). Taylor, Nudds and Thomas put flying and swimming animals within 0.2 to 0.4 ([quoted in Seo et al.](https://arxiv.org/html/2507.11665v2)). In 44 fish species the median was **0.29, interquartile range 0.24 to 0.35, full range 0.15 to 0.82** ([Di Santo](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)). So the planned 0.2 to 0.4 is fine, and 0.25 to 0.35 is the tighter figure for efficient swimmers. Dolphins sit lower (0.2 to 0.3) in captive data ([Rohr and Fish 2004](https://cob.silverchair.com/jeb/article/207/10/1633/14703/Strouhal-numbers-and-optimization-of-swimming-by)).
- **Practical rule for the code (my inference, not a published recipe):** frequency from speed using the line above; tail half-swing held near 0.09 to 0.10 body lengths; this gives a Strouhal number of `f · 0.2 / U`. At 3 body lengths per second and f = 5.3 Hz that is 0.35. At 1 body length per second the Bainbridge line gives f = 2.7 Hz and St = 0.53, above the usual range, which is consistent with the line not being valid at slow speeds.

## 3. Steady swimmers and burst-and-glide swimmers

- **Steady (continuous) swimming.** Tuna and mackerel: the review says thunniform mode "allow[s] high cruising speeds to be maintained for long periods" ([Sfakiotakis et al.](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)). Videler and Hess filmed saithe and mackerel swimming straight and found the same dimensionless pattern across a wide speed range ([abstract](https://cob.silverchair.com/jeb/article/109/1/209/4156/Fast-Continuous-Swimming-of-Two-Pelagic-Predators)).
- **Burst-and-glide** (also called burst-and-coast): the fish beats its tail for a short time, then stops and glides. The idea that this saves energy goes back to Weihs (1974); later papers credit it with savings of more than 50% in the model ([arXiv 1703.06185](https://arxiv.org/pdf/1703.06185), secondary), and about 45% measured in koi carp (Wu et al. 2007, [quoted in Akoz 2019](https://wordpress.lehigh.edu/kwm213/files/2019/06/Akoz_2019.pdf), secondary). Videler and Weihs (1982) applied it to cod and saithe ([listing](https://repository.uantwerpen.be/docstore/d:irua:2910), secondary). I could not open the originals.
- **Which species.** Rummy-nose tetra (*Hemigrammus rhodostomus*) swim in "sudden heading changes combined with brief accelerations followed by quasi-passive, straight decelerations" ([Calovi et al. 2018](https://pmc.ncbi.nlm.nih.gov/articles/PMC5783427)). Larval zebrafish swim in bursts and coasts ([Frontiers in Physics 2021, secondary](https://www.frontiersin.org/journals/physics/articles/10.3389/fphy.2021.678600/full)). I have no source that sorts species into "steady" and "burst-and-glide" in general. Treat that as unsourced beyond the examples here.
- **A model with numbers.** Calovi et al. measured rummy-nose tetra (body length about 31 mm) in circular tanks: about 0.5 s between kicks, about 7 cm per kick, about 14 cm/s speed while active (so roughly 4.5 body lengths per second, my arithmetic). Fully worked fitted functions are in the paper, with parameters "estimated or directly measured from experiments" ([Calovi et al. 2018, checked](https://pmc.ncbi.nlm.nih.gov/articles/PMC5783427)). A related tetra species keeps each burst-and-coast event to between 0.2 and 0.4 s ([arXiv 2002.09176, secondary](https://arxiv.org/pdf/2002.09176)).
- **For the body wave:** during a burst, play the wave at the Bainbridge frequency; during the glide, hold the body straight. A glide is a straight body, not a slow wave (my inference from the descriptions above).

## 4. Schooling models and what settings give what

### The models

- **Reynolds boids (1987).** Each simulated bird or fish reacts only to its own local view ([paper](https://www.cs.princeton.edu/courses/archive/spr01/cs598b/papers/reynolds87.pdf), [Toronto copy](https://www.cs.toronto.edu/~dt/siggraph97-course/cwr87)). The three rules (separation, alignment, cohesion) are the standard description of this paper, but my searches returned only the abstract level, so I have not quoted its numbers.
- **Couzin et al. 2002.** Three zones around each individual, which I read in the paper ([Couzin et al. 2002, PDF](https://www.cs.princeton.edu/courses/archive/fall24/cos597C/bib/couzinKJRF.pdf), doi 10.1006/jtbi.2002.3065): repulsion (steer away; highest priority), orientation (match heading) and attraction (move towards). Table 1 of the paper explores:

| Parameter | Values explored |
|---|---|
| Individuals | 10 to 100 |
| Repulsion radius | 1 unit (one body length scale) |
| Orientation zone width Δro | 0 to 15 units |
| Attraction zone width Δra | 0 to 15 units |
| Field of perception (blind area behind) | 200 to 360 degrees |
| Turning rate | 10 to 100 degrees per second |
| Speed | 1 to 5 units per second |
| Noise | 0 to 11.5 degrees |
| Time step | 0.1 s |

- **What settings give what.** From the same paper (checked):
  - **Swarm / tight ball:** orientation and attraction zones both small (low Δro, low Δra); lots of attraction and repulsion, little alignment, the group stays put.
  - **Torus (milling):** small Δro, large Δra; individuals circle an empty core in a random direction.
  - **Dynamic parallel group:** intermediate Δro with intermediate-to-high Δra; moves as a coherent, mobile, polarised group where individuals can still change places. This is the closest to a "stream" of fish.
  - **Highly parallel group:** larger Δro; very high alignment, straight movement.
  - **Loose group:** the paper notes part of the parameter space where groups have more than 50% chance of fragmenting (small zones). I read this as the loose end; the paper does not use the word "loose".
  - The same parameters can give different states depending on history (hysteresis, "collective memory"), and the range of parameters giving a torus shrinks as the group gets smaller ([search summary, secondary](https://www.cs.princeton.edu/courses/archive/fall24/cos597C/bib/couzinKJRF.pdf)). This matters for a tank: with few fish, tuning is touchier.

### Do real fish count neighbours or measure distance?

- **Starlings (birds, not fish).** Each bird interacts with a fixed number of neighbours, about six to seven, not all birds within a distance ([Ballerini et al. 2008 and a reanalysis giving 7 ± 1.5, summarised in a PMC article](https://pmc.ncbi.nlm.nih.gov/articles/PMC3499123); [arXiv 0905.0917](https://arxiv.org/pdf/0905.0917)). This is a statistical inference from field data, not a measure of individual decisions.
- **Fish, evidence for counting neighbours:** a robotic stickleback decoy study found interactions during a turn were "predominantly mediated by topological, rather than metric, distance" ([Faria et al. 2010](https://link.springer.com/doi/10.1007/s00265-010-0988-y), from a search summary, secondary).
- **Fish, evidence for very few neighbours:** mosquitofish each react to their nearest neighbour only, which departs from "all neighbours in a zone" and from "n nearest" models ([Herbert-Read et al. 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3219133), secondary). Rummy-nose tetra "mainly react to one or two neighbours at a time", and the most influential neighbours are not the nearest ([Jiang et al. 2017](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5697824/), secondary). Golden shiners: alignment arises from attraction and repulsion and speed control, with "no evidence for explicit matching of body orientation", and three-body effects matter ([Katz et al. 2011](https://pmc.ncbi.nlm.nih.gov/articles/PMC3585391), secondary).
- **So:** the "seven nearest" figure is a starling result. For fish, the published evidence says one or two neighbours, not a fixed distance. A simple project choice: the nearest 2 to 3 neighbours, found by grid as the code already does (my suggestion, not a published setting).

## 5. Open datasets of real fish tracks or motion

Only items for which I found a page are listed. Licences are as stated on the page; "not stated" means I did not see one.

| Dataset | Species | 2D / 3D | Fish | Licence | Where |
|---|---|---|---|---|---|
| 3D-ZeF (Aalborg, CVPR 2020) | zebrafish | 3D (two cameras; 2D boxes and head points in the labels) | 1, 2, 5 or 10 per sequence; 8 sequences of 15 to 120 s; 28,800 frames | Hugging Face metadata says MIT; the project page states none | [project page](https://vap.aau.dk/3d-zef/), [Hugging Face, 28.9 GB](https://huggingface.co/datasets/vapaau/3D-ZeF), [MOTChallenge](https://motchallenge.net/data/3D-ZeF20), [paper](https://arxiv.org/pdf/2006.08466) |
| Tuning collective behaviour in zebrafish with genetic modification (Bristol) | zebrafish | 2D shape data plus 3D trajectories | not stated on the page | CC BY 4.0 | [Zenodo 10693744](https://zenodo.org/records/10693744), 3.5 GB; the 3D trajectory file is 1.0 GB |
| Rummy-nose tetra in a circular tank (Calovi et al. 2018) | *Hemigrammus rhodostomus* | 2D, 25 Hz, tracked with idTracker | 1 or 2 fish; tanks of radius 176, 250 and 353 mm; about 300,000 kicks for one fish | Dataset licence not stated; the article is CC BY 4.0 | [figshare doi 10.6084/m9.figshare.5687083](https://doi.org/10.6084/m9.figshare.5687083) (stated in the [paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC5783427); I did not open figshare itself) |
| Convergence of undulatory swimming kinematics (Goerig, Di Santo et al.) | 44 species | 2D midlines from video (not tracks) | 151 sequences | Academic Free License v3.0 | [Zenodo 4623882](https://zenodo.org/records/4623882) (376 kB; MATLAB `dat.mat`, R code) and [Dryad](https://doi.org/10.5061/dryad.bg79cnp9x) |
| Zebrafish 3D tracking, TU Hamburg | zebrafish | 3D stereo video | groups of 2, 5, 10 | not seen | [TORE record, DOI 10.15480/882.17350](https://tore.tuhh.de/entities/product/01d8baa1-b6a5-4163-924a-01f40ff3bc81) (search summary only) |
| Dominance in interacting zebrafish, idtracker.ai output | zebrafish | 2D | not seen | not seen | [Zenodo 10103747](https://zenodo.org/records/10103747) (22 experiments; search summary only) |

Seen but not usable as listed: golden shiner trajectories from [MotionRugs](https://arxiv.org/pdf/1912.00719) (151 fish, 2.1 m by 1.2 m shallow tank, so effectively 2D); I did not find where the data is hosted. A Dryad record for a fish-school causality paper gives code and a video, and says the image data is available only on request ([arXiv 2110.04873](https://arxiv.org/pdf/2110.04873)). A larval-zebrafish video set exists at [Zenodo 7807967](https://zenodo.org/record/7807967) (about 2.8 GB; video, not tracks).

Nothing I found is a motion-capture set of a swimming body shape in 3D at the level of a joint skeleton. The 44-species midline set is the closest.

## 6. How fish move around a tank

There is published work, mostly on rummy-nose tetra and zebrafish:

- **Rummy-nose tetra in circular tanks.** Fish stay very close to the wall, "nearly parallel to it and often heading toward it". Wall avoidance acts within about 2 body lengths (about 60 mm) of the wall, and is strongest when the fish approaches at about 45 degrees and weakest when it is parallel ([Calovi et al. 2018, checked](https://pmc.ncbi.nlm.nih.gov/articles/PMC5783427)). Because of the burst-and-coast motion, the wall response gets coupled to the kicks, which concentrates trajectories near the wall. More light increases the concentration ([Xue et al. 2023](https://pmc.ncbi.nlm.nih.gov/articles/PMC10691717), secondary; [Lafoux et al. 2023, school of about 50](https://arxiv.org/pdf/2301.09577)).
- **Schools near walls.** A modelling study adds wall interaction to data-driven rules and finds new states where the school "follows the tank wall" or forms a "double mill", switching between schooling and milling under confinement ([Huang, Ling and Kanso 2024, from a search summary; I did not confirm the exact reference](https://arxiv.org/pdf/2509.08630)). Black neon tetra centres of mass "tend to slide along the walls".
- **Larval zebrafish** circle rapidly alongside the boundary when densely confined ([Frontiers in Physics 2021, secondary](https://www.frontiersin.org/journals/physics/articles/10.3389/fphy.2021.678600/full)). Wall-hugging is often measured as time within a quarter of a body length of the wall, called thigmotaxis (touch-following) ([arXiv 2405.17143](https://arxiv.org/pdf/2405.17143), secondary).
- **Open water versus tank.** I found no paper that directly compares the same species in open water and in a tank. Unsourced.

## Recommended values by swimming style

"Tail amplitude" is the half-swing at the tail tip as a fraction of body length (the `A` in front of the sine); peak-to-peak is twice that. "Speed" is a cruising speed in body lengths per second.

| Style | Envelope shape (A(x)/L, x from nose = 0 to tail = 1) | Tail amplitude | Wavelength (body lengths) | Cruising speed (BL/s) |
|---|---|---|---|---|
| Anguilliform (eel) | `0.037 + 0.032x + 0.031x²` ([Tytell and Lauder via secondary](https://link.springer.com/10.1038/s41598-023-41074-9)); mid-body is 60% of tail | 0.10 (same source; normalisation unconfirmed) | 0.75 ([Di Santo](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)); 0.4 to 0.7 reported for eel ([secondary](https://link.springer.com/10.1038/s41598-023-41074-9)) | 1.4 (eels in the Tytell and Lauder wake study, [abstract via search](https://sites.harvard.edu/glauder/files/2022/03/Tytell.Lauder.2004.pdf)) |
| Subcarangiform (trout) | quadratic, amplitude rises only in the back half ([Sfakiotakis](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)); no coefficients found. Use the global fit between eel and mackerel. Unsourced coefficients | about 0.09 to 0.10 ([Di Santo median tail 0.18 peak-to-peak](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)) | 0.93 ([Di Santo](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)) | about 1 in the lab study ([Di Santo](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)); no sourced cruising value |
| Carangiform (mackerel) | `0.02 − 0.08x + 0.16x²` ([Seo et al.](https://arxiv.org/html/2507.11665v2)); wave limited to last third ([Sfakiotakis](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)) | 0.10 ([Seo et al.](https://arxiv.org/html/2507.11665v2)); mackerel larger than saithe ([Videler and Hess](https://cob.silverchair.com/jeb/article/109/1/209/4156/Fast-Continuous-Swimming-of-Two-Pelagic-Predators)) | about 1.0 ([Seo et al.](https://arxiv.org/html/2507.11665v2)) | scombrid tail-beat 14.5 Hz at 8.2 BL/s recorded for a 40 cm fish, a fast speed not a cruise ([Sfakiotakis](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)) |
| Thunniform (tuna) | nearly flat until the peduncle; no coefficients found. Unsourced | about 0.09 to 0.10 (global median; no tuna-specific value read) | 1.14 ([Di Santo](https://sites.harvard.edu/glauder/files/2022/02/DiSanto.Goerig.etal_.megakinematics.ALL_.2021.pdf)) | about 1 in the lab study (same); high speed held "for long periods" ([Sfakiotakis](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)) |
| Ostraciiform (boxfish) | body rigid; only the tail fin oscillates ([Sfakiotakis](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)) | no value found | not applicable | no value found |
| Labriform (wrasse, surfperch) | body steady; pectoral fins beat ([Sfakiotakis](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)) | no value found | not applicable | slow; transition to body-tail swimming from as low as 0.8 BL/s in some species ([Sfakiotakis](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)) |
| Rajiform (rays) | pectoral fin wave, not body wave | no value found | no value found | fin undulation overall "below 3 BL/s" ([Sfakiotakis](https://ims.ut.ee/images/2/2e/Sfakiotakis%26etal19999.pdf)) |

Speed notes: energy use per distance is lowest near 1 body length per second, per a theoretical argument by Weihs; experimental cruising speeds were put near 3 body lengths per second ([Nature commentary, 1973, secondary](https://www.nature.com/articles/245007a0.pdf)). Burst speed is about 10 times sustained speed ([FishBase speed table](https://fishbase.se/manual/FishBaseThe_SWIMMING_and_SPEED_Tables.htm)). Smaller fish have higher relative speeds ([Oregon State FishXing notes](https://www.fsl.orst.edu/geowater/FX3/help/9_Fish_Performance/Fish_Length_and_Swim_Speeds.htm)). I found no per-style cruising value that I would call solid.

## Usable here, and not

### Usable

- The quadratic envelope plus travelling sine, with a constant term added so the head moves slightly. Five or six presets, because the style classes overlap in measurements.
- Half-swing at the tail of 0.09 to 0.10 body lengths, held constant with speed.
- Frequency from speed: the Bainbridge line `f ≈ 1.33 (U/L) + 1.33`, used only where U/L is above about 2.75; below that, use a slower, fixed small range (my suggestion).
- Strouhal number 0.25 to 0.35 as a check, not an input.
- Wavelengths 0.75 / 0.93 / 1.0 / 1.14 for eel / trout / mackerel / tuna.
- Burst-and-coast for small schooling fish, with the rummy-nose tetra numbers (kick about every 0.5 s, about 7 cm at 3.1 cm body length, wall response within 2 body lengths).
- Couzin's three zones with the parameter ranges in Table 1 as starting points; choose Δro and Δra for the school type (see question 4).
- Fish react to a few neighbours (one to three), not everything within a distance.
- Three datasets are downloadable under stated open licences or with an open article: the Bristol zebrafish set (CC BY 4.0), the 44-species kinematics (Academic Free License v3.0) and 3D-ZeF (MIT per Hugging Face).

### Not usable, or not yet

- The Lighthill-style `c1·s + c2·s²` with no constant (head would be rigid). Fix by adding a constant.
- A single wavelength per style as if it were exact: the measured spread is about 20% of body length within some species.
- Bainbridge's line at low speed; it is only claimed above 5 Hz.
- Anything for ostraciiform, labriform and rajiform bodies: no envelope or wavelength numbers found. Draw these as rigid bodies with fin motion.
- Per-style cruising speeds: no solid sources.
- The "seven nearest neighbours" figure for fish: it is a starling result.
- Steady-versus-gliding sorted by species: no general source.
- Any comparison of tank and open water.
- Datasets whose licence I did not see (TORE, the Zenodo dominance set, Calovi's figshare dataset) until checked.
- The boids rule details: I did not read them in the source.
- Secondary claims flagged above (energy saving percentages, Faria, Herbert-Read, Katz, Jiang, Xue): check the original before quoting in a public place.
