import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import path from "path";

const config: StorybookConfig = {
  // ============================================================================
  // Stories Configuration
  // ============================================================================
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],

  // ============================================================================
  // Addons Configuration
  // ============================================================================
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],

  // ============================================================================
  // Framework Configuration
  // ============================================================================
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },

  // ============================================================================
  // Docs Configuration
  // ============================================================================
  docs: {
    autodocs: "tag",
  },

  // ============================================================================
  // Vite Configuration Override
  // ============================================================================
  async viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "../src"),
          "@/app": path.resolve(__dirname, "../src/app"),
          "@/core": path.resolve(__dirname, "../src/core"),
          "@/shared": path.resolve(__dirname, "../src/shared"),
          "@/features": path.resolve(__dirname, "../src/features"),
          "@/pages": path.resolve(__dirname, "../src/pages"),
          "@/assets": path.resolve(__dirname, "../src/assets"),
          "@/styles": path.resolve(__dirname, "../src/styles"),
        },
      },
      define: {
        "import.meta.env.VITE_API_BASE_URL": JSON.stringify("http://localhost:4000"),
        "import.meta.env.VITE_STRIPE_PUBLIC_KEY": JSON.stringify("pk_test_storybook"),
      },
    });
  },

  // ============================================================================
  // TypeScript Configuration
  // ============================================================================
  typescript: {
    check: false, // Disable type checking during build for faster dev
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },

  // ============================================================================
  // Static Files
  // ============================================================================
  staticDirs: ["../public"],

  // ============================================================================
  // Core Configuration
  // ============================================================================
  core: {
    disableTelemetry: true,
  },
};

export default config;
