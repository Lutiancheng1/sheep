import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { User } from './user.entity';
import { GameProgress } from '../progress/game-progress.entity';
import { UserLog } from '../user-logs/user-log.entity';

interface UserWithStats extends User {
  maxScore: number;
  currentLevel: number;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(GameProgress)
    private gameProgressRepository: Repository<GameProgress>,
    @InjectRepository(UserLog)
    private userLogsRepository: Repository<UserLog>,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(username: string, passwordHash?: string, isGuest: boolean = false): Promise<User> {
    this.logger.log(`创建新用户 - username: ${username}, isGuest: ${isGuest}`);
    const user = this.usersRepository.create({
      username,
      passwordHash,
      isGuest,
      // 显式初始化道具使用次数为 0（表示未使用，剩余 DAILY_LIMIT 次）
      dailyItemUsage: { remove: 0, undo: 0, shuffle: 0 },
      lastItemResetDate: new Date(),
    });
    this.logger.log(`创建的user对象 dailyItemUsage: ${JSON.stringify(user.dailyItemUsage)}`);
    const savedUser = await this.usersRepository.save(user);
    this.logger.log(
      `用户创建成功 - id: ${savedUser.id}, dailyItemUsage: ${JSON.stringify(savedUser.dailyItemUsage)}`,
    );
    return savedUser;
  }

  async findById(id: string): Promise<User | null> {
    // 1. 尝试从缓存获取
    const cacheKey = `user:cache:${id}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as User;
    }

    // 2. 从数据库获取
    const user = await this.usersRepository.findOne({ where: { id } });

    // 3. 写入缓存 (有效期 5 分钟)
    if (user) {
      await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 300);
    }

    return user;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData);
    // 失效缓存
    await this.redis.del(`user:cache:${id}`);
    return this.usersRepository.findOne({ where: { id } }) as Promise<User>;
  }

  async findAll(): Promise<UserWithStats[]> {
    try {
      // 1. 获取所有用户
      const users = await this.usersRepository.find({
        order: { createdAt: 'DESC' },
      });

      if (users.length === 0) {
        return [];
      }

      // 2. 批量获取 Redis 中的最高分 (Pipeline)
      const pipeline = this.redis.pipeline();
      users.forEach((user) => {
        pipeline.zscore('leaderboard:global', user.id);
      });
      const scores = await pipeline.exec();

      // 3. 批量获取每个用户的最高通关关卡
      const progressData = await this.gameProgressRepository
        .createQueryBuilder('progress')
        .select('progress.userId', 'userId')
        .addSelect('MAX(progress.levelId)', 'maxLevel')
        .where('progress.status = :status', { status: 'completed' })
        .andWhere('progress.userId IN (:...userIds)', {
          userIds: users.map((u) => u.id),
        })
        .groupBy('progress.userId')
        .getRawMany<{ userId: string; maxLevel: string }>();

      // 创建 userId -> maxLevel 映射
      const levelMap = new Map<string, number>();
      progressData.forEach((item) => {
        // levelId 在数据库中是 varchar，格式可能是 "level-1", "level-2" 等
        // 提取数字部分
        const match = item.maxLevel.match(/\d+/);
        if (match) {
          const levelNum = parseInt(match[0], 10);
          if (!isNaN(levelNum)) {
            levelMap.set(item.userId, levelNum);
          }
        }
      });

      // 4. 组装数据
      return users.map((user, index) => {
        const scoreResult = scores ? scores[index] : [null, null];
        const score = scoreResult && scoreResult[1] ? parseFloat(scoreResult[1] as string) : 0;

        return {
          ...user,
          maxScore: score,
          currentLevel: levelMap.get(user.id) || 0, // 0 表示未通关任何关卡
        };
      });
    } catch (error) {
      this.logger.error('findAll error:', error);
      throw error;
    }
  }

  /**
   * 查找符合清理条件的无用游客账户
   * 条件:
   * 1. 用户名以 guest_ 开头
   * 2. 注册时间超过 7 天
   * 3. totalPlaytimeSeconds = 0 (从未游戏)
   */
  async findUselessGuests(): Promise<User[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.username LIKE :pattern', { pattern: 'guest_%' })
      .andWhere('user.createdAt < :date', { date: sevenDaysAgo })
      .andWhere('user.totalPlaytimeSeconds = 0')
      .getMany();
  }

  /**
   * 清理无用游客账户
   * 返回被删除的用户数量
   */
  async cleanupGuests(): Promise<{
    deletedCount: number;
    deletedUserIds: string[];
  }> {
    this.logger.log('开始清理无用游客账户...');
    const uselessGuests = await this.findUselessGuests();
    const userIds = uselessGuests.map((u) => u.id);

    if (userIds.length === 0) {
      this.logger.log('没有发现需要清理的游客账户');
      return { deletedCount: 0, deletedUserIds: [] };
    }

    this.logger.log(`发现 ${userIds.length} 个待清理账户, 开始删除...`);

    // 手动级联删除
    // 1. 删除用户日志
    await this.userLogsRepository.delete({ userId: In(userIds) });
    // 2. 删除游戏进度
    await this.gameProgressRepository.delete({ userId: In(userIds) });
    // 3. 删除用户
    await this.usersRepository.delete(userIds);

    // 4. 清理 Redis 排行榜数据和用户缓存
    const pipeline = this.redis.pipeline();
    userIds.forEach((id) => {
      pipeline.zrem('leaderboard:global', id);
      pipeline.del(`user:cache:${id}`);
    });
    await pipeline.exec();

    // 5. 清理所有关卡排行榜
    const levelKeys = await this.redis.keys('leaderboard:level:*');
    if (levelKeys.length > 0) {
      const levelPipeline = this.redis.pipeline();
      levelKeys.forEach((key) => {
        userIds.forEach((id) => {
          levelPipeline.zrem(key, id);
        });
      });
      await levelPipeline.exec();
      this.logger.log(`已从 ${levelKeys.length} 个关卡排行榜中移除 ${userIds.length} 个游客`);
    }

    this.logger.log(`清理完成, 共删除 ${userIds.length} 个账户`);

    return {
      deletedCount: userIds.length,
      deletedUserIds: userIds,
    };
  }

  /**
   * 删除指定用户
   * @param id 用户ID
   */
  async deleteUser(id: string): Promise<void> {
    this.logger.log(`正在删除用户: ${id}`);
    // 手动级联删除
    // 1. 删除用户日志
    await this.userLogsRepository.delete({ userId: id });
    // 2. 删除游戏进度
    await this.gameProgressRepository.delete({ userId: id });
    // 3. 删除用户
    await this.usersRepository.delete(id);

    // 4. 清理 Redis 排行榜
    await this.redis.zrem('leaderboard:global', id);

    // 5. 清理所有关卡排行榜 (扫描 leaderboard:level:* 键)
    const levelKeys = await this.redis.keys('leaderboard:level:*');
    if (levelKeys.length > 0) {
      const pipeline = this.redis.pipeline();
      levelKeys.forEach((key) => {
        pipeline.zrem(key, id);
      });
      await pipeline.exec();
      this.logger.log(`已从 ${levelKeys.length} 个关卡排行榜中移除用户 ${id}`);
    }

    // 6. 清理用户缓存
    await this.redis.del(`user:cache:${id}`);

    this.logger.log(`用户 ${id} 删除成功`);
  }
}
