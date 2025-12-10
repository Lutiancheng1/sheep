import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserLogsService } from '../user-logs/user-logs.service';
import { SystemConfigService } from '../config/system-config.service';
import dayjs from 'dayjs';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);

  constructor(
    @InjectRepository(User)
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userLogsService: UserLogsService,
    private systemConfigService: SystemConfigService,
  ) {}

  private readonly DAILY_LIMIT = 2;

  async getItemStatus(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    await this.checkAndResetDailyUsage(user);
    await this.userRepository.save(user);

    const config = await this.systemConfigService.getConfig();

    // Ensure inventory exists
    const inventory = user.itemInventory || { remove: 0, undo: 0, shuffle: 0 };

    return {
      limits: {
        // Props don't have daily limits anymore, but we return -1 or similar to indicate "unlimited"/inventory based
        // Or we can just return the inventory count as the "limit" for frontend compatibility if needed,
        // but better to be explicit.
        // For now, let's return the inventory count as the "remaining" logic in frontend might expect a limit.
        // Actually, the frontend probably expects { limits, usage }.
        // If we want to show "Remaining: 5", we can set limit=5, usage=0.
        remove: inventory.remove,
        undo: inventory.undo,
        shuffle: inventory.shuffle,
        revive: config.dailyReviveLimit,
      },
      usage: {
        remove: 0, // Inventory based, so "usage" relative to current inventory is 0
        undo: 0,
        shuffle: 0,
        revive: user.dailyReviveUsage || 0,
      },
      inventory: inventory, // Add explicit inventory for clearer API
    };
  }

  async useItem(userId: string, type: 'remove' | 'undo' | 'shuffle' | 'revive') {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    await this.checkAndResetDailyUsage(user);

    const config = await this.systemConfigService.getConfig();

    if (type === 'revive') {
      const limit = config.dailyReviveLimit;
      const currentUsage = user.dailyReviveUsage || 0;

      if (currentUsage >= limit) {
        return { success: false, message: '今日复活次数已达上限' };
      }

      user.dailyReviveUsage = currentUsage + 1;
      await this.userRepository.save(user);

      await this.userLogsService.logAction(userId, 'ITEM_USE', {
        type,
        remaining: limit - user.dailyReviveUsage,
      });

      return { success: true, remaining: limit - user.dailyReviveUsage };
    } else {
      // Props Logic (Inventory)
      // Ensure inventory exists
      let inventory = user.itemInventory;
      if (!inventory) {
        inventory = { remove: 0, undo: 0, shuffle: 0 };
      }

      const count = inventory[type] || 0;

      if (count <= 0) {
        return { success: false, message: '道具数量不足' };
      }

      inventory[type] = count - 1;
      user.itemInventory = { ...inventory }; // Reassign to trigger update

      await this.userRepository.save(user);

      await this.userLogsService.logAction(userId, 'ITEM_USE', {
        type,
        remaining: inventory[type],
      });

      return { success: true, remaining: inventory[type] };
    }
  }

  private async checkAndResetDailyUsage(user: User) {
    const config = await this.systemConfigService.getConfig();
    const resetHour = config.dailyResetHour;

    const now = dayjs();
    const lastReset = dayjs(user.lastItemResetDate);

    // Calculate the reset time for today
    let todayResetTime = dayjs().hour(resetHour).minute(0).second(0).millisecond(0);

    // If now is before the reset time, the relevant reset time was yesterday
    if (now.isBefore(todayResetTime)) {
      todayResetTime = todayResetTime.subtract(1, 'day');
    }

    // If last reset was before the calculated reset time, we need to reset
    if (lastReset.isBefore(todayResetTime)) {
      this.logger.log(
        `Resetting daily usage for user ${user.id}. Last reset: ${lastReset.format()}, Target reset: ${todayResetTime.format()}`,
      );
      // Only reset revive usage
      user.dailyReviveUsage = 0;
      user.lastItemResetDate = now.toDate();
    }
  }
}
