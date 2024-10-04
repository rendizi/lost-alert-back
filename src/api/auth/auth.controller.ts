import {
    Controller,
    Post,
    Body,
    Res,
    UseGuards,
    Req,
    UnauthorizedException,
    HttpStatus,
    Get,
  } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Response } from 'express';
import { UserService } from '../user/user.service';
  
  @Controller('auth')
  export class AuthController {
    constructor(
        private authService: AuthService,
        private readonly usersService: UserService,
    ) {}
  
    @Post('login')
    async login(@Body() body, @Res() res: Response) {
      const { phoneNumber, password } = body;
      const user = await this.authService.validateUser(phoneNumber, password);
      if (!user) {
        throw new UnauthorizedException();
      }
  
      const { accessToken, refreshToken } = await this.authService.login(user);
  
      res.cookie('accessToken', accessToken, { httpOnly: true });
      res.cookie('refreshToken', refreshToken, { httpOnly: true });
      return res.send({ message: 'Login successful' });
    }
  
    @Post('refresh-token')
    async refreshToken(@Req() req, @Res() res: Response) {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedException();
      }
  
      const newTokens = await this.authService.refreshToken(refreshToken);
      res.cookie('accessToken', newTokens.accessToken, { httpOnly: true });
      res.cookie('refreshToken', newTokens.refreshToken, { httpOnly: true });
      return res.send({ message: 'Token refreshed' });
    }

    @Get("logout") 
    async logout(@Req() req: any, @Res() res: Response) {
      res.clearCookie('accessToken'); 
      res.clearCookie('refreshToken')
      res.status(200).json({ message: 'Logged out successfully' });
    }
  }
  