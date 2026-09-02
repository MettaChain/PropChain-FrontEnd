import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraggablePropertiesList } from '../DraggablePropertiesList';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const { fill, ...rest } = props;
    return React.createElement('img', rest);
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const PORTFOLIO_ORDER_KEY = 'propchain:portfolioOrder';

describe('DraggablePropertiesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should render property cards', () => {
    render(<DraggablePropertiesList />);
    
    expect(screen.getByText('Your Properties')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop to reorder your portfolio')).toBeInTheDocument();
  });

  it('should render reset order button', () => {
    render(<DraggablePropertiesList />);
    
    expect(screen.getByText('Reset Order')).toBeInTheDocument();
  });

  it('should save order to localStorage when reordered', async () => {
    render(<DraggablePropertiesList />);
    
    const cards = screen.getAllByTestId('draggable-property');
    expect(cards.length).toBeGreaterThan(1);
    const firstCard = cards[0];
    const secondCard = cards[1];
    
    const dataTransfer = {
      effectAllowed: undefined as string | undefined,
      dropEffect: undefined as string | undefined,
      setData: jest.fn(),
    };
    
    fireEvent.dragStart(firstCard, { dataTransfer });
    fireEvent.dragOver(secondCard, { dataTransfer });
    fireEvent.drop(secondCard, { dataTransfer });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      PORTFOLIO_ORDER_KEY,
      expect.any(String)
    );
  });

  it('should load order from localStorage on mount', () => {
    const savedOrder = JSON.stringify(['2', '1', '3', '4', '5', '6']);
    localStorageMock.getItem.mockReturnValue(savedOrder);
    
    render(<DraggablePropertiesList />);
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith(PORTFOLIO_ORDER_KEY);
  });

  it('should reset to default order when reset button clicked', async () => {
    render(<DraggablePropertiesList />);
    
    const resetButton = screen.getByText('Reset Order');
    await userEvent.click(resetButton);
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(PORTFOLIO_ORDER_KEY);
  });
});
