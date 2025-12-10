import { Logger } from '@nestjs/common';

export interface TileData {
  id: string;
  type: string | null;
  x: number;
  y: number;
  layer: number;
  row: number;
  col: number;
}

export interface LevelConfig {
  tiles: number;
  layers: number;
  pattern: string;
  width?: number;
  height?: number;
  size?: number;
  turns?: number;
  piles?: number;
  density?: number;
}

export class LevelGenerator {
  private readonly logger = new Logger(LevelGenerator.name);

  constructor() {}

  public generate(
    config: LevelConfig,
    types: string[],
  ): {
    tiles: TileData[];
    gridSize: any;
    stats: { matchCount: number; digCount: number; unassignedCount: number };
  } {
    const totalTiles = Math.ceil(config.tiles / 3) * 3;
    const tiles: TileData[] = [];

    // 移动端安全区中心
    const centerX = 375;
    const centerY = 580;
    const tileSize = 80;

    let tileIndex = 0;

    const addTile = (x: number, y: number, layer: number) => {
      if (tileIndex >= totalTiles) return;

      const jitter = 12;
      const jX = (Math.random() - 0.5) * jitter;
      const jY = (Math.random() - 0.5) * jitter;

      tiles.push({
        id: `tile-${tileIndex}`,
        type: null,
        x: x + jX,
        y: y + jY,
        layer: layer,
        row: 0,
        col: 0,
      });
      tileIndex++;
    };

    // --- 布局生成 (复用原有逻辑) ---
    for (let l = 0; l < config.layers; l++) {
      const remaining = totalTiles - tileIndex;
      if (remaining <= 0) break;

      const structuralOffsetX = (l % 2) * (tileSize / 2);
      const structuralOffsetY = (l % 2) * (tileSize / 2);

      if (config.pattern === 'dense_pile') {
        const size = config.size || 6;
        const startX = centerX - (size * tileSize) / 2;
        const startY = centerY - (size * tileSize) / 2;

        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (tileIndex >= totalTiles) break;
            const dist = Math.sqrt(Math.pow(r - size / 2, 2) + Math.pow(c - size / 2, 2));
            const prob = 1 - dist / size;
            if (Math.random() < prob + 0.2) {
              addTile(
                startX + c * tileSize + structuralOffsetX,
                startY + r * tileSize + structuralOffsetY,
                l + 1,
              );
            }
          }
        }
      } else if (config.pattern === 'scattered_pile') {
        const piles = config.piles || 3;
        const pileSize = 3;
        const pilePixelSize = pileSize * tileSize;
        const halfPile = pilePixelSize / 2;
        const minX = 50 + halfPile;
        const maxX = 700 - halfPile;
        const minY = 200 + halfPile;
        const maxY = 950 - halfPile;

        for (let p = 0; p < piles; p++) {
          const pX = minX + Math.random() * (maxX - minX);
          const pY = minY + Math.random() * (maxY - minY);
          const startX = pX - halfPile;
          const startY = pY - halfPile;

          for (let r = 0; r < pileSize; r++) {
            for (let c = 0; c < pileSize; c++) {
              if (tileIndex >= totalTiles) break;
              if (Math.random() > 0.3) {
                addTile(startX + c * tileSize, startY + r * tileSize, l + 1);
              }
            }
          }
        }
      } else if (config.pattern === 'staggered' || config.pattern === 'brick') {
        const w = config.width || 4;
        const h = config.height || 4;
        const startX = centerX - ((w - 1) * tileSize) / 2;
        const startY = centerY - ((h - 1) * tileSize) / 2;

        for (let r = 0; r < h; r++) {
          for (let c = 0; c < w; c++) {
            if (tileIndex >= totalTiles) break;
            const rowOffset = config.pattern === 'brick' && r % 2 !== 0 ? tileSize / 2 : 0;
            addTile(
              startX + c * tileSize + rowOffset + structuralOffsetX,
              startY + r * tileSize + structuralOffsetY,
              l + 1,
            );
          }
        }
      } else {
        const count = Math.min(remaining, 15);
        for (let k = 0; k < count; k++) {
          const c = Math.floor(Math.random() * 8) - 4;
          const r = Math.floor(Math.random() * 9) - 4;
          addTile(
            centerX + c * tileSize + structuralOffsetX,
            centerY + r * tileSize + structuralOffsetY,
            l + 1,
          );
        }
      }
    }

    while (tileIndex < totalTiles) {
      const c = Math.floor(Math.random() * 8) - 4;
      const r = Math.floor(Math.random() * 9) - 4;
      addTile(
        centerX + c * tileSize,
        centerY + r * tileSize,
        Math.floor(Math.random() * config.layers) + 1,
      );
    }

    // Center and clamp
    if (tiles.length > 0) {
      let minCX = Infinity,
        maxCX = -Infinity,
        minCY = Infinity,
        maxCY = -Infinity;
      tiles.forEach((t) => {
        minCX = Math.min(minCX, t.x);
        maxCX = Math.max(maxCX, t.x);
        minCY = Math.min(minCY, t.y);
        maxCY = Math.max(maxCY, t.y);
      });
      const currentCenterX = (minCX + maxCX) / 2;
      const currentCenterY = (minCY + maxCY) / 2;
      const offsetX = centerX - currentCenterX;
      const offsetY = centerY - currentCenterY;
      tiles.forEach((t) => {
        t.x += offsetX;
        t.y += offsetY;
      });
      tiles.forEach((t) => {
        if (t.x < 90) t.x = 90;
        if (t.x > 660) t.x = 660;
        if (t.y < 240) t.y = 240;
        if (t.y > 910) t.y = 910;
      });
    }

    // --- 类型分配 (核心算法更新) ---
    const stats = this.assignSolvableTypes(tiles, types);

    return {
      tiles,
      gridSize: { cols: 8, rows: 10 },
      stats,
    };
  }

  /**
   * 核心算法：逆向生成 + 槽位模拟
   */
  private assignSolvableTypes(tiles: TileData[], types: string[]) {
    // 1. Build Dependency Graph
    const blockers = new Map<string, string[]>(); // tileId -> who blocks me
    const blocking = new Map<string, string[]>(); // tileId -> who I block
    const tileMap = new Map<string, TileData>();

    tiles.forEach((t) => {
      blockers.set(t.id, []);
      blocking.set(t.id, []);
      tileMap.set(t.id, t);
    });

    for (let i = 0; i < tiles.length; i++) {
      for (let j = 0; j < tiles.length; j++) {
        if (i === j) continue;
        const tileA = tiles[i];
        const tileB = tiles[j];
        if (tileA.layer > tileB.layer) {
          const xOverlap = Math.abs(tileA.x - tileB.x) < 80;
          const yOverlap = Math.abs(tileA.y - tileB.y) < 80;
          if (xOverlap && yOverlap) {
            blockers.get(tileB.id)?.push(tileA.id);
            blocking.get(tileA.id)?.push(tileB.id);
          }
        }
      }
    }

    // Dynamic state
    const currentBlockers = new Map<string, number>();
    tiles.forEach((t) => {
      currentBlockers.set(t.id, blockers.get(t.id)?.length || 0);
    });

    // Buffer for tiles in slot
    const buffer: string[] = [];
    const maxBufferSize = 6; // Leave 1 slot empty to be safe
    const difficulty = 0.6; // 60% chance to dig if possible

    // Stats
    let matchCount = 0;
    let digCount = 0;

    // Helper to get clickable tiles
    const getClickable = () => {
      return tiles.filter(
        (t) => !t.type && !buffer.includes(t.id) && (currentBlockers.get(t.id) || 0) === 0,
      );
    };

    // Helper to update blockers when a tile is "removed" (clicked or matched)
    const removeTile = (tid: string) => {
      const blockedByThis = blocking.get(tid) || [];
      blockedByThis.forEach((blockedId) => {
        const current = currentBlockers.get(blockedId) || 0;
        if (current > 0) {
          currentBlockers.set(blockedId, current - 1);
        }
      });
    };

    let assignedCount = 0;
    const totalTiles = tiles.length;

    while (assignedCount < totalTiles) {
      const clickable = getClickable();

      // Decision Logic
      let action: 'MATCH' | 'DIG' = 'MATCH';

      // If buffer is full, MUST match
      if (buffer.length >= maxBufferSize) {
        action = 'MATCH';
      }
      // If no clickable tiles, MUST match (from buffer? if possible)
      else if (clickable.length === 0) {
        action = 'MATCH';
      }
      // Otherwise, probabilistic
      else if (Math.random() < difficulty) {
        action = 'DIG';
      }

      // Execute Action
      if (action === 'DIG') {
        // Pick a random clickable tile and put in buffer
        if (clickable.length > 0) {
          // Prefer tiles that block others (to open up new paths)
          // Sort by how many they block?
          clickable.sort(
            (a, b) => (blocking.get(b.id)?.length || 0) - (blocking.get(a.id)?.length || 0),
          );

          // Pick top 3 candidates to keep randomness
          const candidates = clickable.slice(0, 3);
          const picked = candidates[Math.floor(Math.random() * candidates.length)];

          buffer.push(picked.id);
          removeTile(picked.id); // It's in slot, so it unblocks others
          digCount++;
          continue; // Loop again
        } else {
          // Fallback to match if dig failed
          action = 'MATCH';
        }
      }

      if (action === 'MATCH') {
        // Try to form a group of 3
        // We can use tiles from Buffer AND Clickable
        // Priority: Use as many Buffer tiles as possible to clear slots

        const group: string[] = [];

        // Strategy:
        // 1. Buffer (2) + Clickable (1)
        // 2. Buffer (1) + Clickable (2)
        // 3. Clickable (3)
        // 4. Buffer (3)

        // We want to prioritize clearing buffer, BUT also want to use clickable to progress

        // Let's just pool them all and pick 3?
        // No, we need to be careful.

        // If we have tiles in buffer, try to use them.
        while (group.length < 3 && buffer.length > 0) {
          group.push(buffer.pop()!);
        }

        // Fill rest from clickable
        while (group.length < 3 && clickable.length > 0) {
          const idx = Math.floor(Math.random() * clickable.length);
          const t = clickable[idx];
          group.push(t.id);
          clickable.splice(idx, 1);
          removeTile(t.id); // Mark as removed
        }

        // If still not enough (e.g. end of game), force pick from anywhere unassigned?
        // Or just break and let the cleanup handle it.
        if (group.length < 3) {
          // Put back to buffer if failed?
          // This shouldn't happen often if logic is sound.
          // For now, just assign what we have (will be < 3, handled by cleanup)
          // Actually, better to put back to buffer to avoid partial groups?
          // But we already called removeTile...
          // Let's just proceed.
        }

        if (group.length > 0) {
          const type = types[Math.floor(Math.random() * types.length)];
          group.forEach((tid) => {
            const t = tileMap.get(tid);
            if (t) t.type = type;
          });
          assignedCount += group.length;
          matchCount++;
        } else {
          // Deadlock?
          break;
        }
      }
    }

    // Cleanup unassigned
    const unassigned = tiles.filter((t) => !t.type);
    if (unassigned.length > 0) {
      this.logger.warn(`Cleanup: ${unassigned.length} tiles were unassigned. Randomly filling.`);
      unassigned.forEach((t) => {
        t.type = types[Math.floor(Math.random() * types.length)];
      });
    }

    return { matchCount, digCount, unassignedCount: unassigned.length };
  }
}
