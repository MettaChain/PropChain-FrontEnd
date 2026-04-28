'use client';

import React from 'react';
import Image from 'next/image';
import { X, Plus, Minus, ShoppingCart, Trash2, Fuel } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/utils/searchUtils';
import type { CartItem } from '@/types/cart';

export const CartSidebar: React.FC = () => {
  const {
    items,
    totalCost,
    totalGasEstimate,
    isOpen,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
  } = useCartStore();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    try {
      // Import dynamically to avoid SSR issues
      const { BatchTransactionService } = await import('@/lib/batchTransaction');
      
      // Mock wallet address - in real app, this would come from wallet connection
      const walletAddress = '0x1234567890123456789012345678901234567890';
      
      // Show loading state
      const result = await BatchTransactionService.executeBatchPurchase(items, walletAddress);
      
      if (result.success) {
        // Clear cart on successful purchase
        clearCart();
        // Show success message
        alert('Batch purchase completed successfully!');
      } else {
        // Show error message
        alert(`Purchase failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={toggleCart}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-50 flex items-center gap-2"
      >
        <ShoppingCart className="w-6 h-6" />
        {totalItems > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {totalItems}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={toggleCart}
      />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Shopping Cart ({totalItems})
              </h2>
            </div>
            <button
              onClick={toggleCart}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Your cart is empty
                </p>
                <button
                  onClick={toggleCart}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdateQuantity={(quantity) =>
                      updateQuantity(item.property.id, quantity)
                    }
                    onRemove={() => removeItem(item.property.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-4">
              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatPrice(totalCost)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <Fuel className="w-4 h-4" />
                    Estimated Gas
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {totalGasEstimate.toFixed(4)} ETH
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">
                    Total
                  </span>
                  <span className="text-blue-600">
                    {formatPrice(totalCost)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Purchase All ({totalItems} tokens)
                </button>
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
  item,
  onUpdateQuantity,
  onRemove,
}) => {
  const { property, quantity } = item;
  const itemTotal = property.price.perToken * quantity;

  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex gap-3">
        {/* Property Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={property.images[0]}
            alt={property.name}
            fill
            className="object-cover"
          />
        </div>

        {/* Property Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-white truncate">
            {property.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {property.location.city}, {property.location.state}
          </p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-blue-600">
              {formatPrice(property.price.perToken)} per token
            </span>
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Quantity:
          </span>
          <div className="flex items-center gap-1 bg-white dark:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-500">
            <button
              onClick={() => onUpdateQuantity(quantity - 1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-l-lg transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(quantity + 1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-r-lg transition-colors"
              disabled={quantity >= property.tokenInfo.available}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <span className="text-xs text-gray-500">
            {property.tokenInfo.available} available
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatPrice(itemTotal)}
          </p>
        </div>
      </div>
    </div>
  );
};
