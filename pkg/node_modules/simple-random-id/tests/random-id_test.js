'use strict';

var assert = require('assert'),
    generate = require('../index.js');

// Called without argument
assert.equal(generate().length, 10);

// Called with number less than 10
assert.equal(generate(4).length, 4);

// Called with number greater than 10
assert.equal(generate(34).length, 34);

// Called with string instead of number
// Argument should be ignored
assert.equal(generate('JCZC.7UP').length, 10);

// Called with object instead of number
// Argument should be ignored
assert.equal(generate({
  'MlodybeTomal': 'Najlepszy rap z Jelonek'
}).length, 10);

// Called with array instead of number
// Argument should be ignored
assert.equal(generate([3,2,1,6,7]).length, 10);

// Called with '0' should throw an error
assert.throws(function(){
  generate(0);
});
