import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class WifiGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const forwarded = request.headers['x-forwarded-for'];

    let ip = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0] || request.socket.remoteAddress;

    ip = ip?.replace('::ffff:', '');

    console.log('IP: ', ip);

    return ip === process.env.OFFICE_IP;
  }
}
