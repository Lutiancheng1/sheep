import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLog } from './user-log.entity';
import { User } from '../users/user.entity';

@Injectable()
export class UserLogsService {
  constructor(
    @InjectRepository(UserLog)
    private logsRepository: Repository<UserLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async logAction(
    userId: string,
    action: string,
    details?: Record<string, any>,
  ) {
    console.log('UserLogsService.logAction called for:', userId, action);
    const log = this.logsRepository.create({
      userId,
      action,
      details,
    });
    return this.logsRepository.save(log);
  }

  async getLogs(userId?: string, action?: string, limit = 50, offset = 0) {
    const query = this.logsRepository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (userId) {
      query.andWhere('log.userId = :userId', { userId });
    }

    if (action) {
      query.andWhere('log.action = :action', { action });
    }

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }

  async handleHeartbeat(userId: string, durationSeconds: number) {
    // 1. Log the heartbeat (optional, maybe too noisy? Let's log it for now but maybe with minimal details)
    // await this.logAction(userId, 'HEARTBEAT', { duration: durationSeconds });

    // 2. Update User total playtime
    // We use increment to be safe with concurrent requests
    await this.userRepository.increment(
      { id: userId },
      'totalPlaytimeSeconds',
      durationSeconds,
    );
  }
}
