import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';

@Controller('seed')
export class SeedController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async seed() {
    try {
      console.log('Clearing old database entries...');
      
      // Delete in order of dependencies
      await this.prisma.client.gPSLocation.deleteMany({});
      await this.prisma.client.notification.deleteMany({});
      await this.prisma.client.attendance.deleteMany({});
      await this.prisma.client.visit.deleteMany({});
      await this.prisma.client.device.deleteMany({});
      await this.prisma.client.employee.deleteMany({});
      await this.prisma.client.customer.deleteMany({});
      await this.prisma.client.geofence.deleteMany({});
      await this.prisma.client.user.deleteMany({});

      const passwordHash = await bcrypt.hash('admin123', 10);
      const empPasswordHash = await bcrypt.hash('rider123', 10);

      console.log('Seeding admin users...');
      await this.prisma.client.user.createMany({
        data: [
          {
            email: 'admin@abulkhairgroup.com',
            passwordHash,
            name: 'Alex Morgan',
            role: 'ADMIN',
          },
          {
            email: 'manager@abulkhairgroup.com',
            passwordHash,
            name: 'Sarah Chen',
            role: 'MANAGER',
          }
        ]
      });

      console.log('Seeding geofences for Abul Khair Group...');
      await this.prisma.client.geofence.createMany({
        data: [
          {
            id: 'geo_1',
            name: 'AKG Chittagong Corporate Office',
            type: 'CIRCLE',
            centerLat: 22.3244,
            centerLng: 91.8122,
            radius: 150,
            status: 'ACTIVE',
            targetTeams: ['Logistics Team', 'Sales Team Alpha', 'Maintenance Team A'],
            enterCount: 24,
            exitCount: 21,
          },
          {
            id: 'geo_2',
            name: 'Madambibirhat Steel Plant (Chattogram)',
            type: 'CIRCLE',
            centerLat: 22.4342,
            centerLng: 91.7348,
            radius: 500,
            status: 'ACTIVE',
            targetTeams: ['Logistics Team'],
            enterCount: 41,
            exitCount: 39,
          },
          {
            id: 'geo_3',
            name: 'AKG Dhaka Corporate Office (Banani)',
            type: 'POLYGON',
            centerLat: 23.7937,
            centerLng: 90.4067,
            polygonPath: [
              { lat: 23.7955, lng: 90.4045 },
              { lat: 23.7968, lng: 90.4095 },
              { lat: 23.7895, lng: 90.4112 },
              { lat: 23.7878, lng: 90.4035 }
            ],
            status: 'ACTIVE',
            targetTeams: ['Logistics Team', 'Enterprise Sales Dhaka'],
            enterCount: 12,
            exitCount: 11,
          },
          {
            id: 'geo_4',
            name: 'AKG Foods Depot (Tongi)',
            type: 'POLYGON',
            centerLat: 23.8824,
            centerLng: 90.4005,
            polygonPath: [
              { lat: 23.8850, lng: 90.3980 },
              { lat: 23.8850, lng: 90.4030 },
              { lat: 23.8790, lng: 90.4030 },
              { lat: 23.8790, lng: 90.3980 }
            ],
            status: 'ACTIVE',
            targetTeams: ['Logistics Team', 'Technical Support'],
            enterCount: 4,
            exitCount: 4,
          }
        ]
      });

      console.log('Seeding customers (Distribution Points)...');
      await this.prisma.client.customer.createMany({
        data: [
          {
            id: 'cust_1',
            name: 'Agrabad Distribution Hub',
            address: 'Agrabad Access Rd, Chittagong',
            lat: 22.3235,
            lng: 91.8085,
            contactPerson: 'Niaz Ahmed',
            phone: '01711223344',
            email: 'niaz@agrabadretail.com'
          },
          {
            id: 'cust_2',
            name: 'GEC Circle Distributor',
            address: 'GEC Circle, Chittagong',
            lat: 22.3592,
            lng: 91.8214,
            contactPerson: 'Arifur Rahman',
            phone: '01819334455',
            email: 'arif@gecdist.com'
          },
          {
            id: 'cust_3',
            name: 'Dhaka Central Foods Store',
            address: 'Gulshan-2, Dhaka',
            lat: 23.7925,
            lng: 90.4162,
            contactPerson: 'Kamrul Hasan',
            phone: '01911445566',
            email: 'kamrul@dhakastore.com'
          },
          {
            id: 'cust_4',
            name: 'Chawkbazar Wholesale Agency',
            address: 'Chawkbazar, Chittagong',
            lat: 22.3565,
            lng: 91.8354,
            contactPerson: 'Md. Forkan',
            phone: '01511556677',
            email: 'forkan@chawkmarket.com'
          },
          {
            id: 'cust_5',
            name: 'Halishahar Steel Outlet',
            address: 'Halishahar, Chittagong',
            lat: 22.3168,
            lng: 91.7824,
            contactPerson: 'Sajidul Islam',
            phone: '01611667788',
            email: 'sajid@halishaharoutlet.com'
          }
        ]
      });

      console.log('Seeding employees & devices...');
      const employeesData = [
        {
          id: 'emp_new_1',
          name: 'Md. Asif Rahman',
          email: 'asif@abulkhairgroup.com',
          role: 'Trainee Officer',
          phone: '01712345678',
          status: 'OFFLINE',
          lastLat: 0.0,
          lastLng: 0.0,
          department: 'HR',
          designation: 'Trainee',
          branch: 'Chittagong',
          factory: 'Steel Plant',
          region: 'Chattogram',
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          qrCode: 'AKG-EMP-EMP-000',
          employeeCode: 'EMP-000',
          device: {
            deviceName: 'Pending Binding',
            platform: 'iOS',
            isGpsEnabled: false,
            locationPermission: 'DENIED',
            batteryLevel: 100,
          }
        },
        {
          id: 'emp_1',
          name: 'Tanvir Ahmed',
          email: 'tanvir@abulkhairgroup.com',
          role: 'Delivery Rider',
          phone: '01812345678',
          status: 'TRAVELING',
          lastLat: 22.3255,
          lastLng: 91.8105,
          department: 'Logistics',
          designation: 'Rider',
          branch: 'Chittagong',
          factory: 'Cement Plant',
          region: 'Chattogram',
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
          qrCode: 'AKG-EMP-EMP-001',
          employeeCode: 'EMP-001',
          device: {
            deviceName: 'Samsung Galaxy S23 Ultra',
            platform: 'Android',
            isGpsEnabled: true,
            locationPermission: 'GRANTED',
            batteryLevel: 84,
          }
        },
        {
          id: 'emp_2',
          name: 'Sadia Karim',
          email: 'sadia@abulkhairgroup.com',
          role: 'Senior Sales Executive',
          phone: '01912345678',
          status: 'IDLE',
          lastLat: 23.7945,
          lastLng: 90.4075,
          department: 'Sales',
          designation: 'Sales Rep',
          branch: 'Dhaka',
          factory: 'Foods Plant',
          region: 'Dhaka',
          photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          qrCode: 'AKG-EMP-EMP-002',
          employeeCode: 'EMP-002',
          device: {
            deviceName: 'iPhone 15 Pro Max',
            platform: 'iOS',
            isGpsEnabled: true,
            locationPermission: 'GRANTED',
            batteryLevel: 91,
          }
        },
        {
          id: 'emp_3',
          name: 'Md. Kazi Farhan',
          email: 'farhan@abulkhairgroup.com',
          role: 'Field Service Engineer',
          phone: '01512345678',
          status: 'BREAK',
          lastLat: 22.4350,
          lastLng: 91.7350,
          department: 'Maintenance',
          designation: 'Engineer',
          branch: 'Chittagong',
          factory: 'Steel Plant',
          region: 'Chattogram',
          photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
          qrCode: 'AKG-EMP-EMP-003',
          employeeCode: 'EMP-003',
          device: {
            deviceName: 'Google Pixel 8 Pro',
            platform: 'Android',
            isGpsEnabled: true,
            locationPermission: 'GRANTED',
            batteryLevel: 42,
          }
        },
        {
          id: 'emp_4',
          name: 'Nusrat Jahan',
          email: 'nusrat@abulkhairgroup.com',
          role: 'Technical Audit Lead',
          phone: '01612345678',
          status: 'ONLINE',
          lastLat: 22.3244,
          lastLng: 91.8122,
          department: 'Quality Assurance',
          designation: 'Lead Auditor',
          branch: 'Chittagong',
          factory: 'Steel Plant',
          region: 'Chattogram',
          photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
          qrCode: 'AKG-EMP-EMP-004',
          employeeCode: 'EMP-004',
          device: {
            deviceName: 'iPhone 14 Pro',
            platform: 'iOS',
            isGpsEnabled: true,
            locationPermission: 'GRANTED',
            batteryLevel: 98,
          }
        },
        {
          id: 'emp_5',
          name: 'Sajib Chowdhury',
          email: 'sajib@abulkhairgroup.com',
          role: 'Logistics Coordinator',
          phone: '01722345678',
          status: 'TRAVELING',
          lastLat: 23.8820,
          lastLng: 90.4010,
          department: 'Logistics',
          designation: 'Coordinator',
          branch: 'Dhaka',
          factory: 'Foods Plant',
          region: 'Dhaka',
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          qrCode: 'AKG-EMP-EMP-005',
          employeeCode: 'EMP-005',
          device: {
            deviceName: 'Zebra Rugged PDA',
            platform: 'Android',
            isGpsEnabled: true,
            locationPermission: 'GRANTED',
            batteryLevel: 18,
          }
        }
      ];

      for (const e of employeesData) {
        await this.prisma.client.employee.create({
          data: {
            id: e.id,
            name: e.name,
            email: e.email,
            passwordHash: empPasswordHash,
            role: e.role,
            phone: e.phone,
            status: e.status,
            lastLat: e.lastLat,
            lastLng: e.lastLng,
            lastLocationUpdate: new Date(),
            department: e.department,
            designation: e.designation,
            branch: e.branch,
            factory: e.factory,
            region: e.region,
            photoUrl: e.photoUrl,
            qrCode: e.qrCode,
            employeeCode: e.employeeCode,
          }
        });

        await this.prisma.client.device.create({
          data: {
            employeeId: e.id,
            deviceName: e.device.deviceName,
            platform: e.device.platform,
            isGpsEnabled: e.device.isGpsEnabled,
            locationPermission: e.device.locationPermission,
            batteryLevel: e.device.batteryLevel,
          }
        });

        // Seed initial GPS Location
        if (e.lastLat !== 0) {
          await this.prisma.client.gPSLocation.create({
            data: {
              employeeId: e.id,
              lat: e.lastLat,
              lng: e.lastLng,
              batteryLevel: e.device.batteryLevel,
              timestamp: new Date()
            }
          });
        }
      }

      console.log('Seeding visits...');
      const todayStr = new Date().toISOString().split('T')[0];
      await this.prisma.client.visit.createMany({
        data: [
          {
            id: 'v_1',
            employeeId: 'emp_2',
            customerId: 'cust_1',
            date: todayStr,
            status: 'VISITED',
            arrivalTime: new Date(Date.now() - 14400000),
            departureTime: new Date(Date.now() - 11800000),
            duration: 43,
            notes: 'Completed inventory validation. Orders booked for 10 tons of steel coils.',
            photoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
            signature: 'Sadia Karim'
          },
          {
            id: 'v_2',
            employeeId: 'emp_2',
            customerId: 'cust_2',
            date: todayStr,
            status: 'ONGOING',
            arrivalTime: new Date(Date.now() - 180000),
            notes: 'Reviewing credit limits with local dealer. Very positive response.',
          },
          {
            id: 'v_3',
            employeeId: 'emp_2',
            customerId: 'cust_5',
            date: todayStr,
            status: 'ASSIGNED',
          },
          {
            id: 'v_4',
            employeeId: 'emp_3',
            customerId: 'cust_3',
            date: todayStr,
            status: 'VISITED',
            arrivalTime: new Date(Date.now() - 7200000),
            departureTime: new Date(Date.now() - 3600000),
            duration: 60,
            notes: 'Restored backup generator control unit. Passed testing sequence.',
            photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
            signature: 'K. Farhan'
          },
          {
            id: 'v_5',
            employeeId: 'emp_5',
            customerId: 'cust_4',
            date: todayStr,
            status: 'ASSIGNED',
          },
          {
            id: 'v_6',
            employeeId: 'emp_1',
            customerId: 'cust_5',
            date: todayStr,
            status: 'VISITED',
            arrivalTime: new Date(Date.now() - 10000000),
            departureTime: new Date(Date.now() - 9200000),
            duration: 13,
            notes: 'Delivered urgent documents and invoice proofs to the outlet supervisor.',
            photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
            signature: 'Sajidul Islam'
          }
        ]
      });

      console.log('Seeding attendance...');
      await this.prisma.client.attendance.createMany({
        data: [
          {
            employeeId: 'emp_1',
            date: todayStr,
            clockIn: new Date(new Date().setHours(8, 15, 0)),
            status: 'PRESENT',
            workingHours: 6.5,
            overtime: 0,
            validatedByGeofence: true
          },
          {
            employeeId: 'emp_2',
            date: todayStr,
            clockIn: new Date(new Date().setHours(9, 0, 0)),
            status: 'PRESENT',
            workingHours: 5.2,
            overtime: 0,
            validatedByGeofence: true
          },
          {
            employeeId: 'emp_3',
            date: todayStr,
            clockIn: new Date(new Date().setHours(8, 0, 0)),
            status: 'PRESENT',
            workingHours: 7.1,
            overtime: 0.1,
            validatedByGeofence: true
          },
          {
            employeeId: 'emp_4',
            date: todayStr,
            clockIn: new Date(new Date().setHours(9, 45, 0)),
            status: 'LATE',
            workingHours: 4.0,
            overtime: 0,
            validatedByGeofence: true
          },
          {
            employeeId: 'emp_5',
            date: todayStr,
            clockIn: new Date(new Date().setHours(8, 30, 0)),
            status: 'PRESENT',
            workingHours: 5.8,
            overtime: 0,
            validatedByGeofence: false
          }
        ]
      });

      console.log('Seeding notifications...');
      await this.prisma.client.notification.createMany({
        data: [
          {
            employeeId: 'emp_5',
            employeeName: 'Sajib Chowdhury',
            type: 'LOW_BATTERY',
            message: 'Device battery has dropped below critical level (18%). Location tracking might stop.',
            timestamp: new Date(Date.now() - 300000),
            read: false,
          },
          {
            employeeId: 'emp_1',
            employeeName: 'Tanvir Ahmed',
            type: 'GEOFENCE_EXIT',
            message: 'Exited geofence "AKG Chittagong Corporate Office" traveling at 34 km/h.',
            timestamp: new Date(Date.now() - 600000),
            read: false,
          },
          {
            employeeId: 'emp_3',
            employeeName: 'Md. Kazi Farhan',
            type: 'GPS_DISABLED',
            message: 'GPS precision altered to Low Power Mode. Location tracking accuracy might be compromised.',
            timestamp: new Date(Date.now() - 1200000),
            read: true,
          },
          {
            employeeId: 'emp_1',
            employeeName: 'Tanvir Ahmed',
            type: 'SPEED_LIMIT',
            message: 'Exceeded safe speed limit (34 km/h in Agrabad corporate corridor).',
            timestamp: new Date(Date.now() - 150000),
            read: false,
          }
        ]
      });

      console.log('Database Seeding Complete.');
      return {
        status: 'success',
        message: 'Database seeded successfully with Abul Khair Group live configurations.',
      };
    } catch (e: any) {
      console.error('Seeding Error:', e);
      return { status: 'error', error: e.message, stack: e.stack };
    }
  }
}
