import type { Side } from './types'

export interface BranchSectionElements {
  section: HTMLElement
  container: HTMLDivElement
  addButton: HTMLButtonElement
}

export interface AppLayout {
  header: HTMLElement
  boardContainer: HTMLElement
  stateContainer: HTMLDivElement
  boardView: HTMLDivElement
  boardEditButton: HTMLButtonElement
  boardCreateButton: HTMLButtonElement
  editorPanel: HTMLDetailsElement
  editorSummary: HTMLElement
  structuredTabButton: HTMLButtonElement
  textTabButton: HTMLButtonElement
  structuredPanel: HTMLDivElement
  textPanel: HTMLDivElement
  editorMessage: HTMLParagraphElement
  structuredForm: HTMLFormElement
  structuredCapacityInput: HTMLInputElement
  birdTypeList: HTMLDivElement
  addTypeButton: HTMLButtonElement
  structuredBranches: HTMLDivElement
  leftBranchSection: BranchSectionElements
  rightBranchSection: BranchSectionElements
  structuredSolveButton: HTMLButtonElement
  structuredLoadDemoButton: HTMLButtonElement
  textForm: HTMLFormElement
  textCapacityInput: HTMLInputElement
  leftTextarea: HTMLTextAreaElement
  rightTextarea: HTMLTextAreaElement
  textSolveButton: HTMLButtonElement
  textLoadDemoButton: HTMLButtonElement
  controls: {
    prevButton: HTMLButtonElement
    nextButton: HTMLButtonElement
    resetButton: HTMLButtonElement
  }
  status: HTMLParagraphElement
  movesContainer: HTMLDivElement
}

export function createAppLayout(appRoot: HTMLDivElement): AppLayout {
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

  appRoot.append(header, boardContainer)

  return {
    header,
    boardContainer,
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
    structuredBranches,
    leftBranchSection,
    rightBranchSection,
    structuredSolveButton,
    structuredLoadDemoButton,
    textForm,
    textCapacityInput,
    leftTextarea,
    rightTextarea,
    textSolveButton,
    textLoadDemoButton,
    controls: {
      prevButton,
      nextButton,
      resetButton,
    },
    status,
    movesContainer,
  }
}

function createBranchSection(side: Side, headingText: string): BranchSectionElements {
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
