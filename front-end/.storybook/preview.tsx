import type { Preview } from "@storybook/react";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing";
import i18n from "../src/core/i18n/i18n";

// Import PatternFly CSS
import "@patternfly/react-core/dist/styles/base.css";
import "@patternfly/react-styles/css/components/Backdrop/backdrop.css";
import "@patternfly/react-styles/css/components/Page/page.css";

// ============================================================================
// Global Decorators
// ============================================================================

/**
 * I18n Decorator
 * Wraps stories with i18n provider for translations
 */
const withI18n = (Story: any) => (
  <I18nextProvider i18n={i18n}>
    <Story />
  </I18nextProvider>
);

/**
 * Router Decorator
 * Wraps stories with React Router for navigation-dependent components
 */
const withRouter = (Story: any) => (
  <BrowserRouter>
    <Story />
  </BrowserRouter>
);

/**
 * Apollo Decorator
 * Wraps stories with MockedProvider for GraphQL-dependent components
 */
const withApollo = (Story: any, context: any) => {
  // Use custom mocks if provided in story parameters
  const mocks = context.parameters?.apolloMocks || [];

  return (
    <MockedProvider mocks={mocks} addTypename={false}>
      <Story />
    </MockedProvider>
  );
};

/**
 * PatternFly Container Decorator
 * Adds proper spacing and background for PatternFly components
 */
const withPatternFlyContainer = (Story: any) => (
  <div style={{ padding: "2rem", backgroundColor: "#f0f0f0", minHeight: "100vh" }}>
    <Story />
  </div>
);

// ============================================================================
// Preview Configuration
// ============================================================================

const preview: Preview = {
  // ==========================================================================
  // Global Parameters
  // ==========================================================================
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#f0f0f0",
        },
        {
          name: "white",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#151515",
        },
      ],
    },
    layout: "padded",
    docs: {
      toc: true,
    },
  },

  // ==========================================================================
  // Global Decorators (applied to all stories)
  // ==========================================================================
  decorators: [
    withI18n,
    withRouter,
    withApollo,
    withPatternFlyContainer,
  ],

  // ==========================================================================
  // Global Types (for toolbar customization)
  // ==========================================================================
  globalTypes: {
    locale: {
      name: "Locale",
      description: "Language locale",
      defaultValue: "fr",
      toolbar: {
        icon: "globe",
        items: [
          { value: "fr", title: "Français" },
          { value: "en", title: "English" },
          { value: "nl", title: "Nederlands" },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
