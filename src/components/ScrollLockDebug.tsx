"use client";

import { useEffect, useState } from 'react';
import { forceUnlockScroll, getScrollLockCount, isScrollLocked } from '@/utils/scrollUtils';
import { Unlock } from 'lucide-react';

/**
 * Emergency scroll unlock button
 * Shows when scroll is locked for debugging/emergency situations
 * Only visible in development or when scroll is stuck
 */
export default function ScrollLockDebug() {
    const [isLocked, setIsLocked] = useState(false);
    const [lockCount, setLockCount] = useState(0);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        // Check scroll lock status every second
        const interval = setInterval(() => {
            const locked = isScrollLocked();
            const count = getScrollLockCount();

            setIsLocked(locked);
            setLockCount(count);

            // Show debug button if scroll is locked for more than 3 seconds
            if (locked && count > 0) {
                setShowDebug(true);
            } else {
                setShowDebug(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleForceUnlock = () => {
        forceUnlockScroll();
        setShowDebug(false);

        // Show success message
        const message = document.createElement('div');
        message.textContent = 'Scroll unlocked!';
        message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #10b981;
      color: white;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      z-index: 99999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;
        document.body.appendChild(message);

        setTimeout(() => {
            message.remove();
        }, 2000);
    };

    // Only show in development or when scroll is stuck
    if (!showDebug && process.env.NODE_ENV === 'production') {
        return null;
    }

    if (!showDebug) return null;

    return (
        <button
            onClick={handleForceUnlock}
            className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg transition-all duration-300 animate-pulse"
            title={`Scroll locked (count: ${lockCount}). Click to force unlock.`}
        >
            <Unlock className="h-5 w-5" />
            <span className="font-medium">Unlock Scroll</span>
            {lockCount > 1 && (
                <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                    {lockCount}
                </span>
            )}
        </button>
    );
}
