import type { Branch, Bird, Move, PuzzleState, Side } from './types'

export function exposedBird(branch: Branch): Bird | undefined {
  if (branch.birds.length === 0) {
    return undefined
  }
  return branch.side === 'left'
    ? branch.birds[branch.birds.length - 1]
    : branch.birds[0]
}

export function removeExposedBird(branch: Branch): Branch {
  const bird = exposedBird(branch)
  if (!bird) {
    throw new Error(`Branch ${branch.id} has no bird to remove`)
  }
  const birds =
    branch.side === 'left'
      ? branch.birds.slice(0, branch.birds.length - 1)
      : branch.birds.slice(1)
  return { ...branch, birds }
}

export function addBirdToBranch(branch: Branch, bird: Bird): Branch {
  if (branch.birds.length >= branch.capacity) {
    throw new Error(`Branch ${branch.id} is already full`)
  }
  const birds =
    branch.side === 'left'
      ? [...branch.birds, bird]
      : [bird, ...branch.birds]
  return { ...branch, birds }
}

export function canReceive(branch: Branch, bird: Bird): boolean {
  if (branch.birds.length === 0) {
    return true
  }
  if (branch.birds.length >= branch.capacity) {
    return false
  }
  const outerMost = exposedBird(branch)
  return outerMost === bird
}

export function branchIsComplete(branch: Branch): boolean {
  if (branch.birds.length !== branch.capacity) {
    return false
  }
  const first = branch.birds[0]
  return branch.birds.every((bird) => bird === first)
}

export function cleanupBranches(branches: ReadonlyArray<Branch>): Branch[] {
  return branches.filter((branch) => !branchIsComplete(branch))
}

export function applyMove(state: PuzzleState, move: Move): PuzzleState {
  const fromCollection = move.fromSide === 'left' ? state.left : state.right
  const toCollection = move.toSide === 'left' ? state.left : state.right

  const fromBranch = fromCollection[move.fromIndex]
  const toBranch = toCollection[move.toIndex]

  const movable = exposedBird(fromBranch)
  if (!movable) {
    throw new Error(`Branch ${fromBranch.id} has no bird to move`)
  }
  if (movable !== move.bird) {
    throw new Error(
      `Move bird mismatch: expected ${movable}, received ${move.bird}`
    )
  }
  if (!canReceive(toBranch, movable)) {
    throw new Error(
      `Branch ${toBranch.id} cannot receive bird type ${move.bird}`
    )
  }

  const updatedLeft = [...state.left]
  const updatedRight = [...state.right]

  const newFromBranch = removeExposedBird(fromBranch)
  if (move.fromSide === 'left') {
    updatedLeft[move.fromIndex] = newFromBranch
  } else {
    updatedRight[move.fromIndex] = newFromBranch
  }

  const newToBranch = addBirdToBranch(toBranch, movable)
  if (move.toSide === 'left') {
    updatedLeft[move.toIndex] = newToBranch
  } else {
    updatedRight[move.toIndex] = newToBranch
  }

  const cleanedLeft = cleanupBranches(updatedLeft)
  const cleanedRight = cleanupBranches(updatedRight)

  return {
    left: cleanedLeft,
    right: cleanedRight,
  }
}

export function isSolved(state: PuzzleState): boolean {
  const allLeftCleared = state.left.every((branch) => branch.birds.length === 0)
  const allRightCleared = state.right.every(
    (branch) => branch.birds.length === 0
  )
  return allLeftCleared && allRightCleared
}

export function enumerateMoves(state: PuzzleState): Move[] {
  const moves: Move[] = []

  const visitCollection = (side: Side, branches: ReadonlyArray<Branch>) => {
    branches.forEach((branch, branchIndex) => {
      const bird = exposedBird(branch)
      if (!bird) {
        return
      }
      const considerTarget = (
        targetSide: Side,
        targetBranches: ReadonlyArray<Branch>
      ) => {
        targetBranches.forEach((targetBranch, targetIndex) => {
          if (side === targetSide && branchIndex === targetIndex) {
            return
          }
          if (canReceive(targetBranch, bird)) {
            moves.push({
              fromSide: side,
              fromIndex: branchIndex,
              toSide: targetSide,
              toIndex: targetIndex,
              bird,
                fromId: branch.id,
                toId: targetBranch.id,
            })
          }
        })
      }

      considerTarget('left', state.left)
      considerTarget('right', state.right)
    })
  }

  visitCollection('left', state.left)
  visitCollection('right', state.right)

  return moves
}

export function serializeState(state: PuzzleState): string {
  const serializeBranch = (branch: Branch) =>
    `${branch.id}:${branch.birds.join(',')}`

  const left = state.left.map(serializeBranch).join('|')
  const right = state.right.map(serializeBranch).join('|')
  return `${left}||${right}`
}
