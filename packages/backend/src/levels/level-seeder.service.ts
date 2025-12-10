import { Injectable, OnModuleInit } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { LevelGenerator, LevelConfig } from './level-generator';

@Injectable()
export class LevelSeederService implements OnModuleInit {
  private generator: LevelGenerator;

  constructor(private readonly levelsService: LevelsService) {
    this.generator = new LevelGenerator();
  }

  async onModuleInit() {
    await this.seedLevels();
  }

  private async seedLevels() {
    const levelsCount = 20;

    for (let i = 1; i <= levelsCount; i++) {
      const displayName = `第${i}关`;
      console.log(`Seeding/Updating level ${i}...`);

      const config = this.getLevelConfig(i);
      const types = this.getTileTypesForLevel();

      // Use the new generator
      const levelData = this.generator.generate(config, types);

      // 查找是否已存在相同 sortOrder 的关卡
      const existing = await this.levelsService.findBySortOrder(i);

      if (existing) {
        // 更新现有关卡
        await this.levelsService.updateLevel(existing.id, {
          levelName: displayName,
          data: levelData,
          status: 'published',
        });
      } else {
        // 创建新关卡
        await this.levelsService.create(levelData, displayName, 'published', i);
      }
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
}
