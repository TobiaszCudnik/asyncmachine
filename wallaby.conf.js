module.exports = function (wallaby) {
  return {
    files: [
      'build/asyncmachine.js',
      'build/ee.js',
      'build/uuid-v4.js'
    ],

    tests: [
      'test/asyncmachine.coffee',
      'test/classes.js'
    ],
    env: {
      type: 'node',
      runner: 'node'  // or full path to any node executable
    },
    testFramework: 'mocha',

    // compilers: {

    //   'src/*.ts': wallaby.compilers.typeScript({
    //     module: 'cjs',
    //     target: 'es5'
    //   })
    // }
  };
};