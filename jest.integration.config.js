/** @type {import('ts-jest').JestConfigWithTsJest} */
// Suíte de integração: exige PostgreSQL real (docker compose -f docker-compose.dev.yml up -d postgres)
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: ['**/tests/integration/**/*.test.ts'],
    setupFiles: ['<rootDir>/tests/integration/setup-env.js'],
    testTimeout: 30000,
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.jest.json',
            diagnostics: false
        }],
    },
};
