export interface TileConfig {
  row: number;
  col: number;
  layer: number;
  type: string;
  x?: number;
  y?: number;
}

export interface GridSize {
  cols: number;
  rows: number;
}

export interface LevelData {
  tiles: TileConfig[];
  gridSize: GridSize;
}
