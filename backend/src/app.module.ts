import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { LocationModule } from './modules/location/location.module';
import { CustomerModule } from './modules/customers/customer.module';
import { VisitModule } from './modules/visits/visit.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GeofenceModule } from './modules/geofences/geofence.module';
import { NotificationModule } from './modules/notifications/notification.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    AuthModule,
    EmployeeModule,
    LocationModule,
    CustomerModule,
    VisitModule,
    AttendanceModule,
    GeofenceModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
