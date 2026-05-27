import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';
import i18n from '@/i18n';

type NotifyOptions = {
  title?: string;
  message: string;
};

export const notify = {
  loading(message = i18n.t('notifications.pleaseWait')) {
    return notifications.show({
      loading: true,
      title: i18n.t('notifications.processing'),
      message,
      autoClose: false,
      withCloseButton: false,
    });
  },

  success(id: string, { title = i18n.t('notifications.success'), message }: NotifyOptions) {
    notifications.update({
      id,
      title,
      message,
      color: 'green',
      icon: <IconCheck size={20} />,
      autoClose: 3000,
    });
  },

  error(id: string, { title = i18n.t('notifications.error'), message }: NotifyOptions) {
    notifications.update({
      id,
      title,
      message,
      color: 'red',
      icon: <IconX size={20} />,
      autoClose: 4000,
    });
  },

  info({ title = i18n.t('notifications.info'), message }: NotifyOptions) {
    notifications.show({
      title,
      message,
      color: 'blue',
      icon: <IconInfoCircle size={20} />,
      autoClose: 3000,
    });
  },

  warning({ title = i18n.t('notifications.warning'), message }: NotifyOptions) {
    notifications.show({
      title,
      message,
      color: 'yellow',
      icon: <IconAlertTriangle size={20} />,
      autoClose: 3500,
    });
  },
};
