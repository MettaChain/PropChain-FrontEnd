'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ErrorBoundary } from '@/components/ui/SimpleErrorBoundary';
import { calculateInvestmentProjection } from '@/lib/investmentProjection';

interface WidgetTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl?: string;
  brandName: string;
}

interface InvestmentCalculatorWidgetProps {
  theme?: Partial<WidgetTheme>;
  defaultInvestment?: number;
  defaultYield?: number;
  ctaUrl?: string;
  ctaText?: string;
  propertyId?: string;
  compact?: boolean;
}

const DEFAULT_THEME: WidgetTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  backgroundColor: '#ffffff',
  textColor: '#111827',
  brandName: 'PropChain',
};

/**
 * The widget is embedded in other people's pages through an iframe, so its
 * width is not known ahead of time: it can be a 600px column or a 320px phone
 * viewport. The sizes below scale with the viewport instead of assuming a
 * fixed width, and the boxes that hold a number are allowed to wrap so a
 * six-figure total never pushes the layout out of the frame.
 */
const ROOT_PADDING = 'clamp(12px, 4vw, 24px)';
const TITLE_FONT_SIZE = 'clamp(18px, 4.5vw, 24px)';
const SUBTITLE_FONT_SIZE = 'clamp(12px, 3vw, 14px)';
const METRIC_FONT_SIZE = 'clamp(15px, 4vw, 20px)';
const TOTAL_FONT_SIZE = 'clamp(18px, 5vw, 24px)';
const BUTTON_FONT_SIZE = 'clamp(14px, 3.5vw, 16px)';
const FIELD_GAP = 'clamp(12px, 3vw, 20px)';
const GRID_GAP = 'clamp(8px, 2.5vw, 12px)';
const CARD_PADDING = 'clamp(12px, 3vw, 20px)';
/**
 * The four metrics stay in two columns, but the columns are allowed to shrink
 * below the width of their content. A fixed `1fr` cannot shrink, so a narrow
 * frame used to push the numbers out of the widget.
 */
const METRIC_GRID = 'repeat(2, minmax(0, 1fr))';

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

/**
 * One formatter for the whole module. `Intl.NumberFormat` parses the locale
 * data every time it is constructed, and the widget formats a dozen values on
 * every render.
 */
const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function formatCurrency(value: number): string {
  return CURRENCY_FORMATTER.format(Number.isFinite(value) ? value : 0);
}

/**
 * The inputs are number fields, so an empty field arrives as an empty string.
 * Anything that is not a number is read as zero rather than as `NaN`, which
 * would otherwise be rendered as "NaN" in the widget.
 */
function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface InvestmentCalculatorSkeletonProps {
  theme?: Partial<WidgetTheme>;
  compact?: boolean;
}

/**
 * Issue #1269 — the widget used to be preceded by an empty box while the
 * embed page was still booting, which read as a broken widget rather than a
 * loading one. The skeleton has the same shape as the widget - same padding,
 * same grid, same blocks - so the form takes its place without the page
 * jumping around, and it is marked up as a status so assistive technology
 * says the calculator is on its way.
 */
export function InvestmentCalculatorSkeleton({
  theme,
  compact = false,
}: InvestmentCalculatorSkeletonProps): React.ReactElement {
  const mergedTheme: WidgetTheme = { ...DEFAULT_THEME, ...theme };
  const block = (height: number, width = '100%'): React.CSSProperties => ({
    height: `${height}px`,
    width,
    borderRadius: '8px',
    backgroundColor: `${mergedTheme.primaryColor}1A`,
  });

  const fields = [0, 1, 2, 3];
  const metrics = [0, 1, 2, 3];

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading the investment calculator"
      data-testid="investment-calculator-skeleton"
      style={{
        fontFamily: FONT_STACK,
        backgroundColor: mergedTheme.backgroundColor,
        color: mergedTheme.textColor,
        borderRadius: compact ? '12px' : '16px',
        padding: compact ? 'clamp(12px, 4vw, 16px)' : ROOT_PADDING,
        width: '100%',
        maxWidth: compact ? '400px' : '600px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: compact ? '12px' : 'clamp(16px, 4vw, 24px)' }}>
        <div className="animate-pulse" style={{ ...block(22), width: '55%', margin: '0 auto 8px' }} />
        <div className="animate-pulse" style={{ ...block(14), width: '80%', margin: '0 auto' }} />
      </div>

      <div style={{ display: 'grid', gap: FIELD_GAP }}>
        {fields.map((field) => (
          <div key={field}>
            <div className="animate-pulse" style={{ ...block(12), width: '40%', marginBottom: '8px' }} />
            <div className="animate-pulse" style={block(38)} />
          </div>
        ))}
      </div>

      <div
        style={{
          background: `${mergedTheme.primaryColor}10`,
          borderRadius: '12px',
          padding: CARD_PADDING,
          marginTop: compact ? '12px' : 'clamp(16px, 4vw, 24px)',
          border: `1px solid ${mergedTheme.primaryColor}20`,
        }}
      >
        <div className="animate-pulse" style={{ ...block(18), width: '45%', marginBottom: '16px' }} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: METRIC_GRID,
            gap: GRID_GAP,
            marginBottom: '20px',
          }}
        >
          {metrics.map((metric) => (
            <div
              key={metric}
              style={{
                background: mergedTheme.backgroundColor,
                borderRadius: '8px',
                padding: '12px',
                textAlign: 'center',
                minWidth: 0,
              }}
            >
              <div className="animate-pulse" style={{ ...block(11), width: '60%', margin: '0 auto 8px' }} />
              <div className="animate-pulse" style={{ ...block(20), width: '70%', margin: '0 auto' }} />
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: `1px solid ${mergedTheme.primaryColor}20`,
            paddingTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px 16px',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div className="animate-pulse" style={{ ...block(14), width: '45%' }} />
          <div className="animate-pulse" style={{ ...block(20), width: '35%' }} />
        </div>
      </div>

      <div
        className="animate-pulse"
        style={{
          ...block(48),
          marginTop: '20px',
          borderRadius: '10px',
          backgroundColor: `${mergedTheme.primaryColor}33`,
        }}
      />
    </div>
  );
}

interface InvestmentCalculatorErrorFallbackProps {
  theme: WidgetTheme;
  onRetry: () => void;
}

/**
 * Issue #1270 — the widget is rendered inside somebody else's page. An error
 * that escaped it took the whole frame down, leaving an empty box with no
 * explanation. The fallback keeps the failure inside the widget, explains it,
 * and offers a retry.
 */
function InvestmentCalculatorErrorFallback({
  theme,
  onRetry,
}: InvestmentCalculatorErrorFallbackProps): React.ReactElement {
  return (
    <div
      role="alert"
      style={{
        fontFamily: FONT_STACK,
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        borderRadius: '16px',
        padding: ROOT_PADDING,
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        boxSizing: 'border-box',
        textAlign: 'center',
      }}
    >
      <h2 style={{ margin: '0 0 8px', fontSize: TITLE_FONT_SIZE, fontWeight: 'bold' }}>
        The calculator could not be loaded
      </h2>
      <p style={{ margin: '0 0 16px', fontSize: SUBTITLE_FONT_SIZE, opacity: 0.75 }}>
        Something went wrong while working out the projection. Try again - if it keeps
        happening, reload the page.
      </p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: '12px 20px',
          backgroundColor: theme.primaryColor,
          color: '#ffffff',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          fontSize: BUTTON_FONT_SIZE,
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  );
}

interface InvestmentCalculatorFormProps extends InvestmentCalculatorWidgetProps {
  theme: WidgetTheme;
}

function InvestmentCalculatorForm({
  theme,
  defaultInvestment = 1000,
  defaultYield = 8,
  ctaUrl = 'https://propchain.io/properties',
  ctaText = 'Invest on PropChain',
  propertyId,
  compact = false,
}: InvestmentCalculatorFormProps): React.ReactElement {
  const [investment, setInvestment] = useState(defaultInvestment);
  const [yieldRate, setYieldRate] = useState(defaultYield);
  const [holdingPeriod, setHoldingPeriod] = useState(5);
  const [appreciation, setAppreciation] = useState(3);

  // The projection is derived from the four inputs, so it is calculated when
  // they change and not on every render. The previous version calculated it
  // in an effect, which showed a panel of zeroes for one render before the
  // real figures arrived.
  const results = useMemo(
    () =>
      calculateInvestmentProjection({
        investment,
        yieldRate,
        holdingPeriod,
        appreciation,
      }),
    [investment, yieldRate, holdingPeriod, appreciation]
  );

  const handleCtaClick = useCallback(() => {
    const url = propertyId
      ? `${ctaUrl.replace(/\/properties$/, `/properties/${propertyId}`)}`
      : ctaUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [ctaUrl, propertyId]);

  const sliderStyle: React.CSSProperties = {
    accentColor: theme.primaryColor,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: `1px solid ${theme.primaryColor}30`,
    fontSize: '14px',
    boxSizing: 'border-box',
    minWidth: 0,
  };

  if (compact) {
    return (
      <div
        style={{
          fontFamily: FONT_STACK,
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          borderRadius: '12px',
          padding: 'clamp(12px, 4vw, 16px)',
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          boxSizing: 'border-box',
          overflowWrap: 'break-word',
        }}
      >
        {theme.logoUrl && (
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <img src={theme.logoUrl} alt={theme.brandName} style={{ maxHeight: '32px', maxWidth: '100%' }} />
          </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: TITLE_FONT_SIZE, fontWeight: 'bold' }}>
            Investment Calculator
          </h3>
          <p style={{ margin: 0, fontSize: SUBTITLE_FONT_SIZE, opacity: 0.7 }}>
            Project your returns
          </p>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
            Investment: {formatCurrency(investment)}
          </label>
          <input
            type="range"
            min="50"
            max="50000"
            step="50"
            value={investment}
            onChange={(e) => setInvestment(toNumber(e.target.value))}
            style={{ ...sliderStyle, width: '100%', minWidth: 0 }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>
            Annual Yield: {yieldRate}%
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={yieldRate}
            onChange={(e) => setYieldRate(toNumber(e.target.value))}
            style={{ ...sliderStyle, width: '100%', minWidth: 0 }}
          />
        </div>

        <div
          style={{
            background: `${theme.primaryColor}10`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '12px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', opacity: 0.7 }}>
              Projected Value ({holdingPeriod} yrs)
            </p>
            <p
              style={{
                margin: 0,
                fontSize: TOTAL_FONT_SIZE,
                fontWeight: 'bold',
                color: theme.primaryColor,
                overflowWrap: 'anywhere',
              }}
            >
              {formatCurrency(investment + results.totalReturn)}
            </p>
          </div>
        </div>

        <button
          onClick={handleCtaClick}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: theme.primaryColor,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            boxSizing: 'border-box',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.secondaryColor)}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.primaryColor)}
        >
          {ctaText}
        </button>

        <p style={{ margin: '8px 0 0', fontSize: '10px', opacity: 0.5, textAlign: 'center' }}>
          Powered by {theme.brandName}
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: FONT_STACK,
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        borderRadius: '16px',
        padding: ROOT_PADDING,
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        boxSizing: 'border-box',
        overflowWrap: 'break-word',
      }}
    >
      {theme.logoUrl && (
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <img src={theme.logoUrl} alt={theme.brandName} style={{ maxHeight: '40px', maxWidth: '100%' }} />
        </div>
      )}

      <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: TITLE_FONT_SIZE, fontWeight: 'bold' }}>
          Investment Calculator
        </h2>
        <p style={{ margin: 0, fontSize: SUBTITLE_FONT_SIZE, opacity: 0.7 }}>
          Estimate your potential returns from tokenized real estate
        </p>
      </div>

      <div style={{ display: 'grid', gap: FIELD_GAP }}>
        <div>
          <label
            style={{
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 12px',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '8px',
            }}
          >
            <span>Investment Amount</span>
            <span style={{ color: theme.primaryColor, fontWeight: 'bold' }}>
              {formatCurrency(investment)}
            </span>
          </label>
          <input
            type="number"
            min={0}
            value={investment}
            onChange={(e) => setInvestment(toNumber(e.target.value))}
            style={inputStyle}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 12px',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '8px',
            }}
          >
            <span>Expected Annual Yield</span>
            <span style={{ color: theme.primaryColor, fontWeight: 'bold' }}>
              {yieldRate}%
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            step="0.1"
            value={yieldRate}
            onChange={(e) => setYieldRate(toNumber(e.target.value))}
            style={{ ...sliderStyle, width: '100%', minWidth: 0 }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 12px',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '8px',
            }}
          >
            <span>Holding Period</span>
            <span style={{ color: theme.primaryColor, fontWeight: 'bold' }}>
              {holdingPeriod} Years
            </span>
          </label>
          <input
            type="range"
            min="1"
            max="30"
            step="1"
            value={holdingPeriod}
            onChange={(e) => setHoldingPeriod(toNumber(e.target.value))}
            style={{ ...sliderStyle, width: '100%', minWidth: 0 }}
          />
        </div>

        <div>
          <label
            style={{
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px 12px',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '8px',
            }}
          >
            <span>Annual Appreciation</span>
            <span style={{ color: theme.primaryColor, fontWeight: 'bold' }}>
              {appreciation}%
            </span>
          </label>
          <input
            type="range"
            min="-5"
            max="15"
            step="0.5"
            value={appreciation}
            onChange={(e) => setAppreciation(toNumber(e.target.value))}
            style={{ ...sliderStyle, width: '100%', minWidth: 0 }}
          />
        </div>
      </div>

      <div
        style={{
          background: `${theme.primaryColor}10`,
          borderRadius: '12px',
          padding: CARD_PADDING,
          marginTop: 'clamp(16px, 4vw, 24px)',
          border: `1px solid ${theme.primaryColor}20`,
        }}
      >
        <h3 style={{ margin: '0 0 16px', fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 'bold' }}>
          Projected Returns
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: METRIC_GRID,
            gap: GRID_GAP,
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              background: theme.backgroundColor,
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.7 }}>Projected ROI</p>
            <p
              style={{
                margin: 0,
                fontSize: METRIC_FONT_SIZE,
                fontWeight: 'bold',
                color: '#10b981',
                overflowWrap: 'anywhere',
              }}
            >
              +{results.roi.toFixed(1)}%
            </p>
          </div>
          <div
            style={{
              background: theme.backgroundColor,
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.7 }}>Annual Return</p>
            <p
              style={{
                margin: 0,
                fontSize: METRIC_FONT_SIZE,
                fontWeight: 'bold',
                color: theme.primaryColor,
                overflowWrap: 'anywhere',
              }}
            >
              {formatCurrency(results.annualReturn)}
            </p>
          </div>
          <div
            style={{
              background: theme.backgroundColor,
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.7 }}>IRR (Est.)</p>
            <p
              style={{
                margin: 0,
                fontSize: METRIC_FONT_SIZE,
                fontWeight: 'bold',
                color: '#6366f1',
                overflowWrap: 'anywhere',
              }}
            >
              {results.irr.toFixed(1)}%
            </p>
          </div>
          <div
            style={{
              background: theme.backgroundColor,
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              minWidth: 0,
            }}
          >
            <p style={{ margin: '0 0 4px', fontSize: '11px', opacity: 0.7 }}>Break-even</p>
            <p
              style={{
                margin: 0,
                fontSize: METRIC_FONT_SIZE,
                fontWeight: 'bold',
                color: '#f59e0b',
                overflowWrap: 'anywhere',
              }}
            >
              {results.breakEvenMonths} mo
            </p>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${theme.primaryColor}20`, paddingTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 16px',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Total Projected Value</span>
            <span
              style={{
                fontSize: TOTAL_FONT_SIZE,
                fontWeight: 'bold',
                color: theme.primaryColor,
                minWidth: 0,
                overflowWrap: 'anywhere',
              }}
            >
              {formatCurrency(investment + results.totalReturn)}
            </span>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    backgroundColor: theme.primaryColor,
                    flexShrink: 0,
                  }}
                ></div>
                <span>Principal</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    backgroundColor: `${theme.primaryColor}30`,
                    flexShrink: 0,
                  }}
                ></div>
                <span>Yield + Appreciation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleCtaClick}
        style={{
          width: '100%',
          padding: '14px',
          backgroundColor: theme.primaryColor,
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          fontWeight: 'bold',
          fontSize: BUTTON_FONT_SIZE,
          cursor: 'pointer',
          marginTop: '20px',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxSizing: 'border-box',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.secondaryColor)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.primaryColor)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        {ctaText}
      </button>

      <p style={{ margin: '12px 0 0', fontSize: '11px', opacity: 0.5, textAlign: 'center' }}>
        Powered by {theme.brandName} · Returns are estimates only
      </p>
    </div>
  );
}

/**
 * Issue #1267 - the widget has to work in a frame that is a 600px column on a
 * desktop and a 320px phone screen on a mobile, so the layout scales with the
 * viewport instead of assuming a fixed width.
 *
 * Issue #1269 - `InvestmentCalculatorSkeleton` is the placeholder the embed
 * page shows while the widget is on its way.
 *
 * Issue #1270 - the widget is rendered inside somebody else's page, so a
 * failure inside it is caught here and turned into a fallback with a retry,
 * rather than emptying the frame.
 */
export function InvestmentCalculatorWidget({
  theme,
  defaultInvestment = 1000,
  defaultYield = 8,
  ctaUrl = 'https://propchain.io/properties',
  ctaText = 'Invest on PropChain',
  propertyId,
  compact = false,
}: InvestmentCalculatorWidgetProps): React.ReactElement {
  const mergedTheme: WidgetTheme = { ...DEFAULT_THEME, ...theme };
  const [retryCount, setRetryCount] = useState(0);

  // Remounting the boundary clears the error it caught, which is what the
  // retry button in the fallback does.
  const handleRetry = useCallback(() => setRetryCount((count) => count + 1), []);

  return (
    <ErrorBoundary
      key={retryCount}
      fallback={
        <InvestmentCalculatorErrorFallback theme={mergedTheme} onRetry={handleRetry} />
      }
    >
      <InvestmentCalculatorForm
        theme={mergedTheme}
        defaultInvestment={defaultInvestment}
        defaultYield={defaultYield}
        ctaUrl={ctaUrl}
        ctaText={ctaText}
        propertyId={propertyId}
        compact={compact}
      />
    </ErrorBoundary>
  );
}
