# Bird Branch Sort

A TypeScript + Vite playground that models and solves the "bird sorting" riddle. Birds perch on left and right branches, moving according to simple rules until each branch holds a single species and disappears. The UI lets you step through the breadth-first search solution and watch the puzzle resolve.

# Background
It started when my wife installed a small time-killer game, where you need to sort birds on branches. We got stuck on level 87, so I decided that I'd just let copilot+ChatGPT-5-Codex write a solver for it. A few prompts later - I have this repository. 

## Getting Started

```bash
npm install
npm run dev
```

Open the printed local URL to launch the interactive viewer. Use the **Next** and **Previous** buttons to walk through the precomputed solution or reset to replay from the start.

## Custom Levels

Use the Level Editor panel to define your own puzzle. Supply the branch capacity and list each branch on its own line in the format `ID: birdA birdB ...`, with birds ordered from the exposed outer perch toward the trunk. Click **Solve Level** to run the breadth-first search and step through the resulting move sequence.

## Scripts

- `npm run dev` – start the Vite development server.
- `npm run build` – compile TypeScript and build the production bundle.
- `npm run preview` – preview the production build locally.

## Project Structure

- `src/types.ts` – shared TypeScript types for birds, branches, and puzzle states.
- `src/puzzle.ts` – branch operations, move validation, and state utilities.
- `src/solver.ts` – breadth-first search that finds the shortest solution path.
- `src/levels.ts` – sample level definition and helper to construct states.
- `src/ui.ts` – DOM rendering helpers for the puzzle board and move list.
- `src/main.ts` – wiring for UI controls and solution playback.
- `src/style.css` – layout and styling for the visualization.
- `src/levelParser.ts` – level-editor parser and serializer utilities.

## Next Steps

- Expand `levels.ts` with more puzzles or a level-loading UI.
- Add heuristics or alternative solvers to explore larger search spaces.
- Animate moves to better illustrate bird transfers between branches.


# The prompt I used to start this repo:
```
I want to write a program that solves a simple riddle, where you get an initial state, with simple rules, and have to come up with a series of steps to solve it.
```
And then:
```
here are the rules:
1. there are 2 types of entities - birds an branches
2. a branch can accomodate NS birds (e.g: NS=6 bird-places) in a line
3. a bird always sits on a branch
4. In each level, there are NT types of birds, and NS birds of each type
5. the branches are divided to 2 columns - right and left (let's say there are NL branches on the left and NR branches on the right). Note: this is a visual aspect of the game, logically there's no difference.
6. the only bird on a LEFT branch that can move is the RIGHT-MOST bird
7. the only bird on a RIGHT branch that can move is the LEFT-MOST bird
8. a bird can only move to another branch that is either
8.a. empty, or
8.b. not full, and has the same kind of bird on the outer-most place
9. after a move is complete, if a branch has all NS birds of the same type - the birds and the branch dissappear
10. the level is successfully complete once all birds have dissappeared
```
