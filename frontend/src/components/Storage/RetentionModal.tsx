import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Clock, ShieldAlert, Check, HardDrive } from 'lucide-react';

interface RetentionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDays: number;
  onSave: (days: number) => Promise<any>;
  isLoading?: boolean;
}

export const RetentionModal: React.FC<RetentionModalProps> = ({
  isOpen,
  onClose,
  currentDays,
  onSave,
  isLoading = false
}) => {
  const [selectedOption, setSelectedOption] = useState<number | 'custom'>(
    [7, 14, 30, 60, 90].includes(currentDays) ? currentDays : 'custom'
  );
  const [customDays, setCustomDays] = useState<number>(currentDays);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const presets = [7, 14, 30, 60, 90];

  const handleSave = async () => {
    const finalDays = selectedOption === 'custom' ? customDays : selectedOption;
    if (finalDays < 1) return;

    try {
      await onSave(finalDays);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 700);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Configure Video Retention Policy
        </span>
      }
      subtitle="Automatically prune older FFmpeg video recordings from the desktop disk to prevent storage saturation."
      maxWidth="lg"
    >
      <div className="space-y-5 text-gray-200">
        <div className="p-3.5 bg-[#161921] border border-[#242933] rounded-xl space-y-2.5">
          <label className="text-xs font-semibold text-gray-300 block">
            Select Retention Duration:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setSelectedOption(days);
                }}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  selectedOption === days
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-xs'
                    : 'bg-[#0A0C10] border-[#242933] text-gray-300 hover:border-gray-600'
                }`}
              >
                <span>{days} Days</span>
                {selectedOption === days && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedOption('custom')}
              className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                selectedOption === 'custom'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-xs'
                  : 'bg-[#0A0C10] border-[#242933] text-gray-300 hover:border-gray-600'
              }`}
            >
              <span>Custom Days</span>
              {selectedOption === 'custom' && <Check className="w-3.5 h-3.5 text-blue-400" />}
            </button>
          </div>

          {selectedOption === 'custom' && (
            <div className="pt-2 animate-in fade-in">
              <label className="block text-[11px] text-gray-400 mb-1">
                Enter Custom Days Limit:
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={(e) => setCustomDays(Number(e.target.value) || 1)}
                className="w-full bg-[#0A0C10] border border-[#242933] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
        </div>

        {/* Disk space impact advice */}
        <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-start gap-2.5">
          <HardDrive className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-200">Continuous Auto-Recycling</p>
            <p className="text-[11px] text-blue-300/80 leading-relaxed">
              When recordings exceed{' '}
              <span className="font-bold text-blue-200">
                {selectedOption === 'custom' ? customDays : selectedOption} days
              </span>
              , background tasks on the desktop server will purge the oldest .mp4 files first to maintain free space.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#242933]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-[#161921] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{saveSuccess ? 'Saved Policy!' : 'Apply Retention'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
