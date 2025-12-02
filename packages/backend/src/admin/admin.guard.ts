import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type {
  JwtPayload,
  AdminRequest,
} from '../types/express-request.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      // 验证是否为管理员角色
      if (payload.role !== 'admin') {
        console.log(
          `[AdminGuard] 非管理员尝试访问 - role: ${payload.role || 'undefined'}`,
        );
        return false;
      }

      // 将payload附加到请求对象
      request.user = payload as AdminRequest['user'];
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('[AdminGuard] Token 验证失败:', errorMessage);
      return false;
    }
  }

  private extractTokenFromHeader(request: AdminRequest): string | undefined {
    const authHeader = request.headers.authorization;

    // Express headers 的 authorization 可能是 string | string[] | undefined
    if (!authHeader || Array.isArray(authHeader)) {
      return undefined;
    }

    // 现在 TypeScript 知道 authHeader 是 string 类型
    const parts: string[] = authHeader.split(' ');
    const [type, token]: [string | undefined, string | undefined] = [
      parts[0],
      parts[1],
    ];

    return type === 'Bearer' && token ? token : undefined;
  }
}
