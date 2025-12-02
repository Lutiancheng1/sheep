import { Request } from 'express';

// 用户请求接口(普通用户)
export interface UserRequest extends Request {
  user: {
    id: string;
    username: string;
  };
}

// 管理员请求接口
export interface AdminRequest extends Request {
  user: {
    sub: string;
    username: string;
    role: 'admin';
  };
}

// JWT Payload 接口
export interface JwtPayload {
  sub: string;
  username: string;
  role?: 'admin';
  iat?: number;
  exp?: number;
}
