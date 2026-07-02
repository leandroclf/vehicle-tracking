// ESLint configuration for Clean Architecture
// This file enforces SOLID principles and layer separation

module.exports = {
  extends: [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    "@typescript-eslint",
    "import"
  ],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "@typescript-eslint/prefer-readonly": "warn",
    "import/no-cycle": "error",
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        pathGroups: [
          {
            pattern: "@/domain/**",
            group: "internal",
            position: "before"
          },
          {
            pattern: "@/application/**",
            group: "internal",
            position: "before"
          },
          {
            pattern: "@/infrastructure/**",
            group: "internal",
            position: "before"
          },
          {
            pattern: "@/presentation/**",
            group: "internal",
            position: "before"
          },
          {
            pattern: "@/shared/**",
            group: "internal",
            position: "before"
          }
        ],
        pathGroupsExcludedImportTypes: ["builtin"]
      }
    ]
  },
  overrides: [
    {
      files: ["src/domain/**/*.ts"],
      rules: {
        "import/no-restricted-paths": [
          "error",
          {
            zones: [
              {
                target: "src/domain",
                from: "src/application"
              },
              {
                target: "src/domain",
                from: "src/infrastructure"
              },
              {
                target: "src/domain",
                from: "src/presentation"
              }
            ]
          }
        ]
      }
    },
    {
      files: ["src/application/**/*.ts"],
      rules: {
        "import/no-restricted-paths": [
          "error",
          {
            zones: [
              {
                target: "src/application",
                from: "src/infrastructure"
              },
              {
                target: "src/application",
                from: "src/presentation"
              }
            ]
          }
        ]
      }
    },
    {
      files: ["src/presentation/**/*.ts", "src/presentation/**/*.tsx"],
      rules: {
        "import/no-restricted-paths": [
          "error",
          {
            zones: [
              {
                target: "src/presentation",
                from: "src/infrastructure"
              }
            ]
          }
        ]
      }
    },
    {
      files: ["**/*.entity.ts"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "prefer-const": "error"
      }
    },
    {
      files: ["**/*.repository.ts"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "error"
      }
    },
    {
      files: ["**/*.use-case.ts"],
      rules: {
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "prefer-const": "error"
      }
    },
    {
      files: ["**/*.js", "server.js", "websocket-standalone.js", "ws-test.js", "scripts/**/*.js", "tracker-server/**/*.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off"
      }
    }
  ]
};
