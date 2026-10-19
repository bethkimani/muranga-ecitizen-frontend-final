import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'dialog' | 'drawer';
}

const ease = [0.23, 1, 0.32, 1] as const;

export function Modal({ open, onClose, title, description, children, footer, variant = 'dialog' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const drawer = variant === 'drawer';

  return (
    <AnimatePresence>
      {open &&
      <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <motion.div
          className="absolute inset-0 bg-ink/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose} />
        
          <motion.div
          className={
          drawer ?
          'absolute inset-y-0 right-0 flex w-full max-w-lg flex-col bg-white shadow-pop' :
          'absolute left-1/2 top-1/2 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-pop'
          }
          initial={drawer ? { x: '100%' } : { opacity: 0, scale: 0.96 }}
          animate={drawer ? { x: 0 } : { opacity: 1, scale: 1 }}
          exit={drawer ? { x: '100%' } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease }}>
          
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <h2 id="modal-title" className="text-lg font-bold text-ink">
                  {title}
                </h2>
                {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
              </div>
              <button onClick={onClose} className="btn-ghost -mr-2 h-9 w-9 px-0" aria-label="Close">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      }
    </AnimatePresence>);

}