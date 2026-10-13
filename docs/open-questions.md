# Open questions

Decisions that shape the plan. Roughly in order of how much they change it.

## The exhibition

1. **Wall, floor or table?** To be found by experiment, not decided now. It decides camera placement, whether fish are seen side-on or from above, and so what the artwork looks like. Until then everything is side-on.

## Shape of the project

2. **One app with modes, or separate apps sharing a core?** The docs assume one app. The case for splitting: the exhibition display and the equation editor have almost no interface in common.
3. **Does 3D belong in the interactive strand, or only in equation mode?** Projection and camera input are both flat, so the docs treat 3D as a side branch. A 3D tank on a wall with fish swimming towards you would be striking, but is much more work to make interactive.
4. **Are equations visible in the exhibition?** For example a visitor choosing a swimming motion and seeing its equation. Or is the maths hidden there, and equation mode a separate thing for a different audience?
5. **What is its final name?** Equatium is the working name. It may not fit once some modes are not about equations, such as a real-fish tank on a wall. "Swish Fish" is the earlier project's name.

## Size

6. **Who chooses a tank's size?** Fixed sizes such as small, medium and large, or any size. And does a personal phone aquarium stay small, or can it be as big as a wall tank?
7. **Does the tank join up at the sides?** A tank that loops left to right can be scrolled for ever on a phone and has no walls for fish to turn at. A tank with ends is more like a real one.
8. **Life-size on a wall?** With real units, a wall can show fish at their true size. Appealing for a real-fish tank; it also fixes how big the tank is by how big the wall is.
9. **On a phone, follow a fish or roam freely?** Which is the default way to look around a tank that does not fit.

## Look and feel

10. **Illustrated, generated or both?** Stage 3 of the roadmap is an experiment to answer this by looking, not by deciding in advance.
11. **What mood?** Calm and realistic, bright and cartoonish, abstract. Reference pictures would help more than words.
12. **Sound?** Not mentioned so far, but it does a lot for an installation.

## Real fish

13. **True scale or compressed?** A sardine and a tuna differ about tenfold in length. True scale is honest but makes small fish dots on a small screen; compressed keeps the order and loses the drama. A view that zooms may make true scale workable everywhere.
14. **Which species first?** About six, chosen for variety and for what Eleanor wants to draw. Which biomes matter most: the two named so far are Pacific saltwater and British freshwater lake.
15. **How accurate does it need to be?** Recognisable and well-behaved, or correct enough that someone who knows fish would approve. This sets how deep the research goes.
16. **In a real-fish tank, how fixed are the routes?** Real and made-up fish are now separate tank settings (see [ideas.md](ideas.md#real-fish-and-made-up-fish)), so a tuna on a rose curve belongs to made-up. Still open: whether a real tank lets you edit a species' route at all.
17. **Do predators chase prey?** It makes a tank livelier and gives schools a reason to move, but visitors may not enjoy watching their fish be hunted.

18. **Side-on swimming: honest or stylised?** A real fish's bend barely shows from the side. Either the tail narrows and widens as it swings, or the body visibly ripples as in most 2D games. To be judged by eye in stage 3.
19. **Does curiosity wear off?** A fish that has come to look at a hand could lose interest after a while, or stay as long as the hand does.

## Visitors and their fish

20. **Free drawing or fixed choices on the phone?** Free drawing is more personal and needs moderation. Fixed choices are safe and quicker to build.
21. **How long does a visitor's fish live?** Until the tank is full, for the day, for ever. Can a visitor find their fish again later on their own phone?
22. **Accounts or not?** Saving by link needs none. Accounts only become necessary if people should keep an aquarium across devices without holding on to a link.

23. **What triggers a discovery?** Time watching, time of day, biome, rarity, visiting an exhibition. And is it for real species only?

## Technical

24. **Is running a hosted service acceptable?** Stage 5 needs one, with a small running cost and something to look after. Everything before it stays static files.
25. **Where does the site live?** The README mentions hosting on a subdomain or subpath of a larger site, which affects where a server function could go.
