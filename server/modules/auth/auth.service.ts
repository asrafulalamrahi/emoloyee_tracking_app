import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET || 'fallback-super-secret-key-for-dev';

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    try {
      const employee = await this.prisma.client.employee.findUnique({
        where: { email: dto.email },
        include: {
          company: true,
          branch: true,
          department: true,
        }
      });

      if (!employee || !employee.passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(dto.password, employee.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = {
        sub: employee.id,
        email: employee.email,
        role: employee.role,
        companyId: employee.companyId,
      };

      const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '12h' });

      // Optional: Keep refresh tokens in DB
      const refreshToken = jwt.sign({ sub: employee.id }, this.jwtSecret, { expiresIn: '7d' });

      await this.prisma.client.session.create({
        data: {
          employeeId: employee.id,
          refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
      });

      // Remove passwordHash from response
      const { passwordHash, ...userWithoutPassword } = employee;

      return {
        accessToken,
        refreshToken,
        user: userWithoutPassword,
      };
    } catch (e: any) {
      return { error: e.message, stack: e.stack };
    }
  }

  async me(employeeId: string) {
    const employee = await this.prisma.client.employee.findUnique({
      where: { id: employeeId },
      include: {
        company: true,
        branch: true,
        department: true,
      }
    });
    
    if (!employee) throw new UnauthorizedException('User not found');
    const { passwordHash, ...userWithoutPassword } = employee;
    return userWithoutPassword;
  }
}

