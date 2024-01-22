/* global describe, it */
const ParameterMissingError = require('..').ParameterMissingError;

describe('ParameterMissingError', function () {
  it('should be instance of Error', function () {
    const subject = new ParameterMissingError();
    subject.should.be.a.instanceOf(Error);
  });

  it('should assing a message passed in constructor', function () {
    const message = 'lorem ipsum';
    const subject = new ParameterMissingError(message);
    subject.message.should.eql(message);
  });
});
