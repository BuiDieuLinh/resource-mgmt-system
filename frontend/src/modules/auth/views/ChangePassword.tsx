import { Alert, Box, Group, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconHierarchy } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authApi } from '../api/auth.api';
import { useAuth } from '../context/AuthContext';
import classes from './AuthLayout.module.css';

export default function ChangePassword() {
  const { clearFirstLogin, logout } = useAuth();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { newPassword: '', confirmPassword: '' },
    validate: {
      newPassword: (value) =>
        value.length >= 6
          ? null
          : t('auth.validation.passwordMin', {
              defaultValue: 'Mật khẩu tối thiểu 6 ký tự',
            }),
      confirmPassword: (value, values) =>
        value === values.newPassword
          ? null
          : t('auth.validation.passwordMismatch', {
              defaultValue: 'Mật khẩu xác nhận không khớp',
            }),
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError('');
    try {
      await authApi.changePassword(values.newPassword);
      clearFirstLogin();
      logout();
    } catch (err: any) {
      const message = err?.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message[0]
          : (message ??
              t('auth.change.error', {
                defaultValue: 'Không thể đổi mật khẩu. Vui lòng thử lại.',
              })),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={classes.root}>
      <Box className={classes.brandPanel}>
        <div className={classes.rightPattern} />
        <div className={classes.rightGlow} />
        <Group justify="space-between" style={{ position: 'relative', zIndex: 1 }}>
          <Group gap={10}>
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconHierarchy size={16} color="white" />
            </Box>
            <Text fw={700} size="sm" c="white">
              RMS Platform
            </Text>
          </Group>
        </Group>

        <Stack
          gap={8}
          style={{ position: 'relative', zIndex: 1, flex: 1, justifyContent: 'center' }}
        >
          <Text size="xl" fw={700} c="white" style={{ letterSpacing: '-0.02em' }}>
            {t('auth.change.secureTitle', { defaultValue: 'Bảo mật tài khoản' })}
          </Text>
          <Text size="sm" c="rgba(255,255,255,0.6)" lh={1.6}>
            {t('auth.change.secureSubtitle', {
              defaultValue: 'Đây là lần đăng nhập đầu tiên. Vui lòng đặt mật khẩu mới để tiếp tục.',
            })}
          </Text>
        </Stack>
      </Box>

      <Box className={classes.formPanel}>
        <Group gap={10}>
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#2a0c50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconHierarchy size={16} color="white" />
          </Box>
          <Text fw={700} size="sm" c="#2a0c50">
            RMS Platform
          </Text>
        </Group>

        <div className={classes.formArea}>
          <Stack gap={0}>
            <Stack gap={4} mb={36}>
              <Title order={3} fw={700} c="#111827" style={{ letterSpacing: '-0.02em' }}>
                {t('auth.change.title', { defaultValue: 'Đổi mật khẩu' })}
              </Title>
              <Text size="sm" c="#6b7280">
                {t('auth.change.subtitle', {
                  defaultValue: 'Đặt mật khẩu mới cho tài khoản của bạn',
                })}
              </Text>
            </Stack>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {error && (
                  <Alert color="red" variant="light" radius="md">
                    {error}
                  </Alert>
                )}
                <PasswordInput
                  label={t('auth.change.newPassword', { defaultValue: 'Mật khẩu mới' })}
                  placeholder={t('auth.change.newPasswordPlaceholder', {
                    defaultValue: 'Ít nhất 6 ký tự',
                  })}
                  size="sm"
                  classNames={{ label: classes.inputLabel }}
                  {...form.getInputProps('newPassword')}
                />
                <PasswordInput
                  label={t('auth.change.confirmPassword', {
                    defaultValue: 'Xác nhận mật khẩu',
                  })}
                  placeholder={t('auth.change.confirmPasswordPlaceholder', {
                    defaultValue: 'Nhập lại mật khẩu mới',
                  })}
                  size="sm"
                  classNames={{ label: classes.inputLabel }}
                  {...form.getInputProps('confirmPassword')}
                />
                <Box mt={4}>
                  <button type="submit" className={classes.submitBtn} disabled={loading}>
                    {loading
                      ? t('auth.change.saving', { defaultValue: 'Đang lưu...' })
                      : t('auth.change.submit', { defaultValue: 'Đặt mật khẩu mới' })}
                  </button>
                </Box>
              </Stack>
            </form>
          </Stack>
        </div>

        <Text size="xs" c="#d1d5db">
          {t('auth.common.copyright', {
            defaultValue: '© 2026 RMS Platform. All rights reserved.',
          })}
        </Text>
      </Box>
    </Box>
  );
}
