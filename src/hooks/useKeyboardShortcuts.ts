'use client';
// @ts-ignore
import { useEffect, useRef, RefObject } from "react";
// @ts-ignore
import { useRouter } from "next/navigation";
// @ts-ignore

interface UseKeyboardShortcutsProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  closeActiveModal: () => void;
  toggleHelpModal: () => void;
}

export const useKeyboardShortcuts = ({
  searchInputRef,
  closeActiveModal,
  toggleHelpModal,
}: UseKeyboardShortcutsProps) => {
  const router = useRouter();
  const lastKeyRef = useRef<{ key: string; time: number }>({ key: "", time: 0 });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const targetTag = target.tagName?.toLowerCase();

      if (targetTag === "input" || targetTag === "textarea" || target.isContentEditable) {
        if (event.key === "Escape") {
          closeActiveModal();
        }
        return;
      }

      const currentKey = event.key.toLowerCase();
      const now = Date.now();
      
      const isSequence = lastKeyRef.current.key === "g" && (now - lastKeyRef.current.time < 1000);

      if (isSequence) {
        if (currentKey === "p") {
          event.preventDefault();
          router.push("/properties");
          lastKeyRef.current = { key: "", time: 0 };
          return;
        }
        if (currentKey === "d") {
          event.preventDefault();
          router.push("/dashboard");
          lastKeyRef.current = { key: "", time: 0 };
          return;
        }
      }

      if (currentKey === "g") {
        lastKeyRef.current = { key: "g", time: now };
        return;
      }

      switch (event.key) {
        case "/":
          event.preventDefault();
          searchInputRef.current?.focus();
          break;
        case "Escape":
          event.preventDefault();
          closeActiveModal();
          break;
        case "?":
          event.preventDefault();
          toggleHelpModal();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchInputRef, closeActiveModal, toggleHelpModal, router]);
};