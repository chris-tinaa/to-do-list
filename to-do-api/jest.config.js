module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/tests/**/*.test.ts"],
  setupFilesAfterEnv: ["jest-extended/all"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/app.ts",
    "!src/migrations/**",
  ],
}; 