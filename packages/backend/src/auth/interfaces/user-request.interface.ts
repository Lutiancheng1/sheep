import { Request } from 'express';

export interface AuthUser {
  id: string;
  username: string;
}

export interface UserRequest extends Request {
  user: AuthUser;
}
