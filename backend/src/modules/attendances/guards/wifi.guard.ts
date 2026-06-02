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

    const configuredOfficeIps = [process.env.OFFICIAL_IP, process.env.OFFICE_IP]
      .flatMap((value) => (value ?? '').split(','))
      .map((value) => value.trim())
      .filter(Boolean);

    if (configuredOfficeIps.length === 0) {
      this.logger.warn(
        'No OFFICIAL_IP/OFFICE_IP configured. Skipping Wi-Fi IP check.',
      );
      return true;
    }

    const allowedIps = [...configuredOfficeIps, '127.0.0.1', '::1'];

    return allowedIps.includes(ip);
  }
}
