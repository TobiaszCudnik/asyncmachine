SimpleRandomId by [@michalbe](http://github.com/michalbe)
=========

Simple random alphanumeric string generator.

How to use:
```
npm install simple-random-id
```

then:
```javascript
var sri = require('simple-random-id');

// Only parameter it takes is length of the random string
// Default length is 10
sri();   // 'UIWSNLJ9L8'
sri(3);  // 'PX0'
sri(24); // 'SXB0KT4SJ1SGU8FRAK6LFVJB'
```
