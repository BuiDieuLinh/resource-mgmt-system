import {
  Alert,
  Box,
  Divider,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  IconAlertCircle,
  IconBrandGoogle,
  IconBrandWindows,
  IconHierarchy,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardIllustration } from '../components/DashboardIllustration';
import { useAuth } from '../context/AuthContext';
import { changePasswordUrl } from '@/routes/url';
import classes from './AuthLayout.module.css';

const PARTICLES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: Math.round(10 + ((i * 37 + i * i * 3) % 80)),
  y: Math.round(5 + ((i * 53 + i * 7) % 90)),
  size: i % 3 === 0 ? 2.5 : i % 3 === 1 ? 1.5 : 2,
  delay: (i * 0.18) % 3,
  duration: 2.5 + (i % 5) * 0.6,
}));

export default function Login() {
  const { user, login, isFirstLogin } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) =>
        /^\S+@\S+$/.test(value)
          ? null
          : t('auth.validation.invalidEmail', { defaultValue: 'Email không hợp lệ' }),
      password: (value) =>
        value.length >= 6
          ? null
          : t('auth.validation.passwordMin', {
              defaultValue: 'Mật khẩu tối thiểu 6 ký tự',
            }),
    },
  });

  if (user) {
    if (isFirstLogin) return <Navigate to={changePasswordUrl} replace />;
    const from = (location.state as { from?: string } | null)?.from;
    // Không redirect về change-password sau khi đã đổi mật khẩu xong
    const next = from && from !== changePasswordUrl ? from : '/';
    return <Navigate to={next} replace />;
  }

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    setError('');
    try {
      await login(values.email, values.password);
    } catch (err: any) {
      const message = err?.response?.data?.message;
      const normalized = Array.isArray(message) ? message[0] : message;
      if (normalized === 'Invalid credentials') {
        setError(
          t('auth.error.invalidCredentials', {
            defaultValue: 'Email hoặc mật khẩu không đúng',
          }),
        );
      } else if (
        normalized === 'Your account has been deactivated. Please contact your administrator.'
      ) {
        setError(
          t('auth.error.accountDeactivated', {
            defaultValue: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
          }),
        );
      } else {
        setError(
          normalized ??
            t('auth.error.invalidCredentials', {
              defaultValue: 'Email hoặc mật khẩu không đúng',
            }),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className={classes.root}>
      <Box className={classes.brandPanel}>
        <div className={classes.rightPattern} />
        <div className={classes.rightGlow} />

        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {PARTICLES.map((p) => (
            <circle
              key={p.id}
              cx={`${p.x}%`}
              cy={`${p.y}%`}
              r={p.size}
              fill="rgba(255,255,255,0.25)"
            />
          ))}
        </svg>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Group justify="space-between">
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
              <Text fw={700} size="sm" c="white" style={{ letterSpacing: '-0.01em' }}>
                RMS Platform
              </Text>
            </Group>
          </Group>
        </div>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <DashboardIllustration />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Stack gap={12}>
            <Text c="rgba(255,255,255,0.65)" size="sm" lh={1.6} style={{ fontStyle: 'italic' }}>
              {t('auth.brand.quote', {
                defaultValue:
                  '“Một nền tảng duy nhất để quản lý toàn bộ nhân sự — kết nối, tự động hóa và phát triển đội ngũ.”',
              })}
            </Text>
            <Group gap={8}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6d28d9,#2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                BL
              </div>
              <div>
                <Text size="xs" c="rgba(255,255,255,0.6)" fw={600}>
                  {t('auth.brand.authorName', { defaultValue: 'Bui Dieu Linh' })}
                </Text>
                <Text size="xs" c="rgba(255,255,255,0.3)">
                  {t('auth.brand.authorTitle', { defaultValue: 'HR Director' })}
                </Text>
              </div>
            </Group>
          </Stack>
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginTop: 20 }}>
          <Group gap={6}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <Text size="xs" c="rgba(255,255,255,0.3)">
              {t('auth.brand.systemStatus', { defaultValue: 'All systems operational' })}
            </Text>
          </Group>
        </div>
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
          <Text fw={700} size="sm" c="#2a0c50" style={{ letterSpacing: '-0.01em' }}>
            RMS Platform
          </Text>
        </Group>

        <div className={classes.formArea}>
          <Stack gap={0}>
            <Stack gap={4} mb={36}>
              <Title order={3} fw={700} c="#111827" style={{ letterSpacing: '-0.02em' }}>
                {t('auth.signIn.title', { defaultValue: 'Đăng nhập' })}
              </Title>
              <Text size="sm" c="#6b7280">
                {t('auth.signIn.subtitle', {
                  defaultValue: 'Nhập thông tin tài khoản để tiếp tục',
                })}
              </Text>
            </Stack>

            <form onSubmit={form.onSubmit(handleSubmit)}>
              <Stack gap="md">
                {error && (
                  <Alert
                    color="red"
                    variant="light"
                    radius="md"
                    icon={<IconAlertCircle size={16} />}
                    styles={{
                      root: {
                        border: '1px solid #fca5a5',
                        background: '#fff5f5',
                      },
                      message: { fontWeight: 500, fontSize: 13, color: '#b91c1c' },
                      icon: { alignSelf: 'center' },
                    }}
                  >
                    {error}
                  </Alert>
                )}
                <TextInput
                  label={t('auth.email.label', { defaultValue: 'Email' })}
                  placeholder={t('auth.email.placeholder', { defaultValue: 'you@company.com' })}
                  size="sm"
                  classNames={{ label: classes.inputLabel }}
                  {...form.getInputProps('email')}
                />
                <Stack gap={6}>
                  <PasswordInput
                    label={t('auth.password.label', { defaultValue: 'Mật khẩu' })}
                    placeholder={t('auth.password.placeholder', {
                      defaultValue: 'Nhập mật khẩu',
                    })}
                    size="sm"
                    classNames={{ label: classes.inputLabel }}
                    {...form.getInputProps('password')}
                  />
                  <Group justify="flex-end">
                    <span className={classes.forgotLink}>
                      {t('auth.forgotPassword', { defaultValue: 'Quên mật khẩu?' })}
                    </span>
                  </Group>
                </Stack>
                <Box mt={4}>
                  <button type="submit" className={classes.submitBtn} disabled={loading}>
                    {loading
                      ? t('auth.signingIn', { defaultValue: 'Đang đăng nhập...' })
                      : t('auth.signIn.button', { defaultValue: 'Đăng nhập' })}
                  </button>
                </Box>
                <Divider
                  label={
                    <span className={classes.dividerLabel}>
                      {t('auth.continueWith', { defaultValue: 'Hoặc tiếp tục với' })}
                    </span>
                  }
                  labelPosition="center"
                  color="#f3f4f6"
                />
                <Group gap="sm">
                  <button type="button" className={classes.ssoBtn}>
                    <IconBrandGoogle size={15} color="#ea4335" />
                    Google
                  </button>
                  <button type="button" className={classes.ssoBtn}>
                    <IconBrandWindows size={15} color="#00a4ef" />
                    Microsoft
                  </button>
                </Group>
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
