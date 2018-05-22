'use strict';

var generate = function(length) {
  if (length !== 0) {
    length = Math.abs(length) || 10;
  }

  var output = generateTen();
  if (length === 0) {
    throw new Error('Lenght need to be an integer different than 0.');
  } else if (length > 10) {
    var tens = ~~(length/10);
    while (tens--) {
      output += generateTen();
    }
  }

  return output.substr(0, length);
};

var generateTen = function() {
  // This could be 10 or 11 (depends on the value returned by Math.random())
  // but since we truncate it in the main function we don't need to do it
  // in here
  return Math.random().toString(36).slice(2).toUpperCase();
};

module.exports = generate;
