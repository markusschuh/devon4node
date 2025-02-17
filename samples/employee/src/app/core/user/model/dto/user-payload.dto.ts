import { User } from '../entity/user.entity';

export class UserPayload implements Pick<User, 'id' | 'username' | 'role'> {
  id!: number;
  username!: string;
  role!: number;
}
