import { useState, useCallback } from 'react';
import { ConfirmModal, type ConfirmType } from '@/components/ConfirmModal/ConfirmModal';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: ConfirmType;
  onConfirm: () => void | Promise<void>;
}

export function useConfirm() {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpened(true);
  }, []);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await options.onConfirm();
      setOpened(false);
    } catch (error) {
      console.error('Confirm action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOpened(false);
    }
  };

  const ConfirmComponent = () => (
    <ConfirmModal
      opened={opened}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      cancelLabel={options.cancelLabel}
      type={options.type}
      loading={loading}
    />
  );

  return { confirm, ConfirmComponent };
}
