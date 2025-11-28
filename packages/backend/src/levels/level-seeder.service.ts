import { Injectable, OnModuleInit } from '@nestjs/common';
import { LevelsService } from './levels.service';

@Injectable()
export class LevelSeederService implements OnModuleInit {
  constructor(private readonly levelsService: LevelsService) {}

  async onModuleInit() {
    await this.seedLevels();
  }

  private async seedLevels() {
    const levelsCount = 10;
    const tileTypes = [
      'carrot',
      'wheat',
      'wood',
      'grass',
      'stone',
      'coin',
      'shovel',
    ];

    for (let i = 1; i <= levelsCount; i++) {
      const levelId = `level-${i}`;
      const existing = await this.levelsService.findOne(levelId);
      if (existing) {
        console.log(`Level ${levelId} already exists. Skipping.`);
        continue;
      }

      console.log(`Seeding ${levelId}...`);
      const difficulty = i;
      // 1->2, 2->2, 3->3, 4->3, ... 最大 6 层
      const layerCount = Math.min(Math.ceil(i / 2) + 1, 6);
      // 21, 42, 63, ...
      const tilesCount = 21 + (i - 1) * 21;

      const levelData = this.generateLevelData(
        tilesCount,
        layerCount,
        tileTypes,
      );
      await this.levelsService.create(levelId, levelData, difficulty);
    }
  }

  private generateLevelData(
    totalTiles: number,
    layers: number,
    types: string[],
  ) {
    // 确保总数能被 3 整除
    const adjustedTotal = Math.ceil(totalTiles / 3) * 3;

    // 生成类型池
    const pool: string[] = [];
    for (let i = 0; i < adjustedTotal / 3; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      pool.push(type, type, type);
    }

    // 打乱类型池
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const tiles = [];
    const tileSize = 80;
    const centerX = 375;
    const centerY = 400; // 棋盘中心区域

    // 生成位置
    // 策略：同心圆或带噪点的网格
    // 为了确保"可解性"（宽松），我们将方块分层放置。
    // 高层覆盖低层。

    let tileIndex = 0;
    const tilesPerLayer = Math.ceil(adjustedTotal / layers);

    for (let l = 0; l < layers; l++) {
      // 为每一层放置方块
      // 我们使用带有一些随机性的网格
      const cols = 6;
      const rows = 7;

      const layerTilesCount = Math.min(
        tilesPerLayer,
        adjustedTotal - tileIndex,
      );

      for (let k = 0; k < layerTilesCount; k++) {
        if (tileIndex >= pool.length) break;

        // 随机网格位置
        const col = Math.floor(Math.random() * cols) - cols / 2 + 0.5; // -2.5 to 2.5
        const row = Math.floor(Math.random() * rows) - rows / 2 + 0.5; // -3.5 to 3.5

        // 添加一些抖动
        const jitterX = (Math.random() - 0.5) * 10;
        const jitterY = (Math.random() - 0.5) * 10;

        const x = centerX + col * (tileSize + 5) + jitterX;
        const y = centerY + row * (tileSize + 5) + jitterY;

        tiles.push({
          id: `tile-${tileIndex}`,
          type: pool[tileIndex],
          x,
          y,
          layer: l + 1, // 1-based layer
          row: 0, // 前端如果有 x/y 则不严格使用
          col: 0,
        });

        tileIndex++;
      }
    }

    return {
      id: `level-generated`,
      tiles,
      gridSize: { cols: 8, rows: 8 }, // 元数据
    };
  }
}
