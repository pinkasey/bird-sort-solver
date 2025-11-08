import './style.css'
import { formatStateForEditor, parseLevelInput } from './levelParser'
import { demoLevel } from './levels'
import { solve } from './solver'
import { renderMoves, renderState } from './ui'
import type { RowChangeDetail } from './ui'
import type { Bird, Branch, Move, PuzzleState, Side } from './types'

type EditorMode = 'structured' | 'text'

interface StructuredState {
  capacity: number
  birdTypes: string[]
  leftBranches: string[][]
  rightBranches: string[][]
}

const NEW_TYPE_OPTION_VALUE = '__new__'
const TYPE_PATTERN = /^[A-Za-z0-9_-]+$/

const appRoot = document.querySelector<HTMLDivElement>('#app')

if (!appRoot) {
  throw new Error('Missing app root element')
}

const header = document.createElement('header')
header.className = 'app-header'
header.innerHTML = `
  <h1>Bird Branch Sort</h1>
  <p>Arrange the birds so each branch holds a single species, then watch them fly away.</p>
`

const boardContainer = document.createElement('section')
boardContainer.className = 'board-container'

const stateContainer = document.createElement('div')
stateContainer.className = 'state-view'

const boardActions = document.createElement('div')
boardActions.className = 'board-actions'

const boardEditButton = document.createElement('button')
boardEditButton.type = 'button'
boardEditButton.className = 'board-edit-button'
boardEditButton.textContent = 'Edit'

const boardCreateButton = document.createElement('button')
boardCreateButton.type = 'button'
boardCreateButton.className = 'board-create-button'
boardCreateButton.textContent = 'Create Level from Current'

boardActions.append(boardEditButton, boardCreateButton)

const boardView = document.createElement('div')
boardView.className = 'board-view'

stateContainer.append(boardActions, boardView)

const sidebar = document.createElement('aside')
sidebar.className = 'sidebar'

const editorPanel = document.createElement('details')
editorPanel.className = 'level-editor'
editorPanel.open = true

const editorSummary = document.createElement('summary')
editorSummary.textContent = 'Create a Level'

const editorTabs = document.createElement('div')
editorTabs.className = 'editor-tabs'

const structuredTabButton = document.createElement('button')
structuredTabButton.type = 'button'
structuredTabButton.className = 'editor-tab is-active'
structuredTabButton.textContent = 'Structured'

const textTabButton = document.createElement('button')
textTabButton.type = 'button'
textTabButton.className = 'editor-tab'
textTabButton.textContent = 'Text'

editorTabs.append(structuredTabButton, textTabButton)

const structuredPanel = document.createElement('div')
structuredPanel.className = 'tab-panel is-active'

const textPanel = document.createElement('div')
textPanel.className = 'tab-panel'

const editorMessage = document.createElement('p')
editorMessage.className = 'editor-message'
editorMessage.hidden = true

editorPanel.append(editorSummary, editorTabs, structuredPanel, textPanel)

const controls = document.createElement('div')
controls.className = 'controls'

const prevButton = document.createElement('button')
prevButton.type = 'button'
prevButton.textContent = 'Previous'

const nextButton = document.createElement('button')
nextButton.type = 'button'
nextButton.textContent = 'Next'

const resetButton = document.createElement('button')
resetButton.type = 'button'
resetButton.textContent = 'Reset'

controls.append(prevButton, nextButton, resetButton)

const status = document.createElement('p')
status.className = 'status'

const movesContainer = document.createElement('div')
movesContainer.className = 'moves-container'

sidebar.append(editorPanel, editorMessage, controls, status, movesContainer)
boardContainer.append(stateContainer, sidebar)
appRoot.append(header, boardContainer)

let states: PuzzleState[] = []
let moves: Move[] = []
let solverFoundSolution = false
let currentIndex = 0
let structuredState: StructuredState = createStructuredState(demoLevel)
let isBoardEditable = false
let boardEditState: PuzzleState | null = null

const structuredForm = document.createElement('form')
structuredForm.className = 'structured-form'
structuredForm.noValidate = true

const structuredCapacityField = document.createElement('label')
structuredCapacityField.className = 'field'
const structuredCapacityLabel = document.createElement('span')
structuredCapacityLabel.textContent = 'Branch capacity'
const structuredCapacityInput = document.createElement('input')
structuredCapacityInput.type = 'number'
structuredCapacityInput.min = '1'
structuredCapacityInput.required = true
structuredCapacityInput.inputMode = 'numeric'
structuredCapacityField.append(structuredCapacityLabel, structuredCapacityInput)

const birdTypePanel = document.createElement('details')
birdTypePanel.className = 'type-panel'
birdTypePanel.open = true
const birdTypeSummary = document.createElement('summary')
birdTypeSummary.textContent = 'Bird types'
const birdTypeList = document.createElement('div')
birdTypeList.className = 'type-list'
const addTypeButton = document.createElement('button')
addTypeButton.type = 'button'
addTypeButton.className = 'type-add'
addTypeButton.textContent = 'Add type'
birdTypePanel.append(birdTypeSummary, birdTypeList, addTypeButton)

const structuredBranches = document.createElement('div')
structuredBranches.className = 'structured-branches'

const leftBranchSection = createBranchSection('left', 'Left branches')
const rightBranchSection = createBranchSection('right', 'Right branches')

structuredBranches.append(leftBranchSection.section, rightBranchSection.section)

const structuredActions = document.createElement('div')
structuredActions.className = 'editor-actions'
const structuredSolveButton = document.createElement('button')
structuredSolveButton.type = 'submit'
structuredSolveButton.textContent = 'Solve Level'
const structuredLoadDemoButton = document.createElement('button')
structuredLoadDemoButton.type = 'button'
structuredLoadDemoButton.textContent = 'Load Demo'
structuredActions.append(structuredSolveButton, structuredLoadDemoButton)

structuredForm.append(
  structuredCapacityField,
  birdTypePanel,
  structuredBranches,
  structuredActions
)

structuredPanel.append(structuredForm)

const textForm = document.createElement('form')
textForm.className = 'text-editor-form'
textForm.noValidate = true

const textHint = document.createElement('p')
textHint.className = 'level-hint'
textHint.textContent = 'Use "ID: birdA birdB" per line. Order birds outermost → innermost. Birds vanish once a branch fills with one species.'

const textCapacityField = document.createElement('label')
textCapacityField.className = 'field'
const textCapacityLabel = document.createElement('span')
textCapacityLabel.textContent = 'Branch capacity'
const textCapacityInput = document.createElement('input')
textCapacityInput.type = 'number'
textCapacityInput.min = '1'
textCapacityInput.required = true
textCapacityInput.inputMode = 'numeric'
textCapacityField.append(textCapacityLabel, textCapacityInput)

const leftField = document.createElement('label')
leftField.className = 'field'
const leftLabel = document.createElement('span')
leftLabel.textContent = 'Left branches'
const leftTextarea = document.createElement('textarea')
leftTextarea.rows = 6
leftTextarea.placeholder = 'L1: sparrow finch\nL2: heron sparrow'
leftField.append(leftLabel, leftTextarea)

const rightField = document.createElement('label')
rightField.className = 'field'
const rightLabel = document.createElement('span')
rightLabel.textContent = 'Right branches'
const rightTextarea = document.createElement('textarea')
rightTextarea.rows = 6
rightTextarea.placeholder = 'R1: finch heron\nR2: sparrow finch'
rightField.append(rightLabel, rightTextarea)

const textActions = document.createElement('div')
textActions.className = 'editor-actions'
const textSolveButton = document.createElement('button')
textSolveButton.type = 'submit'
textSolveButton.textContent = 'Solve Level'
const textLoadDemoButton = document.createElement('button')
textLoadDemoButton.type = 'button'
textLoadDemoButton.textContent = 'Load Demo'
textActions.append(textSolveButton, textLoadDemoButton)

textForm.append(textHint, textCapacityField, leftField, rightField, textActions)
textPanel.append(textForm)

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
    resizeBranchesToCapacity(next)
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
    const puzzle = structuredToPuzzle()
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
  structuredState.leftBranches.push(createEmptyRow())
  renderStructuredBranches()
})

rightBranchSection.addButton.addEventListener('click', () => {
  structuredState.rightBranches.push(createEmptyRow())
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

function createStructuredState(puzzle: PuzzleState): StructuredState {
  const capacity = puzzle.left[0]?.capacity ?? puzzle.right[0]?.capacity ?? 3
  const typeSet = new Set<string>()
  puzzle.left.forEach((branch) => branch.birds.forEach((bird) => typeSet.add(bird)))
  puzzle.right.forEach((branch) => branch.birds.forEach((bird) => typeSet.add(bird)))

  const birdTypes = Array.from(typeSet)
  if (birdTypes.length === 0) {
    birdTypes.push('')
  }

  const leftBranches = puzzle.left.map((branch) => padRow(branch.birds.slice().reverse(), capacity))
  const rightBranches = puzzle.right.map((branch) => padRow(branch.birds.slice(), capacity))

  if (leftBranches.length === 0) {
    leftBranches.push(new Array(capacity).fill(''))
  }
  if (rightBranches.length === 0) {
    rightBranches.push(new Array(capacity).fill(''))
  }

  return {
    capacity,
    birdTypes,
    leftBranches,
    rightBranches,
  }
}

function padRow(values: string[], capacity: number): string[] {
  const row = values.slice(0, capacity)
  while (row.length < capacity) {
    row.push('')
  }
  return row
}

function resizeBranchesToCapacity(capacity: number): void {
  structuredState.leftBranches.forEach((row) => adjustRow(row, capacity))
  structuredState.rightBranches.forEach((row) => adjustRow(row, capacity))
}

function adjustRow(row: string[], capacity: number): void {
  if (row.length > capacity) {
    row.splice(capacity)
  } else {
    while (row.length < capacity) {
      row.push('')
    }
  }
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
      replaceTypeInBranches(removed, '')
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
    replaceTypeInBranches(previous, '')
  }

  if (previous && nextValue && previous !== nextValue) {
    replaceTypeInBranches(previous, nextValue)
  }

  renderStructuredBranches()
}

function replaceTypeInBranches(oldValue: string, newValue: string): void {
  const updateSide = (branches: string[][]) => {
    branches.forEach((row) => {
      row.forEach((bird, index) => {
        if (bird === oldValue) {
          row[index] = newValue
        }
      })
    })
  }

  updateSide(structuredState.leftBranches)
  updateSide(structuredState.rightBranches)
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
    adjustRow(row, capacity)
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

  availableBirdTypes().forEach((type) => {
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

function availableBirdTypes(): Bird[] {
  const seen = new Set<string>()
  const list: Bird[] = []
  structuredState.birdTypes.forEach((raw) => {
    const candidate = raw.trim()
    if (TYPE_PATTERN.test(candidate) && !seen.has(candidate)) {
      seen.add(candidate)
      list.push(candidate)
    }
  })
  return list
}

function createEmptyRow(): string[] {
  return new Array(structuredState.capacity).fill('')
}

function structuredToPuzzle(): PuzzleState {
  const capacity = structuredState.capacity
  if (!Number.isFinite(capacity) || capacity <= 0) {
    throw new Error('Branch capacity must be a positive integer.')
  }

  const validTypes = new Set(availableBirdTypes())
  const ensureRowCapacity = (row: string[]) => {
    adjustRow(row, capacity)
  }

  structuredState.leftBranches.forEach(ensureRowCapacity)
  structuredState.rightBranches.forEach(ensureRowCapacity)

  const buildBranches = (branches: string[][], side: Side) =>
    branches.map((row, index) => {
      const birds = row.filter((value) => value.trim().length > 0) as Bird[]
      birds.forEach((bird) => {
        if (!validTypes.has(bird)) {
          throw new Error(`Bird type "${bird}" is not defined.`)
        }
      })

      const idPrefix = side === 'left' ? 'L' : 'R'
      const id = `${idPrefix}${index + 1}`

      const branchBirds = side === 'left' ? birds.slice().reverse() : birds.slice()

      return {
        id,
        side,
        capacity,
        birds: branchBirds,
      }
    })

  const leftBranches = buildBranches(structuredState.leftBranches, 'left')
  const rightBranches = buildBranches(structuredState.rightBranches, 'right')

  if (leftBranches.length === 0 && rightBranches.length === 0) {
    throw new Error('Define at least one branch on either side.')
  }

  return {
    left: leftBranches,
    right: rightBranches,
  }
}

function createBranchSection(side: Side, headingText: string) {
  const section = document.createElement('section')
  section.className = `structured-branch-section structured-branch-section-${side}`
  const heading = document.createElement('h3')
  heading.textContent = headingText
  const container = document.createElement('div')
  container.className = 'structured-branch-container'
  const addButton = document.createElement('button')
  addButton.type = 'button'
  addButton.className = 'branch-add'
  addButton.textContent = 'Add branch'

  section.append(heading, container, addButton)

  return { section, container, addButton }
}

function cloneState(state: PuzzleState): PuzzleState {
  return {
    left: state.left.map(cloneBranch),
    right: state.right.map(cloneBranch),
  }
}

function cloneBranch(branch: Branch): Branch {
  return {
    ...branch,
    birds: [...branch.birds],
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
  const types = new Set<string>(availableBirdTypes())
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
