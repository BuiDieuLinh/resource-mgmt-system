import { Injectable } from '@nestjs/common';
import { parseUserAgent } from '../utils/argent-parser';
import { Request } from 'express';

@Injectable()
export class DeviceInfoService {
  extract(req: Request) {
    const ip_address = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        '127.0.0.1';

    const user_agent = req.headers['user-agent'] || 'unknown';

    const parsedUserAgent = parseUserAgent(user_agent);

    return {
      ip_address,
      user_agent:
        parsedUserAgent.browser +
        ' ' +
        parsedUserAgent.os +
        ' ' +
        parsedUserAgent.device,
    };
  }
}
