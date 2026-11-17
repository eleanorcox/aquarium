# Equatium

Equatium is the working name (not final; it may stop fitting once not every mode is about equations). A digital aquarium whose fish follow equations, respond to people's movement, and can be shown on anything from a phone to a projected wall. TypeScript, Vite, Vitest. The plan lives in [docs/](docs/README.md); read [docs/roadmap.md](docs/roadmap.md) and [docs/architecture.md](docs/architecture.md) before planning or building anything.

## Commands

```sh
nvm use            # Node 24, pinned in .nvmrc; older Node fails at startup
npm install        # also copies the hand-tracking runtime into public/mediapipe/wasm
npm run dev        # local dev server
npm test           # all tests, once
npm run speed      # time the simulation; run before and after changing how it steps
npm run typecheck  # type check only
npm run build      # type check, then build into dist/
npm run service    # the visitor service on this laptop, at port 8787 (Cloudflare's Wrangler)
```

## How we work

- **Test-first.** A failing test before every change in behaviour, and before every bug fix. [docs/testing.md](docs/testing.md) lists the first tests for each stage and says how things that can only be judged by eye are checked. Run `npm test` and `npm run typecheck` before calling anything done.
- **Log decisions.** When a design or architecture decision is made or changed, add an entry to [docs/decisions.md](docs/decisions.md) in the same piece of work. Never rewrite an old entry: add a new one and mark the old one "Replaced by N". Record what prompted it in gist; do not quote Eleanor's messages word for word.
- **Keep the changelog.** Add a line to the Unreleased section of [CHANGELOG.md](CHANGELOG.md) in the same commit as any change someone using the app could notice.
- **Log versions.** At the end of a roadmap stage, or whenever Eleanor records a screencast, turn Unreleased into a numbered version in the changelog, add an entry to [docs/versions.md](docs/versions.md) and tag the commit `vN`. The changelog lists what changed; the version log says how it feels to use and names the screencast. At the end of a stage, remind Eleanor to record a screencast; they live outside the repo in `~/Videos/Screencasts/`.
- **Keep the plan current.** When the plan changes, update the doc it affects. Answered questions leave [docs/open-questions.md](docs/open-questions.md). New ideas go in [docs/ideas.md](docs/ideas.md), even half-formed.
- **Say what is unchecked.** Facts written from memory (fish biology, hardware, library behaviour) are labelled as unchecked until sourced.
- **Git.**
  - Commit without asking, in sensible chunks: one commit per piece of work that hangs together, with tests passing. Do not save up a whole stage for one commit, and do not commit half-finished work on `main`.
  - Never push. Eleanor pushes.
  - Work on `main` by default; there is one developer.
  - Use a branch for a big feature that will leave things broken part-way (a new renderer, reworking the simulation core), and for throwaway experiments. Merge a feature branch when its tests pass; delete an experiment branch once what it taught is written down.

## Code rules

- `src/main.ts` only chooses the window: `src/operator.ts` is the app, `src/display/` the projector window that draws frames sent to it.
- `service/` is the visitor service, a Cloudflare Worker. Its rules are in `room.ts`, plain and tested; `worker.ts` only connects them to the network.
- `src/core/` is the simulation. No DOM, no browser APIs, no real clock, no `Math.random` except through the function passed in.
- `src/render/` only reads the tank. `src/ui/` and `src/input/` only change it through its methods. Input adapters take positions in tank units and times in seconds, and never touch the page, so they can be tested.
- The simulation advances on a fixed 1/60 s timestep. The same starting tank and steps must always give the same result.
- Catalogue code says "species", not "fish", where it reasonably can: rays, whales and seals are planned.
- Match the surrounding code: one-line comments that say why, behaviour-sentence test names, tests beside the code as `name.test.ts`.

## Writing

- British English in docs, comments and anything shown on screen.
- Docs are read by Eleanor, who is learning the graphics and immersive side as the project goes. Explain a technical term the first time it appears, and prefer a plain sentence to jargon.

## Subagents

Use the cheapest agent that will do the job well, and no agent when the job is small.

**Do it directly, with no subagent, when:**

- it is a few tool calls, or the file or symbol is already known;
- the result is needed in full detail, not as a summary;
- it is a decision. Design, architecture and trade-offs stay in the main session.

**Match the model to the work:**

| Work | Agent | Model |
| --- | --- | --- |
| Finding code, tracing where something is used, listing files | Explore | `haiku` |
| Running tests or a build and reporting what failed | general-purpose | `haiku` |
| Checking assets against [docs/assets.md](docs/assets.md); other checks against a written list | general-purpose | `haiku` |
| Mechanical edits with an exact specification (renames, moving files) | general-purpose | `haiku` |
| Research with sources: the fish-motion survey, species facts, library and hardware comparisons | general-purpose | `sonnet` |
| Writing tests or code to a clear, bounded specification outside `src/core/` | general-purpose | `sonnet` |
| An independent review of a change | general-purpose | `sonnet`; the main model for changes to `src/core/` |
| Implementation planning for a stage | Plan | the main model |
| Changes to the simulation in `src/core/`, shaders, anything where the specification is still being worked out | main session | not delegated |

**Rules:**

1. **Brief it properly.** State the goal, what is already known or ruled out, the files to read, the scope, and exactly what to send back. Say so when the task is read-only. The brief is all it knows.
2. **Tell writers the rules.** Any agent writing code is told to work test-first and to follow the code rules above.
3. **Check before relying.** A report is a claim. Open the files it names, and run the tests in the main session before saying anything works. Research must come back with a source for each fact; anything without one is treated as unchecked.
4. **Move up, do not retry.** If a result is thin or wrong, rerun it one tier up with a better brief. Do not send the same brief to the same model again.
5. **Do not ask for agreement.** Give a reviewer the code and the requirement, not the conclusion hoped for.
6. **Parallel only when independent.** Never two agents editing the same files. Parallel writers each get their own worktree. Ask Eleanor before running more than three agents at once.
7. **Subagents do not decide or publish.** They do not commit, push, edit [docs/decisions.md](docs/decisions.md), or change the plan. They report back and the main session does those.
8. **Do not duplicate.** Once something is delegated, wait for it; do not also do it directly.

These rules are a first version. When a tier turns out too weak or needlessly strong for a kind of work, change the table and note why in the decision log.
