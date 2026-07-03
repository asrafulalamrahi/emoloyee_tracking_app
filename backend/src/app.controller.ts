import { Controller, All, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  // Express 5 compatible wildcard route (replaces deprecated '*')
  // This catches any unmatched API routes and returns a 404 JSON response
  @All('(.*)')
  catchAll(@Req() req: Request, @Res() res: Response) {
    res.status(404).json({
      statusCode: 404,
      message: `Cannot ${req.method} ${req.originalUrl}`,
      error: 'Not Found',
    });
  }
}
