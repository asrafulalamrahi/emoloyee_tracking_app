import { Controller, Post, Get, Body, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  async me(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    const decoded = this.authService.verifyToken(token) as any;

    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid token structure');
    }

    // Role type: 'admin' or 'employee' depending on payload
    const roleType = decoded.type || 'admin';
    return this.authService.me(decoded.sub, roleType);
  }
}
