# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: walletconnect-only.spec.ts >> WalletConnect-Only Flow (No Injected Provider) >> should offer WalletConnect as primary option and successfully connect
- Location: tests/e2e/walletconnect-only.spec.ts:16:3

# Error details

```
Error: browserType.launch: Executable doesn't exist at /home/zakayola/.cache/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-linux64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
```