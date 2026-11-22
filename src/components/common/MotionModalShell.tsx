import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const MODAL_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const MODAL_TRANSITION = {
  duration: 0.22,
  ease: MODAL_EASE,
};

interface MotionModalPresenceProps {
  isOpen: boolean;
  modalKey: string;
  zIndexClass?: string;
  children: React.ReactNode;
}

/**
 * Smooth Framer Motion wrapper for fullscreen & sheet modals.
 * - Uses GPU-friendly opacity + y + scale animation with zero layout jump
 * - Honors <MotionConfig reducedMotion="user">
 * - Never blocks interactive inner elements
 */
export const MotionModalPresence: React.FC<MotionModalPresenceProps> = ({
  isOpen,
  modalKey,
  zIndexClass = 'z-50',
  children,
}) => {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key={modalKey}
          initial={{ opacity: 0, y: 16, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.985 }}
          transition={MODAL_TRANSITION}
          className={`fixed inset-0 ${zIndexClass} will-change-transform`}
          style={{ pointerEvents: 'auto' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface MotionDialogPresenceProps {
  isOpen: boolean;
  dialogKey: string;
  onBackdropClick?: () => void;
  zIndexClass?: string;
  children: React.ReactNode;
}

/**
 * Smooth centered dialog / modal sheet animation with dimmed backdrop.
 */
export const MotionDialogPresence: React.FC<MotionDialogPresenceProps> = ({
  isOpen,
  dialogKey,
  onBackdropClick,
  zIndexClass = 'z-[70]',
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={dialogKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: MODAL_EASE }}
          onClick={onBackdropClick}
          className={`fixed inset-0 ${zIndexClass} bg-black/50 backdrop-blur-xs flex items-center justify-center p-4`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={MODAL_TRANSITION}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
