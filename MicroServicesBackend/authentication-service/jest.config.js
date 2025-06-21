module.exports = {
  testEnvironment: 'node',
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'MicroServicesBackend/authentication-service',
      outputName: 'jest-junit.xml'
    }]
  ]
};
