import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserLogsService } from '../user-logs/user-logs.service';
import dayjs from 'dayjs';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userLogsService: UserLogsService,
  ) {}

  private readonly DAILY_LIMIT = 2;

  async getItemStatus(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    this.checkAndResetDailyUsage(user);
    await this.userRepository.save(user);

    const usage = user.dailyItemUsage || {};

    return {
      limits: {
        remove: this.DAILY_LIMIT,
        undo: this.DAILY_LIMIT,
        shuffle: this.DAILY_LIMIT,
      },
      usage: {
        remove: usage.remove || 0,
        undo: usage.undo || 0,
        shuffle: usage.shuffle || 0,
      },
    };
  }

  async useItem(userId: string, type: 'remove' | 'undo' | 'shuffle') {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    this.checkAndResetDailyUsage(user);

    // Clone the object to ensure TypeORM detects the change
    // Ensure it's an object
    let usage = user.dailyItemUsage;
    if (typeof usage !== 'object' || usage === null) {
      usage = { remove: 0, undo: 0, shuffle: 0 };
    } else {
      usage = { ...usage };
    }

    // Ensure all keys exist for safety
    if (typeof usage.remove !== 'number') usage.remove = 0;
    if (typeof usage.undo !== 'number') usage.undo = 0;
    if (typeof usage.shuffle !== 'number') usage.shuffle = 0;

    const currentUsage = usage[type] || 0;

    this.logger.log(
      `用户 ${userId} 使用道具 ${type}，当前次数: ${currentUsage}，限制: ${this.DAILY_LIMIT}`,
    );

    if (currentUsage >= this.DAILY_LIMIT) {
      this.logger.warn(`用户 ${userId} 的道具 ${type} 已达每日限制`);
      return { success: false, message: 'Daily limit reached' };
    }

    usage[type] = currentUsage + 1;
    user.dailyItemUsage = usage;

    this.logger.log(`保存用户 ${userId} 的新使用次数: ${JSON.stringify(usage)}`);

    await this.userRepository.save(user);

    // Log the action
    await this.userLogsService.logAction(userId, 'ITEM_USE', {
      type,
      remaining: this.DAILY_LIMIT - usage[type],
    });

    return { success: true, remaining: this.DAILY_LIMIT - usage[type] };
  }

  private checkAndResetDailyUsage(user: User) {
    const now = dayjs();
    const lastReset = dayjs(user.lastItemResetDate);

    // If last reset was not today
    if (!lastReset.isSame(now, 'day')) {
      user.dailyItemUsage = { remove: 0, undo: 0, shuffle: 0 };
      user.lastItemResetDate = now.toDate();
    }
  }
}
