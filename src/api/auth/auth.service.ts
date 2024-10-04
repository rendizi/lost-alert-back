import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service'; 
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}
  

  async validateUser(phoneNumber: string, password: string): Promise<any> {
    const user = await this.usersService.findByPhone(phoneNumber);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { phoneNumber: user._doc.phoneNumber, sub: user._doc._id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findByPhone(payload.phoneNumber);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const newPayload = { phoneNumber: user.phoneNumber, sub: (user as any)._id };
      const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      return {
        accessToken: newAccessToken,
        refreshToken, 
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  generateVerificationToken(email: string): string {
    return this.jwtService.sign({ email }, { expiresIn: '1d', secret: process.env.EMAIL_SECRET });
  }
}
