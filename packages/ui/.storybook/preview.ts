import "../src/tailwind.css";
import type { Preview } from "@storybook/react";
import { withThemeByDataAttribute } from "@storybook/addon-styling";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export const decorators = [
  withThemeByDataAttribute({
    themes: {
      light: "light",
      dark: "dark",
    },
    defaultTheme: "dark",
    attributeName: "data-theme",
  }),
];

export default preview;
