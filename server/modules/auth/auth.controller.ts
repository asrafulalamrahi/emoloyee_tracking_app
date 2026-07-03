import { Controller, Post, Body, Get, Req, UnauthorizedException, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    try {
      return await this.authService.login(dto);
    } catch (e: any) {
      return { controllerError: e.message, stack: e.stack };
    }
  }

  @Get('me')
  async me(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET || 'fallback-super-secret-key-for-dev';
      const decoded: any = jwt.verify(token, secret);
      return this.authService.me(decoded.sub);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

