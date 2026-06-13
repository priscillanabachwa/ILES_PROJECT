module.exports = {
  testEnvironment: 'jsdom', // Simulates a browser environment in Node.js
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Runs configuration files before tests
  moduleNameMapper: {
    // Handles CSS/Stylesheets imports during test runs
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handles static asset imports like images or svgs
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
  },
};