/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@leandroclf/product-platform-harness$': '<rootDir>/node_modules/@leandroclf/product-platform-harness/dist/index.js',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    // Transform the actual ESM dependency for this CommonJS test runner.
    transformIgnorePatterns: ['node_modules/(?!\\.pnpm/|@leandroclf/product-platform-harness/)'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.[tj]sx?$': ['ts-jest', {
            tsconfig: 'tsconfig.jest.json',
            diagnostics: false
        }],
    },
};
