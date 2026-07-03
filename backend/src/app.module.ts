import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { LocationModule } from './modules/location/location.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    AuthModule,
    EmployeeModule,
    LocationModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
