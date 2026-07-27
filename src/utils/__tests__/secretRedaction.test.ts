import { redactSecrets } from '../secretRedaction';

describe('secretRedaction', () => {
  it('should redact sensitive keys in objects', () => {
    const input = {
      username: 'johndoe',
      password: 'supersecretpassword123',
      privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      mnemonic: 'test test test test test test test test test test test junk',
      nested: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        publicInfo: 'safe',
      }
    };
    
    expect(redactSecrets(input)).toMatchInlineSnapshot(`
{
  "mnemonic": "[REDACTED]",
  "nested": {
    "accessToken": "[REDACTED]",
    "publicInfo": "safe",
  },
  "password": "[REDACTED]",
  "privateKey": "[REDACTED]",
  "username": "johndoe",
}
`);
  });

  it('should redact sensitive patterns in strings', () => {
    const errorStack = "Error: Invalid token\\n at Object.auth (https://api.example.com/login:1:1)\\n Bearer eyJhb... token \\n private key 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef used";
    
    expect(redactSecrets(errorStack)).toMatchInlineSnapshot(`"Error: Invalid token\\n at Object.auth (https://api.example.com/login:1:1)\\n Bearer eyJhb... token \\n private key 0x[REDACTED_PRIVATE_KEY] used"`);
  });

  it('should handle circular references safely', () => {
    const obj: any = { safe: true };
    obj.self = obj;
    obj.password = '123';
    
    expect(redactSecrets(obj)).toMatchInlineSnapshot(`
{
  "password": "[REDACTED]",
  "safe": true,
  "self": "[Circular]",
}
`);
  });
});
