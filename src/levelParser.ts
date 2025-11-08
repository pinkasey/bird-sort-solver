import { buildInitialState } from './levels'
import type { LevelConfig } from './levels'
import type { Bird, Branch, PuzzleState, Side } from './types'

const LINE_SEPARATOR = /\r?\n/
const TOKEN_SEPARATOR = /[\s,]+/

export interface EditorState {
  readonly capacity: number
  readonly left: string
  readonly right: string
}

export function parseLevelInput(
  rawCapacity: string,
  leftText: string,
  rightText: string
): PuzzleState {
  const capacity = parseCapacity(rawCapacity)
  const usedIds = new Set<string>()

  const left = parseBranchBlock('left', leftText, capacity, usedIds)
  const right = parseBranchBlock('right', rightText, capacity, usedIds)

  if (left.length === 0 && right.length === 0) {
    throw new Error('Define at least one branch on either side.')
  }

  const config: LevelConfig = { capacity, left, right }
  return buildInitialState(config)
}

export function formatStateForEditor(state: PuzzleState): EditorState {
  const capacity = deriveCapacity(state)
  return {
    capacity,
    left: formatBranchBlock(state.left),
    right: formatBranchBlock(state.right),
  }
}

function parseCapacity(raw: string): number {
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('Branch capacity must be a positive integer.')
  }
  return value
}

function parseBranchBlock(
  side: Side,
  text: string,
  capacity: number,
  usedIds: Set<string>
) {
  const seeds: BranchSeed[] = []

  const lines = text.split(LINE_SEPARATOR).map((line) => line.trim())

  for (const line of lines) {
    if (line.length === 0) {
      continue
    }

    const [rawId, rawBirds] = line.split(':')

    if (!rawBirds) {
      throw new Error(`Branch line "${line}" is missing a ':' to separate id from birds.`)
    }

    const id = rawId.trim()
    if (id.length === 0) {
      throw new Error('Branch IDs cannot be empty.')
    }
    if (usedIds.has(id)) {
      throw new Error(`Branch ID "${id}" is duplicated. Use unique IDs across both sides.`)
    }

    const birds = rawBirds
      .split(TOKEN_SEPARATOR)
      .map((token) => token.trim())
      .filter(Boolean)

    if (birds.length > capacity) {
      throw new Error(
        `Branch ${id} on the ${side} exceeds capacity ${capacity} with ${birds.length} birds.`
      )
    }

    seeds.push({ id, birds })
    usedIds.add(id)
  }

  return seeds
}

function formatBranchBlock(branches: ReadonlyArray<Branch>): string {
  return branches
    .map((branch) => `${branch.id}: ${branch.birds.join(' ')}`)
    .join('\n')
}

type BranchSeed = {
  readonly id: string
  readonly birds: ReadonlyArray<Bird>
}

function deriveCapacity(state: PuzzleState): number {
  const source = state.left[0] ?? state.right[0]
  return source?.capacity ?? 3
}
