import { createTheme, type MantineColorsTuple } from '@mantine/core';

const deepPurple: MantineColorsTuple = [
  '#e8d5f0', // lightest
  '#d1abdf',
  '#ba81ce',
  '#a357bd',
  '#8c2dac',
  '#2a0c50', // PRIMARY
  '#42127d',
  '#3a106e',
  '#320e5f',
  '#1a0830',
];

export const theme = createTheme({
  primaryColor: 'deepPurple',
  colors: {
    deepPurple,
  },

  defaultRadius: 'md',

  // Font settings
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: 'Monaco, Courier, monospace',
  headings: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontWeight: '600',
  },

  // Component-specific overrides
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        shadow: 'sm',
      },
    },
  },
});
