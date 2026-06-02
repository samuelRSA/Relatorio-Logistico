import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function Drawer({ isOpen, title, children, onClose }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Fechar drawer"
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 h-screen w-[520px] overflow-y-auto border-l border-white/10 bg-graphite-900 p-6 shadow-executive"
            initial={{ x: 540 }}
            animate={{ x: 0 }}
            exit={{ x: 540 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-signal-amber">
                  Contexto
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-white">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-white/10 p-3 text-slate-400 transition hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
