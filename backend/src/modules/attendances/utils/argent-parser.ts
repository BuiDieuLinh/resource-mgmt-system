import { UAParser } from 'ua-parser-js';

export function parseUserAgent(userAgent: string) {
  const parser = UAParser(userAgent);

  return {
    browser: parser.browser.name ?? 'Unknown',
    os: parser.os.name ?? 'Unknown',
    device: parser.device.type ?? 'desktop',
  };
}
