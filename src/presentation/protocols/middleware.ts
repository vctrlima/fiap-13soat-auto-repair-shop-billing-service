import { User } from '@/domain/entities';

export interface Middleware<T = any> {
  handle: (httpRequest: T) => Promise<Partial<User> | void>;
}
