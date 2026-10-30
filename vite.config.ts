import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    plugins: ["oxc", "typescript", "unicorn"],
    categories: {
      correctness: "warn",
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
    env: {
      builtin: true,
    },
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    overrides: [
      {
        files: ["src/**/*.ts"],
        rules: {
          eqeqeq: ["error", "always"],
          "import/no-duplicates": "error",
          "import/no-cycle": [
            "error",
            {
              maxDepth: 5,
            },
          ],
          "import/no-self-import": "error",
          "no-unused-expressions": [
            "error",
            {
              allowShortCircuit: true,
              allowTernary: true,
            },
          ],
          "no-unreachable": "error",
          "no-empty": [
            "error",
            {
              allowEmptyCatch: false,
            },
          ],
          "no-console": [
            "error",
            {
              allow: ["warn", "error", "info"],
            },
          ],
          "no-eval": "error",
          "no-implied-eval": "error",
          "security/detect-object-injection": "warn",
          "security/detect-non-literal-regexp": "warn",
          "security/detect-non-literal-fs-filename": "warn",
          "security/detect-possible-timing-attacks": "error",
          "security/detect-unsafe-regex": "error",
          "no-secrets/no-secrets": [
            "error",
            {
              tolerance: 4,
              additionalRegexes: {
                "Potential JWT": "ey[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+\\.[A-Za-z0-9-_]+",
              },
            },
          ],
          "prefer-const": "error",
          "no-var": "error",
          "no-magic-numbers": [
            "warn",
            {
              ignore: [-1, 0, 1, 2, 10, 100, 1000],
              ignoreArrayIndexes: true,
              ignoreDefaultValues: true,
              enforceConst: true,
            },
          ],
          "prefer-template": "error",
          "no-throw-literal": "off",
          "typescript/only-throw-error": "error",
          "no-unused-vars": [
            "error",
            {
              argsIgnorePattern: "^_",
              varsIgnorePattern: "^_",
              caughtErrorsIgnorePattern: "^_",
            },
          ],
          "no-empty-function": [
            "error",
            {
              allow: ["arrowFunctions"],
            },
          ],
          "typescript/no-explicit-any": "error",
          "typescript/consistent-type-imports": [
            "error",
            {
              prefer: "type-imports",
              fixStyle: "inline-type-imports",
            },
          ],
          "typescript/no-non-null-assertion": "error",
          "typescript/no-unnecessary-type-assertion": "error",
          "typescript/prefer-nullish-coalescing": "error",
          "typescript/prefer-optional-chain": "error",
          "typescript/no-floating-promises": "error",
          "typescript/no-misused-promises": [
            "error",
            {
              checksVoidReturn: {
                attributes: false,
              },
            },
          ],
          "typescript/require-await": "error",
          "typescript/prefer-promise-reject-errors": "error",
          "typescript/no-useless-empty-export": "error",
          "typescript/consistent-return": "off",
          "typescript/no-unsafe-member-access": "error",
          "typescript/no-unsafe-assignment": "error",
          "typescript/no-unsafe-call": "error",
          "typescript/no-unsafe-return": "error",
          "typescript/no-implied-eval": "error",
          "typescript/return-await": ["error", "in-try-catch"],
          "typescript/use-unknown-in-catch-callback-variable": "error",
        },
        jsPlugins: ["eslint-plugin-security", "eslint-plugin-no-secrets"],
        plugins: ["import"],
      },
    ],
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
  fmt: {
    semi: true,
    singleQuote: false,
    tabWidth: 2,
    trailingComma: "es5",
    printWidth: 100,
    endOfLine: "lf",
    arrowParens: "always",
    bracketSpacing: true,
    sortPackageJson: false,
    // Replaces the former ESLint import/order rule: builtin, external, internal (@/), parent,
    // sibling, index, then type-only imports, each group separated by a blank line.
    sortImports: {
      groups: [
        "value-builtin",
        "value-external",
        "value-internal",
        "value-parent",
        "value-sibling",
        "value-index",
        "type-import",
        "unknown",
      ],
    },
    // Vendored agent skills and generated AI-tool files are managed by their own tools.
    ignorePatterns: [".agents/**", ".claude/**", ".cursor/**"],
  },
});
