import { Injectable, OnModuleInit } from '@nestjs/common';
import { LevelsService } from './levels.service';

interface TileData {
  id: string;
  type: string | null;
  x: number;
  y: number;
  layer: number;
  row: number;
  col: number;
}

interface LevelConfig {
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

@Injectable()
export class LevelSeederService implements OnModuleInit {
  constructor(private readonly levelsService: LevelsService) {}

  async onModuleInit() {
    await this.seedLevels();
  }

  private async seedLevels() {
    const levelsCount = 20;

    for (let i = 1; i <= levelsCount; i++) {
      const levelId = `level-${i}`;
      console.log(`Seeding/Updating ${levelId}...`);

      const config = this.getLevelConfig(i);
      const types = this.getTileTypesForLevel();
      const levelData = this.generateLevelData(config, types);

      await this.levelsService.create(levelId, levelData, i, 'published');
    }
  }

  private getTileTypesForLevel(): string[] {
    return [
      'carrot',
      'wheat',
      'wood',
      'grass',
      'stone',
      'coin',
      'shovel',
      'corn',
      'milk',
      'egg',
      'wool',
      'apple',
      'pumpkin',
      'flower',
    ];
  }

  private getLevelConfig(level: number): LevelConfig {
    // 难度曲线: 1-20
    // 移动端安全区: X[40, 710], Y[150, 900]
    // 中心 Y: 525

    switch (level) {
      // 第一阶段: 教学
      case 1:
        return {
          tiles: 24,
          layers: 2,
          pattern: 'staggered',
          width: 3,
          height: 4,
        };

      // 第二阶段: 叹息之墙 (难度激增)
      // 模仿原版游戏: 难度巨大跳跃
      case 2:
        return { tiles: 210, layers: 20, pattern: 'dense_pile', size: 6 }; // ~70 组三消

      // 第三阶段: 策略与耐力
      case 3:
        return { tiles: 180, layers: 15, pattern: 'scattered_pile', piles: 3 };
      case 4:
        return { tiles: 240, layers: 18, pattern: 'spiral', turns: 4 };
      case 5:
        return { tiles: 270, layers: 22, pattern: 'dense_pile', size: 7 };

      // 第四阶段: 地狱模式
      case 6:
        return { tiles: 300, layers: 25, pattern: 'pyramid', size: 8 };
      case 7:
        return { tiles: 330, layers: 28, pattern: 'scattered_pile', piles: 4 };
      case 8:
        return { tiles: 360, layers: 30, pattern: 'dense_pile', size: 8 };
      case 9:
        return { tiles: 390, layers: 32, pattern: 'random', density: 1.2 };
      case 10:
        return { tiles: 420, layers: 35, pattern: 'boss', size: 9 };

      // 第五阶段: 噩梦模式 (L11-L20) - 增加密度和层数
      default:
        return {
          tiles: 300 + (level - 10) * 30,
          layers: 20 + (level - 10) * 2,
          pattern: level % 2 === 0 ? 'dense_pile' : 'scattered_pile',
          piles: 3 + Math.floor((level - 10) / 3),
        };
    }
  }

  private generateLevelData(config: LevelConfig, types: string[]) {
    const totalTiles = Math.ceil(config.tiles / 3) * 3;
    const tiles: TileData[] = [];

    // 移动端安全区中心
    const centerX = 375;
    const centerY = 580; // 从 525 下移至 580 以获得更好的垂直居中效果
    const tileSize = 80;

    let tileIndex = 0;

    // 添加方块的辅助函数
    const addTile = (x: number, y: number, layer: number) => {
      if (tileIndex >= totalTiles) return;

      // 增加抖动以产生“凌乱”感（下方方块更难看清）
      const jitter = 12;
      const jX = (Math.random() - 0.5) * jitter;
      const jY = (Math.random() - 0.5) * jitter;

      tiles.push({
        id: `tile-${tileIndex}`,
        type: null, // 稍后分配
        x: x + jX,
        y: y + jY,
        layer: layer,
        row: 0,
        col: 0,
      });
      tileIndex++;
    };

    // 生成策略

    for (let l = 0; l < config.layers; l++) {
      const remaining = totalTiles - tileIndex;
      if (remaining <= 0) break;

      // 视觉深度的层偏移
      const structuralOffsetX = (l % 2) * (tileSize / 2);
      const structuralOffsetY = (l % 2) * (tileSize / 2);

      if (config.pattern === 'dense_pile') {
        // 中心密集堆叠
        const size = config.size || 6;
        const startX = centerX - (size * tileSize) / 2;
        const startY = centerY - (size * tileSize) / 2;

        // 填充网格，但随机跳过一些以产生孔洞/不规则性
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (tileIndex >= totalTiles) break;

            // 中心位置概率更高，边缘更低
            const dist = Math.sqrt(Math.pow(r - size / 2, 2) + Math.pow(c - size / 2, 2));
            const prob = 1 - dist / size;

            if (Math.random() < prob + 0.2) {
              // 基础概率 + 邻近度
              addTile(
                startX + c * tileSize + structuralOffsetX,
                startY + r * tileSize + structuralOffsetY,
                l + 1,
              );
            }
          }
        }
      } else if (config.pattern === 'scattered_pile') {
        // 多个小堆
        const piles = config.piles || 3;
        const pileSize = 3;
        const pilePixelSize = pileSize * tileSize; // 240px
        const halfPile = pilePixelSize / 2;

        // 安全区 X: [50, 700] (收紧边距)
        // 中心必须在 [50 + half, 700 - half] 范围内
        const minX = 50 + halfPile;
        const maxX = 700 - halfPile;

        // 安全区 Y: [200, 950] (下移)
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
        // 经典模式（保留用于第1关或增加多样性）
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
        // 兜底：安全区内随机放置
        const count = Math.min(remaining, 15);

        // 安全区: X[50, 700], Y[200, 950]
        // 方块大小: 80
        // 相对于中心 (375) 的最大列索引:
        // 左: (375 - 50) / 80 = 4.06 -> -4
        // 右: (700 - 375) / 80 = 4.06 -> +3

        for (let k = 0; k < count; k++) {
          const c = Math.floor(Math.random() * 8) - 4; // -4 到 3
          const r = Math.floor(Math.random() * 9) - 4; // -4 到 4

          addTile(
            centerX + c * tileSize + structuralOffsetX,
            centerY + r * tileSize + structuralOffsetY,
            l + 1,
          );
        }
      }
    }

    // 确保达到目标数量（如果循环提前结束，用随机方块填充）
    while (tileIndex < totalTiles) {
      const c = Math.floor(Math.random() * 8) - 4;
      const r = Math.floor(Math.random() * 9) - 4;
      addTile(
        centerX + c * tileSize,
        centerY + r * tileSize,
        Math.floor(Math.random() * config.layers) + 1,
      );
    }

    // --- 生成后居中与边界检查 ---
    if (tiles.length > 0) {
      // 计算中心点的包围盒
      let minCX = Infinity,
        maxCX = -Infinity;
      let minCY = Infinity,
        maxCY = -Infinity;

      tiles.forEach((t) => {
        minCX = Math.min(minCX, t.x);
        maxCX = Math.max(maxCX, t.x);
        minCY = Math.min(minCY, t.y);
        maxCY = Math.max(maxCY, t.y);
      });

      // 计算中心点包围盒的中心
      // 这实际上代表了布局的视觉中心
      const currentCenterX = (minCX + maxCX) / 2;
      const currentCenterY = (minCY + maxCY) / 2;

      // 目标中心（屏幕中心）
      const targetCenterX = 375;
      const targetCenterY = 580;

      const offsetX = targetCenterX - currentCenterX;
      const offsetY = targetCenterY - currentCenterY;

      // 应用偏移
      tiles.forEach((t) => {
        t.x += offsetX;
        t.y += offsetY;
      });

      // 最终安全钳制
      // 前端从中心渲染方块。
      // 安全区: X[50, 700], Y[200, 950]
      // 方块半径 = 40
      // 所以中心必须在 [50+40, 700-40] = [90, 660] 范围内
      // Y 中心必须在 [200+40, 950-40] = [240, 910] 范围内

      tiles.forEach((t) => {
        if (t.x < 90) t.x = 90;
        if (t.x > 660) t.x = 660;
        if (t.y < 240) t.y = 240;
        if (t.y > 910) t.y = 910;
      });
    }

    // 4. 分配类型以确保可解性
    this.assignSolvableTypes(tiles, types);

    return {
      id: `level-generated`,
      tiles,
      gridSize: { cols: 8, rows: 10 },
    };
  }

  private assignSolvableTypes(tiles: TileData[], types: string[]) {
    // 1. 构建依赖图
    const blockers = new Map<string, string[]>(); // tileId -> 阻挡它的 tileId 列表
    const blocking = new Map<string, string[]>(); // tileId -> 它阻挡的 tileId 列表
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

        // 检查 A 是否阻挡 B (A 在 B 上方)
        if (tileA.layer > tileB.layer) {
          // 检查重叠 (严格 80x80)
          const xOverlap = Math.abs(tileA.x - tileB.x) < 80;
          const yOverlap = Math.abs(tileA.y - tileB.y) < 80;

          if (xOverlap && yOverlap) {
            blockers.get(tileB.id)?.push(tileA.id);
            blocking.get(tileA.id)?.push(tileB.id);
          }
        }
      }
    }

    // 2. 可解性模拟
    const currentBlockers = new Map<string, number>();
    tiles.forEach((t) => {
      currentBlockers.set(t.id, blockers.get(t.id)?.length || 0);
    });

    const available: string[] = [];
    tiles.forEach((t) => {
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
          // 随机选择可用方块以避免线性解锁
          const idx = Math.floor(Math.random() * available.length);
          group.push(available[idx]);
          available.splice(idx, 1);
        }
      } else {
        // 卡死情况: 取所有可用，其余从“未分配”中填充
        group = [...available];
        available.length = 0;

        const unassigned = tiles.filter((t) => !t.type && !group.includes(t.id));
        while (group.length < 3 && unassigned.length > 0) {
          // 紧急从“未分配”中选取 (可能会破坏严格的可解性，但防止崩溃)
          // 理想情况下应该回溯，但对于这个游戏，“稍微作弊”是可以接受的
          // 或者依赖道具 (洗牌/撤回)
          const idx = Math.floor(Math.random() * unassigned.length);
          group.push(unassigned[idx].id);
          unassigned.splice(idx, 1);
        }
      }

      if (group.length === 0) {
        console.warn(
          `Could not find any tiles to assign! Assigned: ${assignedCount}/${totalTiles}`,
        );
        break;
      }

      const type = types[Math.floor(Math.random() * types.length)];
      group.forEach((tid) => {
        const t = tileMap.get(tid);
        if (t) t.type = type;

        const blockedByThis = blocking.get(tid) || [];
        blockedByThis.forEach((blockedId) => {
          const current = currentBlockers.get(blockedId) || 0;
          if (current > 0) {
            currentBlockers.set(blockedId, current - 1);
            if (current - 1 === 0) {
              const blockedTile = tileMap.get(blockedId);
              if (blockedTile && !blockedTile.type) {
                available.push(blockedId);
              }
            }
          }
        });
      });

      assignedCount += group.length;
    }

    // 最终检查
    const unassignedCount = tiles.filter((t) => !t.type).length;
    if (unassignedCount > 0) {
      console.error(`Finished assignment with ${unassignedCount} unassigned tiles!`);
      // 紧急填充
      tiles
        .filter((t) => !t.type)
        .forEach((t) => {
          t.type = types[Math.floor(Math.random() * types.length)];
        });
    }
  }
}
