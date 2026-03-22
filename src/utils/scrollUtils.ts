/**
 * Robust scroll lock utility with reference counting
 * Prevents scroll lock from getting stuck when multiple components use it
 */

let scrollLockCount = 0;
let originalOverflow = '';
let originalDocumentOverflow = '';
let originalPosition = '';
let originalTop = '';
let scrollY = 0;

/**
 * Lock body scroll (with reference counting)
 * Safe to call multiple times - will only unlock when all locks are released
 * Enhanced for iOS with position:fixed and scroll position preservation
 */
export function lockScroll(): void {
  if (typeof window === 'undefined') return;

  if (scrollLockCount === 0) {
    // Store original values
    scrollY = window.scrollY;
    originalOverflow = document.body.style.overflow;
    originalDocumentOverflow = document.documentElement.style.overflow;
    originalPosition = document.body.style.position;
    originalTop = document.body.style.top;

    // Lock scroll - enhanced for iOS
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    // Add class for CSS-based styling
    document.body.classList.add('scroll-locked');
    document.documentElement.classList.add('modal-open');
  }
  scrollLockCount++;
}

/**
 * Unlock body scroll (with reference counting)
 * Only unlocks when all locks have been released
 * Restores scroll position for iOS
 */
export function unlockScroll(): void {
  if (typeof window === 'undefined') return;

  scrollLockCount = Math.max(0, scrollLockCount - 1);

  if (scrollLockCount === 0) {
    // Restore original values
    document.body.style.overflow = originalOverflow;
    document.documentElement.style.overflow = originalDocumentOverflow;
    document.body.style.position = originalPosition;
    document.body.style.top = originalTop;
    document.body.style.width = '';

    // Remove classes
    document.body.classList.remove('scroll-locked');
    document.documentElement.classList.remove('modal-open');

    // Restore scroll position
    window.scrollTo(0, scrollY);
  }
}

/**
 * Force unlock all scroll locks (emergency reset)
 * Use this if scroll gets stuck
 */
export function forceUnlockScroll(): void {
  if (typeof window === 'undefined') return;

  const savedScrollY = scrollY;
  scrollLockCount = 0;

  // Remove all inline styles
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';

  // Remove properties
  document.body.style.removeProperty('overflow');
  document.documentElement.style.removeProperty('overflow');
  document.body.style.removeProperty('position');
  document.body.style.removeProperty('top');
  document.body.style.removeProperty('width');

  // Remove classes
  document.body.classList.remove('scroll-locked');
  document.documentElement.classList.remove('modal-open');

  // Restore scroll position
  window.scrollTo(0, savedScrollY);
}

/**
 * Check if scroll is currently locked
 */
export function isScrollLocked(): boolean {
  return scrollLockCount > 0;
}

/**
 * Get current lock count (for debugging)
 */
export function getScrollLockCount(): number {
  return scrollLockCount;
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use lockScroll/unlockScroll instead
 */
export const preventScrollOnClick = (callback: () => void, shouldScrollToTop: boolean = false) => {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement) {
    activeElement.blur();
  }

  lockScroll();
  callback();

  requestAnimationFrame(() => {
    unlockScroll();

    if (shouldScrollToTop) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }
  });
};

// Emergency cleanup on page visibility change
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Force unlock when page becomes visible again
      // This helps recover from stuck scroll locks
      if (scrollLockCount > 0) {
        console.warn('[ScrollLock] Detected stuck scroll lock, forcing unlock');
        forceUnlockScroll();
      }
    }
  });

  // Emergency cleanup on page unload
  window.addEventListener('beforeunload', () => {
    forceUnlockScroll();
  });
}
