import { Module } from '@nestjs/common';
import { VisitController } from './visit.controller';
import { VisitService } from './visit.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [VisitController],
  providers: [VisitService, PrismaService],
  exports: [VisitService],
})
export class VisitModule {}
