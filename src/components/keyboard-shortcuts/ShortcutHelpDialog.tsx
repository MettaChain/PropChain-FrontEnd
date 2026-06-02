'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShortcutCategory } from '@/types/keyboard-shortcuts';
import type { ShortcutEntry } from '@/types/keyboard-shortcuts';

interface ShortcutHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Map<ShortcutCategory, ShortcutEntry[]>;
}

export function ShortcutHelpDialog({ open, onOpenChange, shortcuts }: ShortcutHelpDialogProps) {
  const categoryLabels: Record<ShortcutCategory, string> = {
    navigation: 'Navigation',
    search: 'Search',
    ui: 'UI',
    general: 'General',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {Array.from(shortcuts.entries()).map(([category, entries]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {categoryLabels[category]}
              </h3>
              <div className="space-y-1">
                {entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                  >
                    <span className="text-sm">{entry.config.description}</span>
                    <kbd className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 bg-muted border border-border rounded font-mono font-semibold text-xs uppercase">
                      {Array.isArray(entry.config.key) 
                        ? entry.config.key.map((k, i) => (
                            <React.Fragment key={k}>
                              {i > 0 && <span className="text-muted-foreground/50">+</span>}
                              {k}
                            </React.Fragment>
                          ))
                        : entry.config.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}