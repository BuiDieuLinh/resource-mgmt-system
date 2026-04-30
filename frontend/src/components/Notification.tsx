import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconInfoCircle, IconAlertTriangle } from '@tabler/icons-react';

type NotifyOptions = {
  title?: string;
  message: string;
};

export const notify = {
  loading(message = 'Please wait...') {
    return notifications.show({
      loading: true,
      title: 'Processing',
      message,
      autoClose: false,
      withCloseButton: false,
    });
  },

  success(id: string, { title = 'Success', message }: NotifyOptions) {
    notifications.update({
      id,
      title,
      message,
      color: 'green',
      icon: <IconCheck size={20} />,
      autoClose: 3000,
    });
  },

  error(id: string, { title = 'Error', message }: NotifyOptions) {
    notifications.update({
      id,
      title,
      message,
      color: 'red',
      icon: <IconX size={20} />,
      autoClose: 4000,
    });
  },

  info({ title = 'Info', message }: NotifyOptions) {
    notifications.show({
      title,
      message,
      color: 'blue',
      icon: <IconInfoCircle size={20} />,
      autoClose: 3000,
    });
  },

  warning({ title = 'Warning', message }: NotifyOptions) {
    notifications.show({
      title,
      message,
      color: 'yellow',
      icon: <IconAlertTriangle size={20} />,
      autoClose: 3500,
    });
  },
};
