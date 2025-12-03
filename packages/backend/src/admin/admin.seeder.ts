import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../admin/admin.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminSeeder {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async seed() {
    // 检查是否已存在默认管理员
    const existingAdmin = await this.adminRepository.findOne({
      where: { username: 'admin' },
    });

    if (existingAdmin) {
      console.log('[AdminSeeder] 默认管理员已存在,跳过创建');
      return;
    }

    // 创建默认管理员
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = this.adminRepository.create({
      username: 'admin',
      passwordHash,
    });

    await this.adminRepository.save(admin);
    console.log('[AdminSeeder] 默认管理员创建成功 - username: admin, password: admin123');
  }
}
