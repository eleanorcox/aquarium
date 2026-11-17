import { describe, expect, it } from 'vitest';
import { serviceAddress } from './service';

describe('the address of the visitor service', () => {
  it('uses the configured one, without a trailing slash', () => {
    expect(serviceAddress('https://visit.example/', { protocol: 'https:', hostname: 'tank.test' })).toBe('https://visit.example');
  });

  it('falls back to the development service on the same machine as the page', () => {
    expect(serviceAddress(undefined, { protocol: 'http:', hostname: '192.168.1.5' })).toBe('http://192.168.1.5:8787');
    expect(serviceAddress('', { protocol: 'http:', hostname: 'laptop.local' })).toBe('http://laptop.local:8787');
  });
});
