// file: test/main.test.js
var main = require('../main');
var should = require('should');


//describe 中的字符串，用来描述你要测的主体是什么；
//it 当中，描述具体的 case 内容。

// * 当 n === 0 时，返回 0；n === 1时，返回 1;
// * n > 1 时，返回 `fibonacci(n) === fibonacci(n-1) + fibonacci(n-2)`，如 `fibonacci(10) === 55`;
// * n 不可大于10，否则抛错，因为 Node.js 的计算性能没那么强。
// * n 也不可小于 0，否则抛错，因为没意义。
// * n 不为数字时，抛错。
describe('test/main.test.js', function () {
  it('should equal 0 when n === 0', function () {
    main.fibonacci(0).should.equal(0);
  });

  it('should equal 1 when n === 1', function () {
    main.fibonacci(1).should.equal(1);
  });

  it('should equal 55 when n === 10', function () {
    main.fibonacci(10).should.equal(55);
  });

  it('should throw when n > 10', function () {
    (function () {
      main.fibonacci(11);
    }).should.throw('n should <= 10');
  });

  it('should throw when n < 0', function () {
    (function () {
      main.fibonacci(-1);
    }).should.throw('n should >= 0');
  });

  it('should throw when n isnt Number', function () {
    (function () {
      main.fibonacci('呵呵');
    }).should.throw('n should be a Number');
  });
});