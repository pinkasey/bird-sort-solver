import { exposedBird } from './puzzle'
import type { Bird, Branch, Move, PuzzleState, Side } from './types'

export interface RenderOptions {
    readonly editable?: boolean
    readonly birdTypes?: ReadonlyArray<string>
    readonly newTypeValue?: string
    readonly newTypeLabel?: string
    readonly onRowChange?: (detail: RowChangeDetail) => void
    readonly onNewType?: () => string | null
}

export interface RowChangeDetail {
    readonly side: Side
    readonly branchIndex: number
    readonly values: string[]
}

export function renderState(
    target: HTMLElement,
    state: PuzzleState,
    options: RenderOptions = {}
): void {
  target.innerHTML = ''
  const board = document.createElement('div')
  board.className = 'board'

    board.appendChild(renderColumn('left', state.left, options))
    board.appendChild(renderColumn('right', state.right, options))

  target.append(board)
}

function renderColumn(
    side: Side,
    branches: ReadonlyArray<Branch>,
    options: RenderOptions
) {
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

    branches.forEach((branch, index) => {
        column.append(renderBranch(branch, index, options))
  })

  return column
}

function renderBranch(
    branch: Branch,
    branchIndex: number,
    options: RenderOptions
): HTMLElement {
  const branchEl = document.createElement('article')
  branchEl.className = `branch branch-${branch.side}`

  const title = document.createElement('header')
  title.className = 'branch-title'
  title.textContent = branch.id
  branchEl.append(title)

  const slots = document.createElement('div')
  slots.className = 'slots'

    const layout = computeSlotLayout(branch)
    const movableIndex = getMovableIndex(branch)
    const movableSlotIndex =
        movableIndex === null
            ? null
            : layout.indices.findIndex((index) => index === movableIndex)

    const selects: HTMLSelectElement[] = []

    for (let i = 0; i < branch.capacity; i += 1) {
    const slot = document.createElement('div')
    slot.classList.add('slot')

      if (layout.values[i] === undefined) {
      slot.classList.add('slot-empty')
    } else {
      slot.classList.add('slot-filled')
          if (movableSlotIndex !== null && i === movableSlotIndex) {
              slot.classList.add('slot-movable')
          }
      }

      if (options.editable) {
          slot.classList.add('slot-editable')
          const select = document.createElement('select')
          select.className = 'structured-slot slot-editor'
          populateSelectOptions(select, layout.values[i], options)
          selects.push(select)
          slot.append(select)

          let previousValue = select.value

          select.addEventListener('change', () => {
              let currentValue = select.value
              if (
                  options.newTypeValue &&
                  currentValue === options.newTypeValue &&
                  options.onNewType
              ) {
                  const newType = options.onNewType()
                  if (newType) {
                      ensureSelectHasOption(select, newType)
                      currentValue = newType
                      select.value = newType
                  } else {
                      select.value = previousValue
                      return
                  }
              }

              previousValue = select.value

              if (options.onRowChange) {
                  const rowValues = selects.map((item) =>
                      item.value === options.newTypeValue ? '' : item.value
                  )
                  options.onRowChange({
                      side: branch.side,
                      branchIndex,
                      values: rowValues,
                  })
              }
          })
      } else {
          const bird = layout.values[i]
          if (bird !== undefined) {
          slot.textContent = bird
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

function computeSlotLayout(branch: Branch) {
    const values: Array<Bird | undefined> = new Array(branch.capacity).fill(
        undefined
    )
    const indices: number[] = new Array(branch.capacity).fill(-1)

    if (branch.side === 'left') {
        branch.birds.forEach((bird, index) => {
            if (index < branch.capacity) {
                values[index] = bird
                indices[index] = index
            }
        })
    } else {
        const startIndex = branch.capacity - branch.birds.length
        branch.birds.forEach((bird, index) => {
            const slotIndex = startIndex + index
            if (slotIndex >= 0 && slotIndex < branch.capacity) {
                values[slotIndex] = bird
                indices[slotIndex] = index
            }
        })
    }

    return { values, indices }
}

function populateSelectOptions(
    select: HTMLSelectElement,
    current: Bird | undefined,
    options: RenderOptions
): void {
    select.innerHTML = ''

    const blankOption = new Option('— empty —', '')
    select.add(blankOption)

    const types = [...(options.birdTypes ?? [])]
    if (current && !types.includes(current)) {
        types.push(current)
    }

    types.forEach((type) => {
        if (type.trim().length === 0) {
            return
        }
        select.add(new Option(type, type))
    })

    if (options.newTypeValue && options.newTypeLabel) {
        select.add(new Option(options.newTypeLabel, options.newTypeValue))
    }

    if (current) {
        select.value = current
    } else {
        select.value = ''
    }
}

function ensureSelectHasOption(select: HTMLSelectElement, value: string): void {
    const hasOption = Array.from(select.options).some(
        (option) => option.value === value
    )
    if (!hasOption) {
        const option = new Option(value, value)
        select.add(option, select.options.length - 1)
    }
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
