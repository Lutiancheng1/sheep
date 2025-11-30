import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import dayjs from 'dayjs';

@Injectable()
export class ItemsService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

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
        const usage = { ...(user.dailyItemUsage || {}) };

        // Ensure all keys exist for safety
        if (typeof usage.remove !== 'number') usage.remove = 0;
        if (typeof usage.undo !== 'number') usage.undo = 0;
        if (typeof usage.shuffle !== 'number') usage.shuffle = 0;

        const currentUsage = usage[type] || 0;

        if (currentUsage >= this.DAILY_LIMIT) {
            return { success: false, message: 'Daily limit reached' };
        }

        usage[type] = currentUsage + 1;
        user.dailyItemUsage = usage;

        await this.userRepository.save(user);

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
