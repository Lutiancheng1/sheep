export interface TilePosition {
  x: number
  y: number
  z: number
}

export interface TileData {
  id: string
  type: string
  position: TilePosition
  isClickable: boolean
}

export interface TileConfig {
  type: string
  layer: number
  row: number
  col: number
}

export interface LevelConfig {
  id: string
  name: string
  difficulty: number
  gridSize: {
    rows: number
    cols: number
  }
  tiles: TileConfig[]
}
