import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  isLoading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {isDangerous ? (
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          ) : (
            <Info className="w-5 h-5 text-blue-500" />
          )}
          {title}
        </span>
      }
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="text-sm text-slate-300 leading-relaxed">
          {message}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            id="confirm-cancel-btn"
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            id="confirm-action-btn"
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/30'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/30'
            } disabled:opacity-50`}
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isDangerous ? (
              <Trash2 className="w-4 h-4" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
