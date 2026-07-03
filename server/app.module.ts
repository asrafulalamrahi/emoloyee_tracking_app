import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { CompanyModule } from './modules/company/company.module';

@Module({
  imports: [
    AuthModule,
    CompanyModule
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
