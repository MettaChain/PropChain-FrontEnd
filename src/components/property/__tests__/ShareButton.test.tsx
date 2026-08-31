import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from '../ShareButton';
import { toast } from 'sonner';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

const property = {
  id: 'prop-1',
  name: 'Lakeside Villa',
  location: { city: 'Austin', state: 'TX' },
  price: { total: 2.5, perToken: 0.1 },
  images: ['/images/lakeside.jpg'],
  metrics: { roi: 12 },
};

const shareUrl = `${window.location.origin}/properties/prop-1`;

describe('ShareButton', () => {
  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    openSpy.mockRestore();
    // Remove native share support so it does not leak between tests.
    delete (navigator as { share?: unknown }).share;
  });

  it('renders the share trigger button', () => {
    render(<ShareButton property={property} />);

    expect(
      screen.getByRole('button', { name: /share/i })
    ).toBeInTheDocument();
  });

  it('opens the share dialog when the trigger is clicked', async () => {
    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    expect(
      await screen.findByRole('heading', { name: 'Share Property' })
    ).toBeInTheDocument();
  });

  it('shows a property preview inside the dialog', async () => {
    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    expect(screen.getByText('Lakeside Villa')).toBeInTheDocument();
    expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    expect(screen.getByText('2.5 ETH')).toBeInTheDocument();
    expect(screen.getByText('12% ROI')).toBeInTheDocument();
  });

  it('opens the twitter share intent when twitter is clicked', async () => {
    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    fireEvent.click(screen.getByRole('button', { name: /twitter/i }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      expect.any(String)
    );
    expect(toast.success).toHaveBeenCalledWith(
      'Opening Twitter share dialog...'
    );
  });

  it('opens the linkedin share intent when linkedin is clicked', async () => {
    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    fireEvent.click(screen.getByRole('button', { name: /linkedin/i }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing/share-offsite'),
      '_blank',
      expect.any(String)
    );
  });

  it('opens a mailto link when email is clicked', async () => {
    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    fireEvent.click(screen.getByRole('button', { name: /email/i }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:')
    );
  });

  it('copies the property link to the clipboard', async () => {
    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(shareUrl);
    expect(await screen.findByText('Copied!')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!');
  });

  it('falls back to copying the link when native share is unsupported', async () => {
    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    expect(
      screen.queryByRole('button', { name: /native share/i })
    ).not.toBeInTheDocument();
  });

  it('shows and invokes the native share option when supported', async () => {
    const shareMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });

    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    const nativeButton = screen.getByRole('button', { name: /native share/i });
    expect(nativeButton).toBeInTheDocument();

    fireEvent.click(nativeButton);

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Lakeside Villa',
          url: shareUrl,
        })
      );
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Property shared successfully!'
    );
  });

  it('silently ignores a cancelled native share (AbortError)', async () => {
    const shareMock = jest.fn().mockRejectedValue(
      Object.assign(new Error('aborted'), { name: 'AbortError' })
    );
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });

    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    fireEvent.click(screen.getByRole('button', { name: /native share/i }));

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalled();
    });
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('shows an error toast when the native share fails', async () => {
    const shareMock = jest
      .fn()
      .mockRejectedValue(new Error('share unavailable'));
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });

    render(<ShareButton property={property} />);

    fireEvent.click(screen.getByRole('button', { name: /share/i }));
    await screen.findByRole('heading', { name: 'Share Property' });

    fireEvent.click(screen.getByRole('button', { name: /native share/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to share property');
    });
  });
});
