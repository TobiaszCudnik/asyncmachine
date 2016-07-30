module.exports = function (wallaby) {
  return {
    files: [
      'src/*.ts',
      'build/*.js'
    ],

    tests: [
      'test/asyncmachine.coffee',
      'test/classes.js'
    ],
    env: {
      type: 'node',
      runner: 'node'  // or full path to any node executable
    },
    testFramework: 'mocha'
  };
};