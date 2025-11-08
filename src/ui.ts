import { exposedBird } from './puzzle'
import type { Bird, Branch, Move, PuzzleState } from './types'

export function renderState(target: HTMLElement, state: PuzzleState): void {
  target.innerHTML = ''
  const board = document.createElement('div')
  board.className = 'board'

  board.appendChild(renderColumn('left', state.left))
  board.appendChild(renderColumn('right', state.right))

  target.append(board)
}

function renderColumn(side: 'left' | 'right', branches: ReadonlyArray<Branch>) {
  const column = document.createElement('section')
  column.className = `column column-${side}`
  const heading = document.createElement('h2')
  heading.textContent = `${side.toUpperCase()} COLUMN`
  column.append(heading)

  if (branches.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'column-empty'
    empty.textContent = 'No branches'
    column.append(empty)
    return column
  }

  branches.forEach((branch) => {
    column.append(renderBranch(branch))
  })

  return column
}

function renderBranch(branch: Branch): HTMLElement {
  const branchEl = document.createElement('article')
  branchEl.className = `branch branch-${branch.side}`

  const title = document.createElement('header')
  title.className = 'branch-title'
  title.textContent = branch.id
  branchEl.append(title)

  const slots = document.createElement('div')
  slots.className = 'slots'

  const movableIndex = getMovableIndex(branch)
    const slotBirds: Array<Bird | undefined> = new Array(branch.capacity).fill(
        undefined
    )

    if (branch.side === 'left') {
        branch.birds.forEach((bird, index) => {
            slotBirds[index] = bird
        })
    } else {
        const startIndex = branch.capacity - branch.birds.length
        branch.birds.forEach((bird, index) => {
            slotBirds[startIndex + index] = bird
        })
    }

    const movableSlotIndex =
        movableIndex === null
            ? null
            : branch.side === 'left'
                ? movableIndex
                : branch.capacity - branch.birds.length + movableIndex

  for (let i = 0; i < branch.capacity; i += 1) {
      const bird = slotBirds[i]
    const slot = document.createElement('div')
    slot.classList.add('slot')
    if (bird === undefined) {
      slot.classList.add('slot-empty')
    } else {
      slot.classList.add('slot-filled')
      slot.textContent = bird
        if (i === movableSlotIndex) {
        slot.classList.add('slot-movable')
      }
    }
    slots.append(slot)
  }

  branchEl.append(slots)
  return branchEl
}

function getMovableIndex(branch: Branch): number | null {
  const bird = exposedBird(branch)
  if (!bird) {
    return null
  }
  return branch.side === 'left' ? branch.birds.length - 1 : 0
}

export function renderMoves(
  target: HTMLElement,
  moves: ReadonlyArray<Move>,
  executedCount: number
): void {
  target.innerHTML = ''
  const heading = document.createElement('h2')
  heading.textContent = 'Solution Moves'
  target.append(heading)

  if (moves.length === 0) {
    const empty = document.createElement('p')
    empty.className = 'moves-empty'
    empty.textContent = 'No solution available.'
    target.append(empty)
    return
  }

  const list = document.createElement('ol')
  list.className = 'moves-list'

  const executed = Math.min(executedCount, moves.length)

  moves.forEach((move, index) => {
    const item = document.createElement('li')
    item.textContent = describeMove(move)
    if (index < executed) {
      item.classList.add('done')
    } else if (index === executed) {
      item.classList.add('current')
    }
    list.append(item)
  })

  target.append(list)
}

export function describeMove(move: Move): string {
  return `${move.bird} from ${move.fromId} → ${move.toId}`
}
