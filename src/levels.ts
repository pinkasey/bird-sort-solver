import type { Bird, Branch, PuzzleState, Side } from './types'

interface BranchSeed {
  readonly id: string
  readonly birds: ReadonlyArray<Bird>
}

export interface LevelConfig {
  readonly capacity: number
  readonly left: ReadonlyArray<BranchSeed>
  readonly right: ReadonlyArray<BranchSeed>
}

function createBranch(
  side: Side,
  capacity: number,
  seed: BranchSeed
): Branch {
  if (seed.birds.length > capacity) {
    throw new Error(
      `Branch ${seed.id} exceeds capacity ${capacity} with ${seed.birds.length} birds`
    )
  }
  return {
    id: seed.id,
    side,
    capacity,
    birds: [...seed.birds],
  }
}

export function buildInitialState(config: LevelConfig): PuzzleState {
  const left = config.left.map((seed) => createBranch('left', config.capacity, seed))
  const right = config.right.map((seed) =>
    createBranch('right', config.capacity, seed)
  )
  return { left, right }
}

export const demoLevel: PuzzleState = buildInitialState({
  capacity: 3,
  left: [
    { id: 'L1', birds: ['sparrow', 'finch', 'heron'] },
    { id: 'L2', birds: ['heron', 'sparrow'] },
  ],
  right: [
    { id: 'R1', birds: ['finch', 'heron'] },
    { id: 'R2', birds: ['sparrow', 'finch'] },
  ],
})
