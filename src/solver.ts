import { applyMove, enumerateMoves, isSolved, serializeState } from './puzzle'
import type { Move, PuzzleState, Solution } from './types'

interface VisitedEntry {
  readonly previousKey: string | null
  readonly move: Move | null
  readonly state: PuzzleState
}

export function solve(initial: PuzzleState): Solution | null {
  const startKey = serializeState(initial)
  const queue: PuzzleState[] = [initial]
  const visited = new Map<string, VisitedEntry>([
    [startKey, { previousKey: null, move: null, state: initial }],
  ])

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentKey = serializeState(current)

    if (isSolved(current)) {
      return reconstructSolution(visited, currentKey)
    }

    for (const move of enumerateMoves(current)) {
      const nextState = applyMove(current, move)
      const nextKey = serializeState(nextState)
      if (visited.has(nextKey)) {
        continue
      }
      visited.set(nextKey, {
        previousKey: currentKey,
        move,
        state: nextState,
      })
      queue.push(nextState)
    }
  }

  return null
}

function reconstructSolution(
  visited: Map<string, VisitedEntry>,
  goalKey: string
): Solution {
  const states: PuzzleState[] = []
  const moves: Move[] = []

  let currentKey: string | null = goalKey

  while (currentKey) {
    const entry = visited.get(currentKey)
    if (!entry) {
      throw new Error('Inconsistent visited map during reconstruction')
    }
    states.push(entry.state)
    if (entry.move) {
      moves.push(entry.move)
    }
    currentKey = entry.previousKey
  }

  states.reverse()
  moves.reverse()

  return { states, moves }
}
