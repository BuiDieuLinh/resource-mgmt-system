import { Center, Loader, Stack, Text } from '@mantine/core';
import classes from './Loading.module.css';

type LoadingProps = {
  fullscreen?: boolean;
  text?: string;
};

export function Loading({
  fullscreen = false,
  text = 'Loading...',
}: LoadingProps) {
  if (fullscreen) {
    return (
      <Center className={classes.fullscreen}>
        <Stack align="center" gap="sm">
          <Loader size="lg" />
          <Text c="dimmed">{text}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Center className={classes.inline}>
      <Stack align="center" gap="xs">
        <Loader size="sm" />
        <Text size="sm" c="dimmed">
          {text}
        </Text>
      </Stack>
    </Center>
  );
}
