import type { Bird, Branch, PuzzleState, Side } from './types'

export interface StructuredState {
	capacity: number
	birdTypes: string[]
	leftBranches: string[][]
	rightBranches: string[][]
}

export const NEW_TYPE_OPTION_VALUE = '__new__'
export const TYPE_PATTERN = /^[A-Za-z0-9_-]+$/

export function createStructuredState(puzzle: PuzzleState): StructuredState {
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

export function resizeBranchesToCapacity(state: StructuredState, capacity: number): void {
	state.leftBranches.forEach((row) => ensureRowCapacity(row, capacity))
	state.rightBranches.forEach((row) => ensureRowCapacity(row, capacity))
}

export function ensureRowCapacity(row: string[], capacity: number): void {
	if (row.length > capacity) {
		row.splice(capacity)
	} else {
		while (row.length < capacity) {
			row.push('')
		}
	}
}

export function replaceTypeInBranches(state: StructuredState, oldValue: string, newValue: string): void {
	const updateSide = (branches: string[][]) => {
		branches.forEach((row) => {
			row.forEach((bird, index) => {
				if (bird === oldValue) {
					row[index] = newValue
				}
			})
		})
	}

	updateSide(state.leftBranches)
	updateSide(state.rightBranches)
}

export function availableBirdTypes(state: StructuredState): Bird[] {
	const seen = new Set<string>()
	const list: Bird[] = []
	state.birdTypes.forEach((raw) => {
		const candidate = raw.trim()
		if (TYPE_PATTERN.test(candidate) && !seen.has(candidate)) {
			seen.add(candidate)
			list.push(candidate)
		}
	})
	return list
}

export function createEmptyRow(capacity: number): string[] {
	return new Array(capacity).fill('')
}

export function structuredStateToPuzzle(state: StructuredState): PuzzleState {
	const capacity = state.capacity
	if (!Number.isFinite(capacity) || capacity <= 0) {
		throw new Error('Branch capacity must be a positive integer.')
	}

	const validTypes = new Set(availableBirdTypes(state))
	const ensureRow = (row: string[]) => {
		ensureRowCapacity(row, capacity)
	}

	state.leftBranches.forEach(ensureRow)
	state.rightBranches.forEach(ensureRow)

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
			} satisfies Branch
		})

	const leftBranches = buildBranches(state.leftBranches, 'left')
	const rightBranches = buildBranches(state.rightBranches, 'right')

	if (leftBranches.length === 0 && rightBranches.length === 0) {
		throw new Error('Define at least one branch on either side.')
	}

	return {
		left: leftBranches,
		right: rightBranches,
	}
}

export function cloneBranch(branch: Branch): Branch {
	return {
		...branch,
		birds: [...branch.birds],
	}
}

export function cloneState(state: PuzzleState): PuzzleState {
	return {
		left: state.left.map(cloneBranch),
		right: state.right.map(cloneBranch),
	}
}

function padRow(values: string[], capacity: number): string[] {
	const row = values.slice(0, capacity)
	while (row.length < capacity) {
		row.push('')
	}
	return row
}
