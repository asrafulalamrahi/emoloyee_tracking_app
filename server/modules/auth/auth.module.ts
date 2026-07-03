import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SeedController } from './seed.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [AuthController, SeedController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
