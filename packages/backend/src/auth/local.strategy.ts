import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(username: string, pass: string): Promise<any> {
    console.log('LocalStrategy.validate called for:', username);
    const user = await this.authService.validateUser(username, pass);
    if (!user) {
      console.log('LocalStrategy.validate failed for:', username);
      throw new UnauthorizedException('用户名或密码错误');
    }
    console.log('LocalStrategy.validate success for:', username);
    return user;
  }
}
