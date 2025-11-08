import './style.css'
import { formatStateForEditor, parseLevelInput } from './levelParser'
import { demoLevel } from './levels'
import { solve } from './solver'
import { renderMoves, renderState } from './ui'
import type { Move, PuzzleState } from './types'

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

const sidebar = document.createElement('aside')
sidebar.className = 'sidebar'

const editorPanel = document.createElement('details')
editorPanel.className = 'level-editor'
editorPanel.open = true

const editorSummary = document.createElement('summary')
editorSummary.textContent = 'Create a Level'

const levelEditorForm = document.createElement('form')
levelEditorForm.className = 'level-editor-form'
levelEditorForm.noValidate = true

const editorHint = document.createElement('p')
editorHint.className = 'level-hint'
editorHint.textContent = 'Use "ID: birdA birdB" per line. Order birds outermost → innermost. Birds vanish once a branch fills with one species.'

const capacityField = document.createElement('label')
capacityField.className = 'field'
const capacityLabel = document.createElement('span')
capacityLabel.textContent = 'Branch capacity'
const capacityInput = document.createElement('input')
capacityInput.type = 'number'
capacityInput.min = '1'
capacityInput.required = true
capacityInput.inputMode = 'numeric'
capacityField.append(capacityLabel, capacityInput)

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

const editorActions = document.createElement('div')
editorActions.className = 'editor-actions'

const solveButton = document.createElement('button')
solveButton.type = 'submit'
solveButton.textContent = 'Solve Level'

const loadDemoButton = document.createElement('button')
loadDemoButton.type = 'button'
loadDemoButton.textContent = 'Load Demo'

editorActions.append(solveButton, loadDemoButton)

const editorMessage = document.createElement('p')
editorMessage.className = 'editor-message'
editorMessage.hidden = true

levelEditorForm.append(
  editorHint,
  capacityField,
  leftField,
  rightField,
  editorActions
)

editorPanel.append(editorSummary, levelEditorForm)

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

levelEditorForm.addEventListener('submit', (event: SubmitEvent) => {
  event.preventDefault()
  try {
    const parsed = parseLevelInput(
      capacityInput.value,
      leftTextarea.value,
      rightTextarea.value
    )
    applySolution(parsed, 'custom')
    editorPanel.open = false
    editorSummary.focus()
  } catch (error) {
    setEditorMessage(errorMessage(error), 'error')
  }
})

loadDemoButton.addEventListener('click', () => {
  populateEditorFromState(demoLevel)
  applySolution(demoLevel, 'demo')
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

populateEditorFromState(demoLevel)
applySolution(demoLevel, 'demo')

function populateEditorFromState(state: PuzzleState): void {
  const formatted = formatStateForEditor(state)
  capacityInput.value = formatted.capacity.toString()
  leftTextarea.value = formatted.left
  rightTextarea.value = formatted.right
}

function applySolution(baseState: PuzzleState, source: 'demo' | 'custom'): void {
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
  renderState(stateContainer, state)
  renderMoves(movesContainer, moves, currentIndex)
  status.textContent = formatStatus(currentIndex, states.length, solverFoundSolution)

  prevButton.disabled = currentIndex === 0
  nextButton.disabled = currentIndex >= states.length - 1
  resetButton.disabled = currentIndex === 0 || states.length <= 1
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
