process.env.NODE_ENV = 'test';
import { UnauthorizedException } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepositoryMock } from '../../../../../test/user/user.repository.mock';
import { ConfigurationModule } from '../../configuration/configuration.module';
import { ConfigurationService } from '../../configuration/services/configuration.service';
import { UserService } from '../../user/services/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigurationModule,
        JwtModule.registerAsync({
          imports: [ConfigurationModule],
          useFactory: (config: ConfigurationService) => config.jwtConfig,
          inject: [ConfigurationService],
        }),
      ],
      providers: [
        AuthService,
        UserService,
        {
          provide: 'UserRepository',
          useClass: UserRepositoryMock,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
  });

  it('should be defined after module initialization', () => {
    expect(authService).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate that the user and return it when the user exists and password match.', async () => {
      await expect(
        authService.validateUser('user1', 'user1'),
      ).resolves.toStrictEqual({
        id: 1,
        username: 'user1',
        // password: 'user1',
        password:
          '$2b$12$KgUSTFUTjRqQD7U7tuV9quheR4L.LOAT.GhmTjBIXsgLMhBXjfhYq',
        role: 0,
      });
      await expect(
        authService.validateUser('user2', 'user2'),
      ).resolves.toStrictEqual({
        id: 2,
        username: 'user2',
        // password: 'user2',
        password:
          '$2b$12$jDy/bJV0p6mYRlEjZL5t0OX9jinlfEiQDfuApJJGSVW6Ca/hiVbBW',
        role: 1,
      });
    });
    it('should return undefined when the user does not exists or password does not match.', async () => {
      await expect(
        authService.validateUser('test', 'user1'),
      ).resolves.toBeUndefined();
      await expect(
        authService.validateUser('user1', 'test'),
      ).resolves.toBeUndefined();
    });
  });

  describe('login', () => {
    it('should return a JWT token when a valid user is provided', async () => {
      const token = await authService.login({
        username: 'user1',
        password: 'user1',
      } as any);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });
    it('should return a exception when a invalid user is provided', async () => {
      await expect(
        authService.login({
          username: 'user1',
          password: 'user2',
        } as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register a new user if not exists', async () => {
      const newUser: any = {
        id: 3,
        username: 'user3',
        password: 'user3',
      };

      const user = await authService.register(newUser);
      expect(user).toBeDefined();
      expect(user).toEqual(await userService.findOne('user3'));
    });
    it('should throw an error if user exists', async () => {
      const newUser: any = {
        id: 3,
        username: 'user3',
        password: 'user3',
      };

      await expect(authService.register(newUser)).rejects.toThrow(
        'User already exists',
      );
    });
  });
});
