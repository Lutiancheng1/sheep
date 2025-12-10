import { IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(1, { message: '用户名不能为空' })
  @Matches(/^\S+$/, { message: '用户名不能包含空格' })
  username!: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password!: string;
}
