import { Title, Text, Stack } from "@mantine/core";

export default function Home() {

  return (
    <Stack gap="xs">
        <Title order={2}>
        Hi Admin 👋🏼
        </Title>

        <Text c="dimmed" size="md">
        Welcome back, nice to see you again!
        </Text>
    </Stack>
  );
}
