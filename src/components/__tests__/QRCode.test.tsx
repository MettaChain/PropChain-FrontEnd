import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { QRCode } from '../QRCode';

const renderQRCode = (url: string, allowedHosts?: readonly string[]) =>
  render(
    <I18nextProvider i18n={i18n}>
      <QRCode url={url} allowedHosts={allowedHosts} />
    </I18nextProvider>,
  );

describe('QRCode security', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders a valid HTTPS URL safely', () => {
    renderQRCode('https://propchain.io/properties/123');

    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    expect(screen.getByText(/propchain\.io\/properties\/123/)).toBeInTheDocument();
  });

  it('blocks javascript: URLs', () => {
    renderQRCode('javascript:alert(1)');

    expect(screen.getByTestId('qr-code-invalid')).toBeInTheDocument();
    expect(screen.getByText('Unable to generate QR code for this URL')).toBeInTheDocument();
  });

  it('blocks data: URLs', () => {
    renderQRCode('data:text/html,<script>alert(1)</script>');

    expect(screen.getByTestId('qr-code-invalid')).toBeInTheDocument();
  });

  it('blocks known phishing domains', () => {
    renderQRCode('https://metamask.io.fake/phishing');

    expect(screen.getByTestId('qr-code-invalid')).toBeInTheDocument();
  });

  it('shows security warning for unofficial domains when allowed', () => {
    renderQRCode('https://example.com/property/1');

    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    expect(screen.getByTestId('qr-code-warning')).toBeInTheDocument();
  });

  it('rejects empty URLs', () => {
    renderQRCode('   ');

    expect(screen.getByTestId('qr-code-invalid')).toBeInTheDocument();
  });
});
