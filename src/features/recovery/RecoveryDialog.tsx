import React from 'react';
import { RecoveryDialogProps } from './recoveryTypes';

export function RecoveryDialog({ isOpen, onConfirm, onCancel, context }: RecoveryDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Application Recovery</h2>
        <p className="text-gray-600 mb-6">
          The application encountered a critical state ({context?.reason || 'Unknown error'}). 
          We need to reload the page to safely recover. Unsaved progress may be lost.
        </p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
          >
            Wait, let me check
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            Reload Application
          </button>
        </div>
      </div>
    </div>
  );
}
