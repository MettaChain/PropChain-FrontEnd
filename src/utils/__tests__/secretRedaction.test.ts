import { redactValue, SECRETS_DENY_LIST } from '../secretRedaction';

describe('secretRedaction', () => {
  it('should redact sensitive string values', () => {
    const input = 'Here is my private key: 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const result = redactValue(input);
    expect(result).toBe('Here is my private key: 0x[REDACTED_PRIVATE_KEY]');
  });

  it('should redact sensitive keys in an object', () => {
    const input = {
      username: 'john',
      privateKey: 'secret_key',
      mnemonic: 'word word word',
      cookie: 'session_id=123',
      authorization: 'Bearer 123',
      safeData: {
        token: 'should-be-redacted',
        isSafe: true
      }
    };
    
    const result = redactValue(input);
    expect(result).toMatchInlineSnapshot(`
      {
        "authorization": "[REDACTED]",
        "cookie": "[REDACTED]",
        "mnemonic": "[REDACTED]",
        "privateKey": "[REDACTED]",
        "safeData": {
          "isSafe": true,
          "token": "[REDACTED]",
        },
        "username": "john",
      }
    `);
  });

  it('should handle arrays recursively', () => {
    const input = ['safe', { password: '123' }, ['nested', { token: 'abc' }]];
    const result = redactValue(input);
    expect(result).toEqual(['safe', { password: '[REDACTED]' }, ['nested', { token: '[REDACTED]' }]]);
  });

  it('should not throw on circular references', () => {
    const obj: any = { safe: true };
    obj.self = obj;
    const result = redactValue(obj) as any;
    expect(result.safe).toBe(true);
    expect(result.self).toBe('[CIRCULAR]');
  });
});
