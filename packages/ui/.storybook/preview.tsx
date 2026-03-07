import * as React from "react";
import "../src/tailwind.css";
import type { Preview } from "@storybook/react-vite";
import { withThemeByDataAttribute } from "@storybook/addon-themes";
import { NextIntlClientProvider } from "next-intl";

const preview: Preview = {
  parameters: {
    backgrounds: {
      options: {
        light: { name: "light", value: "#ffffff" },
        dark: { name: "dark", value: "#16151a" },
      },
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },

  initialGlobals: {
    backgrounds: {
      value: "dark",
    },
  },
};

const MESSAGES_REQUIRED_IN_COMPONENTS = {
  Common: {
    optionalField: "Optional",
    select: "Select...",
    startTyping: "Start typing...",
    noOptions: "No options",
    searching: "Searching...",
  },
  Statuses: {
    ACCEPTED: "Accepted",
    PASSED: "Passed",
    PAID: "Paid",
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    DECLINED: "Declined",
    DENIED: "Denied",
    UNPAID: "Unpaid",
    FAILED: "Failed",
    CANCELED: "Canceled",
  },
};

export const decorators = [
  withThemeByDataAttribute({
    themes: {
      light: "light",
      dark: "dark",
    },
    parentSelector: "body",
    defaultTheme: "dark",
    attributeName: "data-theme",
  }),
  (Story) => (
    <NextIntlClientProvider messages={MESSAGES_REQUIRED_IN_COMPONENTS} locale="en">
      <Story />
    </NextIntlClientProvider>
  ),
];

export default preview;
