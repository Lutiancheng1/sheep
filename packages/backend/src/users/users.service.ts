import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(
    username: string,
    passwordHash?: string,
    isGuest: boolean = false,
  ): Promise<User> {
    const user = this.usersRepository.create({
      username,
      passwordHash,
      isGuest,
    });
    return this.usersRepository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData);
    return this.usersRepository.findOne({ where: { id } }) as Promise<User>;
  }

  async findAll(): Promise<any[]> {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Fetch additional data for each user
    const usersWithDetails = users.map((user) => {
      // 1. Get max score from Redis global leaderboard
      // Note: This requires injecting Redis service or using Redis client directly.
      // For simplicity, we'll assume 0 if not found or implement Redis injection.
      // Ideally, we should inject LeaderboardService, but circular dependency might occur.
      // Let's use a raw Redis client or move this logic to Controller/Facade.
      // Given the current setup, let's return basic info first and handle Redis in Controller or here if we inject Redis.
      // 2. Get max level from GameProgress
      // We need to inject GameProgress repository or service.
      return {
        ...user,
        maxScore: 0, // Placeholder, will implement in Controller or Service with Redis
        currentLevel: 1, // Placeholder
      };
    });

    return usersWithDetails;
  }
}
