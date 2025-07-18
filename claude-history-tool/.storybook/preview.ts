import type { Preview } from '@storybook/react';
import '../src/style.scss';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'var(--color-bg-secondary, #FAFBFC)',
        },
        {
          name: 'white',
          value: 'var(--color-bg-primary, #FFFFFF)',
        },
        {
          name: 'dark',
          value: 'var(--color-neutral-800, #1F2937)',
        },
      ],
    },
  },
};

export default preview;