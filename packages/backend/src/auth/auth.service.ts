import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UserLogsService } from '../user-logs/user-logs.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private userLogsService: UserLogsService,
  ) {}

  async validateUser(
    username: string,
    pass: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findOne(username);
    console.log(
      'AuthService.validateUser found user:',
      user ? user.id : 'null',
    );
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: { id: string; username: string }) {
    const payload = { username: user.username, sub: user.id };
    try {
      await this.userLogsService.logAction(user.id, 'LOGIN', {
        username: user.username,
      });
    } catch (error) {
      console.error('Failed to log login action:', error);
    }
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(username: string, pass: string) {
    const existingUser = await this.usersService.findOne(username);
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(pass, salt);
    const user = await this.usersService.create(username, hash);
    return this.login(user);
  }

  async guestLogin() {
    const username = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const user = await this.usersService.create(username, undefined, true);
    return this.login(user);
  }

  async bind(userId: string, username: string, pass: string) {
    // 1. Check if username is taken
    const existingUser = await this.usersService.findOne(username);
    if (existingUser) {
      throw new UnauthorizedException('Username already taken');
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(pass, salt);

    // 3. Update user entity
    const user = await this.usersService.update(userId, {
      username,
      passwordHash: hash,
      isGuest: false,
    });

    // 4. Return new token (optional, but good practice as username changed)
    return this.login(user);
  }
}
