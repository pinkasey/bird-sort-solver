export type Bird = string

export type Side = 'left' | 'right'

export interface Branch {
  readonly id: string
  readonly side: Side
  readonly capacity: number
  readonly birds: ReadonlyArray<Bird>
}

export interface PuzzleState {
  readonly left: ReadonlyArray<Branch>
  readonly right: ReadonlyArray<Branch>
}

export interface Move {
  readonly fromSide: Side
  readonly fromIndex: number
  readonly toSide: Side
  readonly toIndex: number
  readonly bird: Bird
  readonly fromId: string
  readonly toId: string
}

export interface Solution {
  readonly moves: ReadonlyArray<Move>
  readonly states: ReadonlyArray<PuzzleState>
}
