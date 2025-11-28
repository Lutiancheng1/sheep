export interface UserRequest extends Express.Request {
  user: {
    id: string;
    username: string;
  };
}
