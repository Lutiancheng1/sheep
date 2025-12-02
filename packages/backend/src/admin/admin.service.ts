import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async validateAdmin(username: string, password: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({ where: { username } });

    if (!admin) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    return admin;
  }

  async createAdmin(username: string, password: string): Promise<Admin> {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = this.adminRepository.create({
      username,
      passwordHash,
    });
    return this.adminRepository.save(admin);
  }

  async findByUsername(username: string): Promise<Admin | null> {
    return this.adminRepository.findOne({ where: { username } });
  }
}
