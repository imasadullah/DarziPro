import * as crypto from 'crypto';
import { AppDataSource } from '../config/data-source';
import { User } from '../database/entities/user.entity';

export interface UserSession {
  id: number;
  username: string;
  fullName: string;
  role: 'owner' | 'staff';
}

export class AuthService {
  private static currentUserSession: UserSession | null = null;

  public static getCurrentUser(): UserSession | null {
    return this.currentUserSession;
  }

  public static setCurrentUser(user: User | null): void {
    if (!user) {
      this.currentUserSession = null;
    } else {
      this.currentUserSession = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role
      };
    }
  }

  public static hash(text: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const salt = crypto.randomBytes(16).toString('hex');
      crypto.scrypt(text, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        resolve(`${salt}:${derivedKey.toString('hex')}`);
      });
    });
  }

  public static verify(text: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const parts = hash.split(':');
      const salt = parts[0];
      const key = parts[1];
      if (!salt || !key) {
        return resolve(false);
      }
      crypto.scrypt(text, salt, 64, (err, derivedKey) => {
        if (err) return reject(err);
        const buffer = Buffer.from(key, 'hex');
        if (derivedKey.length !== buffer.length) {
          return resolve(false);
        }
        resolve(crypto.timingSafeEqual(derivedKey, buffer));
      });
    });
  }

  public static async hasUsers(): Promise<boolean> {
    const userRepository = AppDataSource.getRepository(User);
    const count = await userRepository.count();
    return count > 0;
  }

  public static async registerOwner(data: { username: string; fullName: string; password: string; pin?: string }): Promise<UserSession> {
    const userRepository = AppDataSource.getRepository(User);

    // Validate if owner already exists
    const hasUsers = await this.hasUsers();
    if (hasUsers) {
      throw new Error('Owner is already registered. Please login.');
    }

    const passwordHash = await this.hash(data.password);
    const pinHash = data.pin ? await this.hash(data.pin) : undefined;

    const user = new User();
    user.username = data.username.toLowerCase();
    user.fullName = data.fullName;
    user.passwordHash = passwordHash;
    user.pinHash = pinHash;
    user.role = 'owner';
    user.status = 'active';

    const savedUser = await userRepository.save(user);
    this.setCurrentUser(savedUser);
    return this.getCurrentUser()!;
  }

  public static async login(credentials: { username: string; password: string }): Promise<UserSession> {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { username: credentials.username.toLowerCase(), status: 'active' }
    });

    if (!user) {
      throw new Error('Invalid username or password.');
    }

    const isValid = await this.verify(credentials.password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid username or password.');
    }

    this.setCurrentUser(user);
    return this.getCurrentUser()!;
  }

  public static async loginWithPIN(pin: string): Promise<UserSession> {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({ where: { status: 'active' } });

    for (const user of users) {
      if (user.pinHash) {
        const isValid = await this.verify(pin, user.pinHash);
        if (isValid) {
          this.setCurrentUser(user);
          return this.getCurrentUser()!;
        }
      }
    }

    throw new Error('Invalid PIN.');
  }

  public static logout(): void {
    this.setCurrentUser(null);
  }
}
