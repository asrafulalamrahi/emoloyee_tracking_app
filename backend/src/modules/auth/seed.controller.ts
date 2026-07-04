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
      // Admin Users
      await this.prisma.client.user.createMany({
        data: [
          {
            email: 'admin@metrologix.com',
            passwordHash,
            name: 'Alex Morgan',
            role: 'ADMIN',
          },
          {
            email: 'manager@metrologix.com',
            passwordHash,
            name: 'Sarah Chen',
            role: 'MANAGER',
          }
        ]
      });

      console.log('Seeding geofences...');
      // Geofences
      await this.prisma.client.geofence.createMany({
        data: [
          {
            id: 'geo_1',
            name: 'MetroLogix HQ Office',
            type: 'CIRCLE',
            centerLat: 37.7946,
            centerLng: -122.4014,
            radius: 120,
            status: 'ACTIVE',
            targetTeams: ['HQ Compliance', 'Delivery Team Alpha', 'SFC Support Team C'],
            enterCount: 24,
            exitCount: 21,
          },
          {
            id: 'geo_2',
            name: 'North SOMA Logistics Hub',
            type: 'CIRCLE',
            centerLat: 37.7812,
            centerLng: -122.4029,
            radius: 250,
            status: 'ACTIVE',
            targetTeams: ['Delivery Team Alpha'],
            enterCount: 41,
            exitCount: 39,
          },
          {
            id: 'geo_3',
            name: 'Downtown Financial Restricted Zone',
            type: 'POLYGON',
            centerLat: 37.7915,
            centerLng: -122.4012,
            polygonPath: [
              { lat: 37.7955, lng: -122.4045 },
              { lat: 37.7968, lng: -122.3995 },
              { lat: 37.7895, lng: -122.3952 },
              { lat: 37.7878, lng: -122.4015 }
            ],
            status: 'ACTIVE',
            targetTeams: ['Delivery Team Alpha', 'West Coast Enterprise Sales'],
            enterCount: 12,
            exitCount: 11,
          },
          {
            id: 'geo_4',
            name: 'Twin Peaks No-Idle Zone',
            type: 'POLYGON',
            centerLat: 37.7544,
            centerLng: -122.4477,
            polygonPath: [
              { lat: 37.7580, lng: -122.4510 },
              { lat: 37.7580, lng: -122.4430 },
              { lat: 37.7500, lng: -122.4430 },
              { lat: 37.7500, lng: -122.4510 }
            ],
            status: 'ACTIVE',
            targetTeams: ['SFC Support Team C', 'Technical Support West'],
            enterCount: 4,
            exitCount: 4,
          }
        ]
      });

      console.log('Seeding customers...');
      // Customers
      await this.prisma.client.customer.createMany({
        data: [
          {
            id: 'cust_1',
            name: 'Salesforce Tower (Global Tech Inc)',
            address: '415 Mission St, San Francisco, CA',
            lat: 37.7897,
            lng: -122.3972,
            contactPerson: 'Marc Benioff',
            phone: '+1 (555) 444-1111',
            email: 'mbenioff@globaltech.com'
          },
          {
            id: 'cust_2',
            name: 'Uber HQ (RideShare Corp)',
            address: '1515 3rd St, San Francisco, CA',
            lat: 37.7682,
            lng: -122.3892,
            contactPerson: 'Dara Khosrowshahi',
            phone: '+1 (555) 444-2222',
            email: 'dara@rideshare.com'
          },
          {
            id: 'cust_3',
            name: 'UCSF Medical Center',
            address: '505 Parnassus Ave, San Francisco, CA',
            lat: 37.7631,
            lng: -122.4578,
            contactPerson: 'Dr. Elizabeth Blackwell',
            phone: '+1 (555) 444-3333',
            email: 'eblackwell@ucsf.edu'
          },
          {
            id: 'cust_4',
            name: 'Fisherman\'s Wharf Retail Mall',
            address: 'Pier 39, San Francisco, CA',
            lat: 37.8087,
            lng: -122.4098,
            contactPerson: 'Captain John Sterling',
            phone: '+1 (555) 444-4444',
            email: 'jsterling@pier39.com'
          },
          {
            id: 'cust_5',
            name: 'Dolores Park Cafe',
            address: '501 Dolores St, San Francisco, CA',
            lat: 37.7598,
            lng: -122.4269,
            contactPerson: 'Clara Oswald',
            phone: '+1 (555) 444-5555',
            email: 'clara@dolorescafe.com'
          }
        ]
      });

      console.log('Seeding employees & devices...');
      // Employees & Devices
      const employeesData = [
        {
          id: 'emp_new_1',
          name: 'Samuel Jackson',
          email: 'samuel@metrologix.com',
          role: 'Trainee Technician',
          phone: '+1 (555) 999-8888',
          status: 'OFFLINE',
          lastLat: 0.0,
          lastLng: 0.0,
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
          name: 'Alex Rivera',
          email: 'alex@metrologix.com',
          role: 'Delivery Rider',
          phone: '+1 (555) 123-4567',
          status: 'TRAVELING',
          lastLat: 37.7858,
          lastLng: -122.4065,
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
          name: 'Sarah Jenkins',
          email: 'sarah@metrologix.com',
          role: 'Senior Sales Rep',
          phone: '+1 (555) 987-6543',
          status: 'IDLE',
          lastLat: 37.7648,
          lastLng: -122.4215,
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
          name: 'Michael Chang',
          email: 'michael@metrologix.com',
          role: 'Field Service Engineer',
          phone: '+1 (555) 456-7890',
          status: 'BREAK',
          lastLat: 37.7592,
          lastLng: -122.4348,
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
          name: 'Elena Rostova',
          email: 'elena@metrologix.com',
          role: 'Technical Audit Lead',
          phone: '+1 (555) 789-0123',
          status: 'ONLINE',
          lastLat: 37.7946,
          lastLng: -122.4014,
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
          name: 'David Kim',
          email: 'david@metrologix.com',
          role: 'HVAC Technician',
          phone: '+1 (555) 321-7654',
          status: 'TRAVELING',
          lastLat: 37.8021,
          lastLng: -122.4187,
          device: {
            deviceName: 'Zebra TC57 Rugged PDA',
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
      // Visits
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
            notes: 'Signed contract renewal for 5,000 corporate accounts. Highly successful meeting.',
            photoUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
            signature: 'S. Jenkins'
          },
          {
            id: 'v_2',
            employeeId: 'emp_2',
            customerId: 'cust_2',
            date: todayStr,
            status: 'ONGOING',
            arrivalTime: new Date(Date.now() - 1800000),
            notes: 'In active discussion regarding custom logistical pipelines. Testing API responses.',
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
            notes: 'Completed repair of high-voltage backup chiller controls. Tested safely.',
            photoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400',
            signature: 'M. Chang'
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
            notes: 'Package containing primary thermal sensors delivered to Clara Oswald.',
            photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
            signature: 'C. Oswald'
          }
        ]
      });

      console.log('Seeding attendance...');
      // Attendance
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
      // Notifications
      await this.prisma.client.notification.createMany({
        data: [
          {
            employeeId: 'emp_5',
            employeeName: 'David Kim',
            type: 'LOW_BATTERY',
            message: 'Device battery has dropped below critical level (18%). Location tracking might stop.',
            timestamp: new Date(Date.now() - 300000),
            read: false,
          },
          {
            employeeId: 'emp_1',
            employeeName: 'Alex Rivera',
            type: 'GEOFENCE_EXIT',
            message: 'Exited geofence "North SOMA Logistics Hub" traveling at 34 km/h.',
            timestamp: new Date(Date.now() - 600000),
            read: false,
          },
          {
            employeeId: 'emp_3',
            employeeName: 'Michael Chang',
            type: 'GPS_DISABLED',
            message: 'GPS precision altered to Low Power Mode. Location tracking accuracy might be compromised.',
            timestamp: new Date(Date.now() - 1200000),
            read: true,
          },
          {
            employeeId: 'emp_1',
            employeeName: 'Alex Rivera',
            type: 'SPEED_LIMIT',
            message: 'Exceeded safe speed limit (34 km/h in Downtown SOMA area).',
            timestamp: new Date(Date.now() - 150000),
            read: false,
          }
        ]
      });

      console.log('Database Seeding Complete.');
      return {
        status: 'success',
        message: 'Database seeded successfully with all MetroLogix live demo configurations.',
      };
    } catch (e: any) {
      console.error('Seeding Error:', e);
      return { status: 'error', error: e.message, stack: e.stack };
    }
  }
}
