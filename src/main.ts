import './style.css'
import { formatStateForEditor, parseLevelInput } from './levelParser'
import { demoLevel } from './levels'
import { solve } from './solver'
import { createAppLayout } from './layout'
import { renderMoves, renderState } from './ui'
import type { RowChangeDetail } from './ui'
import type { Bird, Branch, Move, PuzzleState, Side } from './types'
import {
  NEW_TYPE_OPTION_VALUE,
  TYPE_PATTERN,
  type StructuredState,
  availableBirdTypes,
  cloneState,
  createEmptyRow,
  createStructuredState,
  ensureRowCapacity,
  replaceTypeInBranches,
  resizeBranchesToCapacity,
  structuredStateToPuzzle,
} from './structuredState'

type EditorMode = 'structured' | 'text'

const appRoot = document.querySelector<HTMLDivElement>('#app')

if (!appRoot) {
  throw new Error('Missing app root element')
}

const layout = createAppLayout(appRoot)

const {
  stateContainer,
  boardView,
  boardEditButton,
  boardCreateButton,
  editorPanel,
  editorSummary,
  structuredTabButton,
  textTabButton,
  structuredPanel,
  textPanel,
  editorMessage,
  structuredForm,
  structuredCapacityInput,
  birdTypeList,
  addTypeButton,
  leftBranchSection,
  rightBranchSection,
  structuredLoadDemoButton,
  textForm,
  textCapacityInput,
  leftTextarea,
  rightTextarea,
  textLoadDemoButton,
  controls,
  status,
  movesContainer,
} = layout

const { prevButton, nextButton, resetButton } = controls

let states: PuzzleState[] = []
let moves: Move[] = []
let solverFoundSolution = false
let currentIndex = 0
let structuredState: StructuredState = createStructuredState(demoLevel)
let isBoardEditable = false
let boardEditState: PuzzleState | null = null


structuredTabButton.addEventListener('click', () => setActiveEditor('structured'))
textTabButton.addEventListener('click', () => setActiveEditor('text'))

structuredCapacityInput.addEventListener('change', () => {
  const next = Number.parseInt(structuredCapacityInput.value, 10)
  if (!Number.isFinite(next) || next <= 0) {
    structuredCapacityInput.setCustomValidity('Capacity must be a positive integer.')
    return
  }
  structuredCapacityInput.setCustomValidity('')
  if (next !== structuredState.capacity) {
    structuredState.capacity = next
    resizeBranchesToCapacity(structuredState, next)
    renderStructuredBranches()
  }
  textCapacityInput.value = structuredCapacityInput.value
})

addTypeButton.addEventListener('click', () => {
  structuredState.birdTypes.push('')
  renderTypeList()
})

structuredForm.addEventListener('submit', (event) => {
  event.preventDefault()
  try {
    const puzzle = structuredStateToPuzzle(structuredState)
    populateEditorsFromState(puzzle)
    applySolution(puzzle, 'custom')
    editorPanel.open = false
    editorSummary.focus()
  } catch (error) {
    setActiveEditor('structured')
    setEditorMessage(errorMessage(error), 'error')
  }
})

structuredLoadDemoButton.addEventListener('click', () => {
  populateEditorsFromState(demoLevel)
  applySolution(demoLevel, 'demo')
  setActiveEditor('structured')
})

textForm.addEventListener('submit', (event: SubmitEvent) => {
  event.preventDefault()
  try {
    const parsed = parseLevelInput(
      textCapacityInput.value,
      leftTextarea.value,
      rightTextarea.value
    )
    populateEditorsFromState(parsed)
    applySolution(parsed, 'custom')
    editorPanel.open = false
    editorSummary.focus()
  } catch (error) {
    setActiveEditor('text')
    setEditorMessage(errorMessage(error), 'error')
  }
})

textLoadDemoButton.addEventListener('click', () => {
  populateEditorsFromState(demoLevel)
  applySolution(demoLevel, 'demo')
  setActiveEditor('text')
})

leftBranchSection.addButton.addEventListener('click', () => {
  structuredState.leftBranches.push(createEmptyRow(structuredState.capacity))
  renderStructuredBranches()
})

rightBranchSection.addButton.addEventListener('click', () => {
  structuredState.rightBranches.push(createEmptyRow(structuredState.capacity))
  renderStructuredBranches()
})

prevButton.addEventListener('click', () => {
  if (currentIndex === 0) {
    return
  }
  currentIndex -= 1
  updateView()
})

nextButton.addEventListener('click', () => {
  if (currentIndex >= states.length - 1) {
    return
  }
  currentIndex += 1
  updateView()
})

resetButton.addEventListener('click', () => {
  if (currentIndex === 0) {
    return
  }
  currentIndex = 0
  updateView()
})

boardEditButton.addEventListener('click', () => {
  if (!states[currentIndex]) {
    return
  }
  if (isBoardEditable) {
    isBoardEditable = false
    boardEditState = null
  } else {
    isBoardEditable = true
    boardEditState = cloneState(states[currentIndex])
  }
  updateBoardControls()
  updateView()
})

boardCreateButton.addEventListener('click', () => {
  if (!states[currentIndex]) {
    return
  }
  const sourceState = isBoardEditable && boardEditState ? boardEditState : states[currentIndex]
  const baseState = cloneState(sourceState)
  isBoardEditable = false
  boardEditState = null
  updateBoardControls()
  populateEditorsFromState(baseState)
  applySolution(baseState, 'custom')
  editorPanel.open = true
  setActiveEditor('structured')
})

updateBoardControls()

populateEditorsFromState(demoLevel)
applySolution(demoLevel, 'demo')

function populateEditorsFromState(state: PuzzleState): void {
  const formatted = formatStateForEditor(state)
  textCapacityInput.value = formatted.capacity.toString()
  leftTextarea.value = formatted.left
  rightTextarea.value = formatted.right

  structuredState = createStructuredState(state)
  structuredCapacityInput.value = structuredState.capacity.toString()
  renderTypeList()
  renderStructuredBranches()
}

function applySolution(baseState: PuzzleState, source: 'demo' | 'custom'): void {
  if (isBoardEditable) {
    isBoardEditable = false
    boardEditState = null
    updateBoardControls()
  }
  const solution = solve(baseState)

  if (solution) {
    states = [...solution.states]
    moves = [...solution.moves]
    solverFoundSolution = true
    const descriptor = source === 'demo' ? 'Demo level' : 'Custom level'
    setEditorMessage(
      `${descriptor} solved in ${moves.length} moves across ${branchCount(baseState)} branches.`,
      'success'
    )
  } else {
    states = [baseState]
    moves = []
    solverFoundSolution = false
    const descriptor = source === 'demo' ? 'Demo level' : 'Custom level'
    setEditorMessage(
      `${descriptor} has no solution under the current rules.`,
      'info'
    )
  }

  currentIndex = 0
  updateView()
}

function updateView(): void {
  const state = states[currentIndex]
  if (isBoardEditable) {
    if (!boardEditState) {
      boardEditState = cloneState(state)
    }
  } else {
    boardEditState = null
  }

  const renderStateSource = isBoardEditable && boardEditState ? boardEditState : state
  const renderOptions = isBoardEditable
    ? {
      editable: true,
      birdTypes: collectBirdTypes(renderStateSource),
      newTypeValue: NEW_TYPE_OPTION_VALUE,
      newTypeLabel: 'New…',
      onRowChange: handleBoardRowChange,
      onNewType: handleBoardNewType,
    }
    : undefined

  renderState(boardView, renderStateSource, renderOptions)
  renderMoves(movesContainer, moves, currentIndex)
  status.textContent = isBoardEditable
    ? 'Editing board. Adjust birds with the dropdowns, then choose “Create Level from Current”.'
    : formatStatus(currentIndex, states.length, solverFoundSolution)

  prevButton.disabled = isBoardEditable || currentIndex === 0
  nextButton.disabled = isBoardEditable || currentIndex >= states.length - 1
  resetButton.disabled =
    isBoardEditable || currentIndex === 0 || states.length <= 1
}

function formatStatus(
  stateIndex: number,
  totalStates: number,
  hasSolution: boolean
): string {
  if (!hasSolution) {
    return 'No solution found for this level.'
  }
  if (stateIndex === totalStates - 1) {
    return 'Solved! All birds have flown away.'
  }
  if (stateIndex === 0) {
    return `Ready to begin. ${totalStates - 1} moves to go.`
  }
  return `Step ${stateIndex} of ${totalStates - 1}`
}

function branchCount(state: PuzzleState): number {
  return state.left.length + state.right.length
}

function setEditorMessage(text: string, tone: MessageTone): void {
  editorMessage.textContent = text
  editorMessage.dataset.tone = tone
  editorMessage.hidden = text.length === 0
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

type MessageTone = 'info' | 'error' | 'success'

function setActiveEditor(mode: EditorMode): void {
  structuredTabButton.classList.toggle('is-active', mode === 'structured')
  textTabButton.classList.toggle('is-active', mode === 'text')
  structuredPanel.classList.toggle('is-active', mode === 'structured')
  textPanel.classList.toggle('is-active', mode === 'text')
  structuredPanel.toggleAttribute('hidden', mode !== 'structured')
  textPanel.toggleAttribute('hidden', mode !== 'text')
}

function renderTypeList(): void {
  birdTypeList.innerHTML = ''
  if (structuredState.birdTypes.length === 0) {
    structuredState.birdTypes.push('')
  }

  structuredState.birdTypes.forEach((value, index) => {
    birdTypeList.append(createTypeRow(value, index))
  })
}

function createTypeRow(value: string, index: number): HTMLElement {
  const row = document.createElement('div')
  row.className = 'type-row'

  const input = document.createElement('input')
  input.type = 'text'
  input.placeholder = 'e.g. sparrow'
  input.value = value
  input.pattern = TYPE_PATTERN.source.replace(/^\^/, '').replace(/\$$/, '')

  input.addEventListener('input', () => {
    const trimmed = input.value.trim()
    if (trimmed === '' || TYPE_PATTERN.test(trimmed)) {
      input.setCustomValidity('')
      setBirdType(index, trimmed)
    } else {
      input.setCustomValidity('Letters, numbers, hyphen, and underscore only.')
    }
  })

  input.addEventListener('blur', () => {
    input.reportValidity()
  })

  const removeButton = document.createElement('button')
  removeButton.type = 'button'
  removeButton.className = 'type-remove'
  removeButton.textContent = 'Remove'

  removeButton.addEventListener('click', () => {
    const removed = structuredState.birdTypes.splice(index, 1)[0]
    if (removed) {
      replaceTypeInBranches(structuredState, removed, '')
    }
    renderTypeList()
    renderStructuredBranches()
  })

  row.append(input, removeButton)
  return row
}

function setBirdType(index: number, nextValue: string): void {
  const previous = structuredState.birdTypes[index]
  if (previous === nextValue) {
    return
  }
  structuredState.birdTypes[index] = nextValue

  if (previous && !nextValue) {
    replaceTypeInBranches(structuredState, previous, '')
  }

  if (previous && nextValue && previous !== nextValue) {
    replaceTypeInBranches(structuredState, previous, nextValue)
  }

  renderStructuredBranches()
}

function renderStructuredBranches(): void {
  structuredCapacityInput.value = structuredState.capacity.toString()
  renderBranchColumn('left', leftBranchSection.container)
  renderBranchColumn('right', rightBranchSection.container)
}

function renderBranchColumn(side: Side, container: HTMLElement): void {
  container.innerHTML = ''
  const branches = side === 'left' ? structuredState.leftBranches : structuredState.rightBranches
  const capacity = structuredState.capacity

  branches.forEach((row, branchIndex) => {
    ensureRowCapacity(row, capacity)
    const rowEl = document.createElement('div')
    rowEl.className = 'structured-branch-row'

    const label = document.createElement('span')
    label.className = 'structured-branch-label'
    label.textContent = `${side === 'left' ? 'L' : 'R'}${branchIndex + 1}`
    rowEl.append(label)

    for (let slotIndex = 0; slotIndex < capacity; slotIndex += 1) {
      const select = document.createElement('select')
      select.className = 'structured-slot'
      populateSlotOptions(select)
      select.value = row[slotIndex] ?? ''
      select.dataset.side = side
      select.dataset.branchIndex = branchIndex.toString()
      select.dataset.slotIndex = slotIndex.toString()
      select.addEventListener('change', handleSlotChange)
      rowEl.append(select)
    }

    container.append(rowEl)
  })
}

function populateSlotOptions(select: HTMLSelectElement): void {
  const previousValue = select.value
  select.innerHTML = ''

  const blankOption = new Option('— empty —', '')
  select.add(blankOption)

  availableBirdTypes(structuredState).forEach((type) => {
    select.add(new Option(type, type))
  })

  select.add(new Option('New…', NEW_TYPE_OPTION_VALUE))

  if (previousValue) {
    select.value = previousValue
  }
}

function handleSlotChange(event: Event): void {
  const select = event.target as HTMLSelectElement
  const side = select.dataset.side as Side
  const branchIndex = Number.parseInt(select.dataset.branchIndex ?? '-1', 10)
  const slotIndex = Number.parseInt(select.dataset.slotIndex ?? '-1', 10)

  if (!Number.isFinite(branchIndex) || !Number.isFinite(slotIndex)) {
    return
  }

  if (select.value === NEW_TYPE_OPTION_VALUE) {
    const newType = promptForNewType()
    if (newType) {
      if (!structuredState.birdTypes.includes(newType)) {
        structuredState.birdTypes.push(newType)
      }
      renderTypeList()
      renderStructuredBranches()
      select.value = newType
      updateSlotValue(side, branchIndex, slotIndex, newType)
    } else {
      select.value = ''
      updateSlotValue(side, branchIndex, slotIndex, '')
    }
    return
  }

  updateSlotValue(side, branchIndex, slotIndex, select.value)
}

function updateSlotValue(side: Side, branchIndex: number, slotIndex: number, value: string): void {
  const branches = side === 'left' ? structuredState.leftBranches : structuredState.rightBranches
  const row = branches[branchIndex]
  if (!row) {
    return
  }
  row[slotIndex] = value
}

function promptForNewType(): string | null {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = window.prompt('Enter a bird type (letters, numbers, hyphen, underscore):')
    if (response === null) {
      return null
    }
    const trimmed = response.trim()
    if (trimmed === '') {
      // continue prompting
      // eslint-disable-next-line no-continue
      continue
    }
    if (!TYPE_PATTERN.test(trimmed)) {
      window.alert('Bird type may only contain letters, numbers, hyphen, and underscore.')
      // eslint-disable-next-line no-continue
      continue
    }
    return trimmed
  }
}

function handleBoardRowChange(detail: RowChangeDetail): void {
  if (!boardEditState) {
    return
  }

  const branches = detail.side === 'left' ? boardEditState.left : boardEditState.right
  const targetBranch = branches[detail.branchIndex]
  if (!targetBranch) {
    return
  }

  const cleaned = detail.values
    .map((value) => value.trim())
    .filter((value) => value.length > 0) as Bird[]
  const limited = cleaned.slice(0, targetBranch.capacity)

  const updatedBranch: Branch = {
    ...targetBranch,
    birds: [...limited],
  }

  const newLeft = detail.side === 'left'
    ? boardEditState.left.map((branch, index) =>
      index === detail.branchIndex ? updatedBranch : branch
    )
    : boardEditState.left.slice()

  const newRight = detail.side === 'right'
    ? boardEditState.right.map((branch, index) =>
      index === detail.branchIndex ? updatedBranch : branch
    )
    : boardEditState.right.slice()

  boardEditState = {
    left: newLeft,
    right: newRight,
  }
}

function handleBoardNewType(): string | null {
  const newType = promptForNewType()
  if (!newType) {
    return null
  }

  if (!structuredState.birdTypes.includes(newType)) {
    structuredState.birdTypes.push(newType)
    renderTypeList()
  }

  window.setTimeout(() => {
    updateView()
  }, 0)

  return newType
}

function collectBirdTypes(state: PuzzleState): string[] {
  const types = new Set<string>(availableBirdTypes(structuredState))
  const collectSide = (branches: ReadonlyArray<Branch>) => {
    branches.forEach((branch) => {
      branch.birds.forEach((bird) => {
        if (bird.trim().length > 0) {
          types.add(bird)
        }
      })
    })
  }

  collectSide(state.left)
  collectSide(state.right)

  return Array.from(types)
}

function updateBoardControls(): void {
  boardEditButton.textContent = isBoardEditable ? 'Done' : 'Edit'
  boardEditButton.setAttribute('aria-pressed', isBoardEditable ? 'true' : 'false')
  stateContainer.classList.toggle('is-editing', isBoardEditable)
}
