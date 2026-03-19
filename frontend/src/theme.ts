import { createTheme, type MantineColorsTuple } from '@mantine/core';

const deepPurple: MantineColorsTuple = [
  '#f3eaff', // lightest
  '#e0c8ff',
  '#c49ef5',
  '#a872ec',
  '#9155e3',
  '#7c3aed',
  '#6d28d9',
  '#5b21b6',
  '#4c1d95',
  '#2e1065', // darkest
];

export const PRIMARY_COLOR = deepPurple[9];

export const theme = createTheme({
  primaryColor: 'deepPurple',
  primaryShade: 9,
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
