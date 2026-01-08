import { describe, it, expect } from 'vitest';
import { logger } from '../src/utils/logger';

describe('Logger', () => {
  it('should be defined', () => {
    expect(logger).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.success).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warning).toBe('function');
  });
});

describe('Project Foundation', () => {
  it('should pass basic smoke test', () => {
    expect(true).toBe(true);
  });
});
