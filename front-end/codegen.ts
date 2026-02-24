import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "schema.graphql", // Static GraphQL schema file (English only)
  documents: [
    "src/core/api/graphql/**/*.{ts,tsx,graphql,gql}",
    "src/features/**/api/graphql/**/*.{ts,tsx,graphql,gql}",
    "!src/hooks/**/*",
  ], // Where to find GraphQL operations (exclude hooks to avoid conflicts)
  generates: {
    // Generate TypeScript types from schema
    "src/core/api/apollo/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-react-apollo"],
      config: {
        withHooks: true,
        withComponent: false,
        withHOC: false,
        skipTypename: false,
        enumsAsTypes: true,
        excludeDeprecatedFromRoot: true,
        // Use type imports and named imports for Vitest SSR compatibility
        useTypeImports: true,
        importOperationTypesFrom: "Operations",
        scalars: {
          DateTime: "string",
          Decimal: "string",
          JSON: "Record<string, unknown>",
        },
        hooksSuffix: "",
        excludePatterns: ["useSuspense*"],
        avoidOptionals: {
          field: false,
          inputValue: false,
          object: false,
          defaultValue: false,
        },
        maybeValue: "T | null",
        inputMaybeValue: "T | null | undefined",
        noExport: false,
        dedupeOperationSuffix: true,
        omitOperationSuffix: false,
        exportFragmentSpreadSubTypes: true,
        preResolveTypes: true,
        namingConvention: {
          typeNames: "change-case-all#pascalCase",
          enumValues: "change-case-all#upperCase",
          transformUnderscore: true,
        },
      },
    },
    // Generate introspection schema for tooling
    "src/core/api/apollo/generated/introspection.json": {
      plugins: ["introspection"],
      config: {
        minify: true,
      },
    },
  },
};

export default config;
