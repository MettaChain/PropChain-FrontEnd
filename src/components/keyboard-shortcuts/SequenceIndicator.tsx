'use client';

/**
 * Sequence Indicator Component
 * 
 * Visual feedback component showing sequence shortcut progress.
 * Displays the keys pressed so far and the expected next keys.
 */

import React from 'react';
import type { SequenceIndicatorProps } from '@/types/keyboard-shortcuts';

/**
 * Sequence Indicator Component
 * 
 * Shows visual feedback for sequence shortcuts in progress.
 * Positioned at bottom-right corner with fade in/out animations.
 */
export function SequenceIndicator({
  currentSequence,
  expectedKeys,
  visible,
}: SequenceIndicatorProps) {
  if (!visible || currentSequence.length === 0) {
    return null;
  }
  
  return (
    <div
      className="fixed bottom-4 right-4 z-50 pointer-events-none"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="
          bg-background/95 backdrop-blur-sm
          border border-border
          rounded-lg shadow-lg
          px-4 py-3
          animate-in fade-in duration-100
        "
      >
        <div className="flex items-center gap-3 text-sm">
          {/* Pressed keys */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground font-medium">Pressed:</span>
            <div className="flex gap-1">
              {currentSequence.map((key, index) => (
                <kbd
                  key={index}
                  className="
                    inline-flex items-center justify-center
                    min-w-[2rem] h-8 px-2
                    bg-muted
                    border border-border
                    rounded
                    font-mono font-semibold text-sm
                    uppercase
                  "
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
          
          {/* Separator */}
          <div className="h-6 w-px bg-border" />
          
          {/* Expected next keys */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground font-medium">Next:</span>
            <div className="flex gap-1">
              {expectedKeys.map((key, index) => (
                <React.Fragment key={key}>
                  {index > 0 && (
                    <span className="text-muted-foreground text-xs self-center">
                      or
                    </span>
                  )}
                  <kbd
                    className="
                      inline-flex items-center justify-center
                      min-w-[2rem] h-8 px-2
                      bg-primary/10
                      border border-primary/30
                      rounded
                      font-mono font-semibold text-sm
                      text-primary
                      uppercase
                    "
                  >
                    {key}
                  </kbd>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
