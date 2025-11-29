import { Injectable, OnModuleInit } from '@nestjs/common';
import { LevelsService } from './levels.service';

@Injectable()
export class LevelSeederService implements OnModuleInit {
  constructor(private readonly levelsService: LevelsService) { }

  async onModuleInit() {
    await this.seedLevels();
  }

  private async seedLevels() {
    const levelsCount = 20; // Expanded to 20 levels
    const tileTypes = [
      'carrot', 'wheat', 'wood', 'grass', 'stone', 'coin', 'shovel',
    ];

    for (let i = 1; i <= levelsCount; i++) {
      const levelId = `level-${i}`;
      console.log(`Seeding/Updating ${levelId}...`);

      const config = this.getLevelConfig(i);
      const levelData = this.generateLevelData(config, tileTypes);

      await this.levelsService.create(levelId, levelData, i);
    }
  }

  private getLevelConfig(level: number) {
    // Difficulty Curve: 1-20
    // Phase 1: Tutorial (L1)
    // Phase 2: Strategy (L2-L5)
    // Phase 3: Hell (L6-L10)
    // Phase 4: Nightmare (L11-L15)
    // Phase 5: Abyss (L16-L20)
    switch (level) {
      // Phase 1
      case 1: return { tiles: 21, layers: 2, pattern: 'staggered', width: 3, height: 3 };

      // Phase 2
      case 2: return { tiles: 54, layers: 4, pattern: 'brick', width: 5, height: 5 };
      case 3: return { tiles: 72, layers: 5, pattern: 'pyramid', size: 5 };
      case 4: return { tiles: 90, layers: 6, pattern: 'spiral', turns: 2.5 };
      case 5: return { tiles: 108, layers: 7, pattern: 'cross', size: 6 };

      // Phase 3
      case 6: return { tiles: 135, layers: 8, pattern: 'staggered', width: 6, height: 7 };
      case 7: return { tiles: 162, layers: 9, pattern: 'pyramid', size: 7 };
      case 8: return { tiles: 189, layers: 10, pattern: 'spiral', turns: 4 };
      case 9: return { tiles: 216, layers: 11, pattern: 'random', density: 0.9 };
      case 10: return { tiles: 240, layers: 12, pattern: 'boss', size: 8 };

      // Phase 4: Nightmare
      case 11: return { tiles: 261, layers: 13, pattern: 'brick', width: 7, height: 8 };
      case 12: return { tiles: 279, layers: 13, pattern: 'pyramid', size: 8 };
      case 13: return { tiles: 300, layers: 14, pattern: 'spiral', turns: 5 };
      case 14: return { tiles: 315, layers: 14, pattern: 'cross', size: 8 };
      case 15: return { tiles: 330, layers: 15, pattern: 'boss', size: 9 };

      // Phase 5: Abyss
      case 16: return { tiles: 345, layers: 15, pattern: 'random', density: 1.0 };
      case 17: return { tiles: 360, layers: 16, pattern: 'staggered', width: 8, height: 9 };
      case 18: return { tiles: 375, layers: 16, pattern: 'spiral', turns: 6 };
      case 19: return { tiles: 390, layers: 17, pattern: 'brick', width: 8, height: 9 };
      case 20: return { tiles: 420, layers: 18, pattern: 'boss', size: 10 };

      default: return { tiles: 30, layers: 2, pattern: 'random' };
    }
  }

  private generateLevelData(config: any, types: string[]) {
    const totalTiles = Math.ceil(config.tiles / 3) * 3;
    // Pool is no longer needed here, types are assigned later
    const tiles: any[] = [];

    const centerX = 375;
    const centerY = 480; // Safe center
    const tileSize = 80;

    let tileIndex = 0;
    const tilesPerLayer = Math.ceil(totalTiles / config.layers);

    // Helper to add a tile
    const addTile = (x: number, y: number, layer: number) => {
      if (tileIndex >= totalTiles) return;

      // Add slight jitter for natural look
      const jitter = 4;
      const jX = (Math.random() - 0.5) * jitter;
      const jY = (Math.random() - 0.5) * jitter;

      tiles.push({
        id: `tile-${tileIndex}`,
        type: null, // Assigned later
        x: x + jX,
        y: y + jY,
        layer: layer,
        row: 0, col: 0
      });
      tileIndex++;
    };

    // Generation Strategies
    for (let l = 0; l < config.layers; l++) {
      const layerTiles = Math.min(tilesPerLayer, totalTiles - tileIndex);
      if (layerTiles <= 0) break;

      // Calculate layer offset (higher layers slightly offset to show depth)
      // Visual Layering: Offset every other layer by half a tile to expose corners below
      const halfSize = tileSize / 2;
      const structuralOffsetX = (l % 2) * halfSize;
      const structuralOffsetY = (l % 2) * halfSize;

      // Random jitter for natural look (kept small)
      const layerOffsetX = (Math.random() - 0.5) * 5;
      const layerOffsetY = (Math.random() - 0.5) * 5;

      let placed = 0;

      if (config.pattern === 'staggered' || config.pattern === 'brick') {
        const w = config.width || 4;
        const h = config.height || 4;
        const startX = centerX - ((w - 1) * tileSize) / 2;
        const startY = centerY - ((h - 1) * tileSize) / 2;

        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            if (placed >= layerTiles) break;
            // Brick: Offset every other row
            const rowOffset = (config.pattern === 'brick' && r % 2 !== 0) ? tileSize / 2 : 0;
            addTile(
              startX + c * tileSize + rowOffset + layerOffsetX + structuralOffsetX,
              startY + r * tileSize + layerOffsetY + structuralOffsetY,
              l + 1
            );
            placed++;
          }
        }
      }
      else if (config.pattern === 'pyramid') {
        const size = config.size || 4;
        for (let r = 0; r < size; r++) {
          const rowWidth = size - Math.abs(r - size / 2) * 1.5; // Tapering
          const startRowX = centerX - (rowWidth * tileSize) / 2;
          const rowY = centerY - (size * tileSize) / 2 + r * tileSize;

          for (let c = 0; c < rowWidth; c++) {
            if (placed >= layerTiles) break;
            addTile(
              startRowX + c * tileSize + layerOffsetX + structuralOffsetX,
              rowY + layerOffsetY + structuralOffsetY,
              l + 1
            );
            placed++;
          }
        }
      }
      else if (config.pattern === 'spiral') {
        // Grid Spiral Walk (Right -> Down -> Left -> Up)
        let x = 0;
        let y = 0;
        let dx = 1;
        let dy = 0;
        let segmentLength = 1;
        let segmentPassed = 0;
        let turns = 0;

        while (placed < layerTiles) {
          // Constrain to safe area: Col [-4, 4], Row [-4, 6]
          if (Math.abs(x) <= 4 && y >= -4 && y <= 6) {
            addTile(
              centerX + x * tileSize + layerOffsetX + structuralOffsetX,
              centerY + y * tileSize + layerOffsetY + structuralOffsetY,
              l + 1
            );
            placed++;
          }

          x += dx;
          y += dy;
          segmentPassed++;

          if (segmentPassed >= segmentLength) {
            segmentPassed = 0;
            // Rotate direction
            const temp = dx;
            dx = -dy;
            dy = temp;
            turns++;
            if (turns % 2 === 0) {
              segmentLength++;
            }
          }

          // Safety break to prevent infinite loops if spiral grows too large
          if (Math.abs(x) > 10 || Math.abs(y) > 10) break;
        }
      }
      else if (config.pattern === 'cross') {
        const size = config.size || 5;
        const startX = centerX - (size * tileSize) / 2;
        const startY = centerY - (size * tileSize) / 2;

        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            if (placed >= layerTiles) break;
            if (i === j || i + j === size - 1) {
              addTile(
                startX + j * tileSize + structuralOffsetX,
                startY + i * tileSize + structuralOffsetY,
                l + 1
              );
              placed++;
            }
          }
        }
        // Fill remaining with random grid slots
        const occupied = new Set<string>();
        // Mark cross as occupied
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            if (i === j || i + j === size - 1) {
              occupied.add(`${Math.floor(startX / tileSize) + j},${Math.floor(startY / tileSize) + i}`);
            }
          }
        }

        while (placed < layerTiles) {
          const rC = Math.floor((Math.random() - 0.5) * 8);
          const rR = Math.floor((Math.random() - 0.5) * 8);
          const key = `${rC},${rR}`;
          if (!occupied.has(key)) {
            addTile(
              centerX + rC * tileSize + structuralOffsetX,
              centerY + rR * tileSize + structuralOffsetY,
              l + 1
            );
            occupied.add(key);
            placed++;
          }
        }
      }
      else if (config.pattern === 'boss') {
        // Boss: Dense Center Grid + Outer Scatter
        const centerSize = 4;
        const startX = centerX - ((centerSize - 1) * tileSize) / 2;
        const startY = centerY - ((centerSize - 1) * tileSize) / 2;

        // 1. Fill Center Grid
        for (let r = 0; r < centerSize; r++) {
          for (let c = 0; c < centerSize; c++) {
            if (placed >= layerTiles) break;
            addTile(
              startX + c * tileSize + structuralOffsetX,
              startY + r * tileSize + structuralOffsetY,
              l + 1
            );
            placed++;
          }
        }

        // 2. Scatter remaining in outer ring
        const occupied = new Set<string>();
        while (placed < layerTiles) {
          // Constrain to safe area: Col [-4, 4], Row [-4, 6]
          const rC = Math.floor(Math.random() * 9) - 4; // -4 to 4
          const rR = Math.floor(Math.random() * 11) - 4; // -4 to 6

          // Check if inside center (approximate center grid is -1.5 to 1.5)
          const inCenter = Math.abs(rC) <= 1 && Math.abs(rR) <= 1;
          const key = `${rC},${rR}`;

          if (!inCenter && !occupied.has(key)) {
            addTile(
              centerX + rC * tileSize + structuralOffsetX,
              centerY + rR * tileSize + structuralOffsetY,
              l + 1
            );
            occupied.add(key);
            placed++;
          }
        }
      }
      else {
        // Random Grid (No Overlap)
        const occupied = new Set<string>();
        while (placed < layerTiles) {
          // Constrain to safe area: Col [-4, 4], Row [-4, 6]
          const rC = Math.floor(Math.random() * 9) - 4; // -4 to 4
          const rR = Math.floor(Math.random() * 11) - 4; // -4 to 6
          const key = `${rC},${rR}`;

          if (!occupied.has(key)) {
            addTile(
              centerX + rC * tileSize + structuralOffsetX,
              centerY + rR * tileSize + structuralOffsetY,
              l + 1
            );
            occupied.add(key);
            placed++;
          }
        }
      }
    }

    // 4. Assign types ensuring solvability
    this.assignSolvableTypes(tiles, types);

    return {
      id: `level-generated`,
      tiles,
      gridSize: { cols: 8, rows: 8 },
    };
  }

  private assignSolvableTypes(tiles: any[], types: string[]) {
    // 1. Build Dependency Graph
    const blockers = new Map<string, string[]>(); // tileId -> list of tileIds that block it
    const blocking = new Map<string, string[]>(); // tileId -> list of tileIds it blocks
    const tileMap = new Map<string, any>();

    tiles.forEach(t => {
      blockers.set(t.id, []);
      blocking.set(t.id, []);
      tileMap.set(t.id, t);
    });

    for (let i = 0; i < tiles.length; i++) {
      for (let j = 0; j < tiles.length; j++) {
        if (i === j) continue;
        const tileA = tiles[i];
        const tileB = tiles[j];

        // Check if A blocks B (A is above B)
        if (tileA.layer > tileB.layer) {
          // Check overlap (Strict 80x80)
          const xOverlap = Math.abs(tileA.x - tileB.x) < 80;
          const yOverlap = Math.abs(tileA.y - tileB.y) < 80;

          if (xOverlap && yOverlap) {
            blockers.get(tileB.id)?.push(tileA.id);
            blocking.get(tileA.id)?.push(tileB.id);
          }
        }
      }
    }

    // 2. Solvability Simulation
    const currentBlockers = new Map<string, number>();
    tiles.forEach(t => {
      currentBlockers.set(t.id, blockers.get(t.id)?.length || 0);
    });

    const available: string[] = [];
    tiles.forEach(t => {
      if ((currentBlockers.get(t.id) || 0) === 0) {
        available.push(t.id);
      }
    });

    let assignedCount = 0;
    const totalTiles = tiles.length;

    while (assignedCount < totalTiles) {
      let group: string[] = [];

      if (available.length >= 3) {
        for (let k = 0; k < 3; k++) {
          const idx = Math.floor(Math.random() * available.length);
          group.push(available[idx]);
          available.splice(idx, 1);
        }
      } else {
        // Stuck case: Take all available, fill rest from unassigned
        group = [...available];
        available.length = 0;

        const unassigned = tiles.filter(t => !t.type && !group.includes(t.id));
        while (group.length < 3 && unassigned.length > 0) {
          const idx = Math.floor(Math.random() * unassigned.length);
          group.push(unassigned[idx].id);
          unassigned.splice(idx, 1);
        }
      }

      if (group.length === 0) {
        console.warn(`Could not find any tiles to assign! Assigned: ${assignedCount}/${totalTiles}`);
        break;
      }

      const type = types[Math.floor(Math.random() * types.length)];
      group.forEach(tid => {
        const t = tileMap.get(tid);
        if (t) t.type = type;

        const blockedByThis = blocking.get(tid) || [];
        blockedByThis.forEach(blockedId => {
          const current = currentBlockers.get(blockedId) || 0;
          if (current > 0) {
            currentBlockers.set(blockedId, current - 1);
            if (current - 1 === 0) {
              if (!tileMap.get(blockedId).type) {
                available.push(blockedId);
              }
            }
          }
        });
      });

      assignedCount += group.length;
    }

    // Final check
    const unassignedCount = tiles.filter(t => !t.type).length;
    if (unassignedCount > 0) {
      console.error(`Finished assignment with ${unassignedCount} unassigned tiles!`);
      // Emergency fill
      tiles.filter(t => !t.type).forEach(t => {
        t.type = types[Math.floor(Math.random() * types.length)];
      });
    }
  }
}
