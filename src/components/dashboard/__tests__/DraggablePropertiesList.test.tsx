import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DraggablePropertiesList } from '../DraggablePropertiesList';

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
    
    const firstCard = screen.getAllByTestId('property-card')[0];
    const secondCard = screen.getAllByTestId('property-card')[1];
    
    // Simulate drag and drop
    fireEvent.dragStart(firstCard);
    fireEvent.dragOver(secondCard);
    fireEvent.drop(secondCard);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'portfolioOrder',
      expect.any(String)
    );
  });

  it('should load order from localStorage on mount', () => {
    const savedOrder = JSON.stringify(['2', '1', '3', '4', '5', '6']);
    localStorageMock.getItem.mockReturnValue(savedOrder);
    
    render(<DraggablePropertiesList />);
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('portfolioOrder');
  });

  it('should reset to default order when reset button clicked', async () => {
    render(<DraggablePropertiesList />);
    
    const resetButton = screen.getByText('Reset Order');
    await userEvent.click(resetButton);
    
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('portfolioOrder');
  });
});
