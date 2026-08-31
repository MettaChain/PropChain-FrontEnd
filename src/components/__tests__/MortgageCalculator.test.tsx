import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { MortgageCalculator } from '../MortgageCalculator';

const renderCalculator = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MortgageCalculator propertyPrice={1000} defaultYield={8} />
    </I18nextProvider>,
  );

describe('MortgageCalculator i18n', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('renders translated labels in English', () => {
    renderCalculator();

    expect(screen.getByText('Investment Calculator')).toBeInTheDocument();
    expect(screen.getByText('Estimate your potential returns from tokenized real estate')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('PropChain vs. Traditional Real Estate')).toBeInTheDocument();
  });

  it('renders translated labels in Spanish', async () => {
    await i18n.changeLanguage('es');
    renderCalculator();

    expect(screen.getByText('Calculadora de Inversión')).toBeInTheDocument();
    expect(screen.getByText('Compartir')).toBeInTheDocument();
  });

  it('uses pluralization for holding period', () => {
    renderCalculator();

    expect(screen.getByText('5 Years')).toBeInTheDocument();
  });

  it('applies RTL direction for Arabic', async () => {
    await i18n.changeLanguage('ar');
    const { container } = renderCalculator();

    const card = container.querySelector('[dir="rtl"]');
    expect(card).toBeInTheDocument();
    expect(screen.getByText('حاسبة الاستثمار')).toBeInTheDocument();
  });

  it('uses locale-aware currency formatting', () => {
    renderCalculator();

    expect(screen.getAllByText(/\$1,000/).length).toBeGreaterThan(0);
  });
});
