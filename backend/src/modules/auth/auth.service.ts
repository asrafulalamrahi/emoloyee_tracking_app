import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly jwtSecret = process.env.JWT_SECRET;
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async login(dto: LoginDto) {
    if (!this.jwtSecret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }
    if (!dto?.email || !dto?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!isMatch) throw new UnauthorizedException('Invalid credentials');

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role || 'ADMIN',
        type: 'admin',
      };

      const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
      const { passwordHash: _, ...userWithoutPassword } = user;

      return {
        accessToken,
        user: {
          ...userWithoutPassword,
          role: user.role || 'ADMIN',
        },
      };
    }

    const employee = await this.prisma.client.employee.findUnique({
      where: { email: dto.email },
      include: { device: true },
    });

    if (!employee) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, employee.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role || 'RIDER',
      type: 'employee',
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '30d' });

    await this.prisma.client.employee.update({
      where: { id: employee.id },
      data: { status: 'ONLINE' },
    });

    const { passwordHash: _, ...employeeWithoutPassword } = employee;

    return {
      accessToken,
      user: {
        ...employeeWithoutPassword,
        role: employee.role || 'RIDER',
      },
    };
  }

  async me(userId: string, roleType: string) {
    if (roleType === 'admin') {
      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new UnauthorizedException('User not found');
      const { passwordHash: _, ...result } = user;
      return { ...result, role: user.role || 'ADMIN' };
    } else {
      const employee = await this.prisma.client.employee.findUnique({
        where: { id: userId },
        include: { device: true },
      });
      if (!employee) throw new UnauthorizedException('Employee not found');
      const { passwordHash: _, ...result } = employee;
      return { ...result, role: employee.role || 'RIDER' };
    }
  }

  verifyToken(token: string) {
    if (!this.jwtSecret) {
      throw new UnauthorizedException('JWT_SECRET is not configured');
    }

    try {
      return jwt.verify(token, this.jwtSecret);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
