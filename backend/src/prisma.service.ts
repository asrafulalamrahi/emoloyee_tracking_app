import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  public client: PrismaClient;

  constructor() {
    let url = process.env.DATABASE_URL || 'file:../dev.db';
    if (!url.startsWith('file:')) {
      url = 'file:../dev.db';
    }
    this.client = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.client.$connect();
      console.log('Successfully connected to the database via Prisma Client.');
    } catch (error: any) {
      console.error('======================================================================');
      console.error('⚠️  DATABASE CONNECTION WARNING: Prisma could not connect to the database.');
      console.error('Prisma is configured to use PostgreSQL (optimized for Neon Production).');
      console.error('To resolve this, please update DATABASE_URL in your .env file with');
      console.error('your Neon PostgreSQL connection string.');
      console.error('Error Details:', error.message);
      console.error('======================================================================');
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
