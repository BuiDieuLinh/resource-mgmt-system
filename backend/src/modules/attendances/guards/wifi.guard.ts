import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class WifiGuard implements CanActivate {
  constructor(private readonly logger: Logger) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const forwarded = request.headers['x-forwarded-for'];

    let ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0] || request.socket.remoteAddress;

    ip = ip?.replace('::ffff:', '');

    this.logger.log(`Client IP: ${ip}`);

    const allowedIps = [process.env.OFFICE_IP, '127.0.0.1', '::1'];

    return allowedIps.includes(ip);
  }
}
