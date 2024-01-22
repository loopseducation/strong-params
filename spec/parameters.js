/* global beforeEach, describe, it */
const should = require('should');
const sinon = require('sinon');
const sinonTest = require('sinon-test');
const test = sinonTest(sinon);

const Parameters = require('..').Parameters;
const ParameterMissingError = require('..').ParameterMissingError;
const PRIMITIVE_TYPES = [
  Boolean,
  Number,
  String,
  function Null() {
    this.valueOf = function () {
      return null;
    };
  },
];

describe('Parameters', function () {
  describe('class methods', function () {
    describe('_initValue', function () {
      PRIMITIVE_TYPES.forEach(function (Primitive) {
        it('should return primitive for ' + Primitive.name, function () {
          // Prepare
          const input = new Primitive().valueOf();
          // Test
          const result = Parameters._initValue(input);
          // Verify
          should(result).be.a[Primitive.name]();
        });
      });
      it('should return instance of Parameters', function () {
        // Prepare
        const input = {};
        // Test
        const result = Parameters._initValue(input);
        // Verify
        result.should.be.a.instanceOf(Parameters);
      });
    });

    describe('_isPrimitive', function () {
      PRIMITIVE_TYPES.forEach(function (Primitive) {
        it('should return true for primitive ' + Primitive.name + ' input', function () {
          // Prepare
          const input = new Primitive().valueOf();
          // Test
          const result = Parameters._isPrimitive(input);
          // Verify
          result.should.be.true();
        });
      });
      it('should return false for not primitive Object input', function () {
        // Prepare
        const input = {};
        // Test
        const result = Parameters._isPrimitive(input);
        // Verify
        result.should.be.false();
      });
    });

    describe('clone', function () {
      it(
        'should call instance `clone` for Parameters input',
        test(function () {
          // Prepare
          const params = new Parameters();
          this.spy(params, 'clone');
          // Test
          const cloned = Parameters.clone(params);
          // Verify
          params.clone.calledOnce.should.be.true();
          cloned.should.be.instanceOf(Parameters);
          cloned.should.not.equal(params);
        }),
      );
      it('should return input if it is not instance of Parameters', function () {
        // Prepare
        const primitive = Number();
        // Test
        const cloned = Parameters.clone(primitive);
        // Verify
        cloned.should.equal(primitive);
      });
    });

    describe('_cloneArray', function () {
      it(
        'should return correctly',
        test(function () {
          // Prepare
          const cb = this.stub(Parameters, 'clone').callsFake(function (input) {
            return input;
          });
          const input = [1, 3, 2];
          // Test
          const result = Parameters._cloneArray(input);
          // Verify
          result.should.eql(input);
          cb.callCount.should.equal(3);
        }),
      );
    });

    describe('_cloneObject', function () {
      it(
        'should return correctly',
        test(function () {
          // Prepare
          const cb = this.stub(Parameters, 'clone').callsFake(function (input) {
            return input;
          });
          const input = {
            first: 1,
            second: 3,
            third: 2,
          };
          // Test
          const result = Parameters._cloneObject(input);
          // Verify
          result.should.eql(input);
          cb.callCount.should.equal(3);
        }),
      );
    });
  });

  describe('instance methods', function () {
    describe('require', function () {
      let params;
      beforeEach(function () {
        params = new Parameters({ requiredKey: {} });
      });
      describe('when required key passed', function () {
        it('should return instance of parameters', function () {
          params.require('requiredKey').should.be.a.instanceOf(Parameters);
        });
      });
      describe('when required key not passed', function () {
        it('should throw instance of ParameterMissingError with error message', function () {
          const requireFunction = function () {
            params.require('missingKey');
          };
          should.throws(requireFunction, ParameterMissingError, 'param `missingKey` required');
        });
      });
    });
  });

  describe('operations', function () {
    describe('constructing', function () {});
    describe('cloning', function () {});
    describe('whitelisting', function () {
      let params;

      beforeEach(function () {
        params = new Parameters({
          primBoolean: true,
          primNumber: 1,
          primString: 'string',
          array: [1, 3, 2],
          objectArray: [
            {
              primBoolean: true,
              primNumber: 1,
              primString: 'string',
              otherPrimary: 'other',
              array: [1, 3, 2],
            },
            {
              primBoolean: false,
              primNumber: 2,
              primString: '',
              otherPrimary: 'other',
              array: [4, 6, 5],
            },
          ],
          objectNotatedArray: {
            0: {
              primBoolean: true,
              primNumber: 1,
              primString: 'string',
              otherPrimary: 'other',
            },
            20: {
              primBoolean: false,
              primNumber: 2,
              primString: '',
              otherPrimary: 'other',
            },
          },
          object: {
            primBoolean: true,
            primNumber: 1,
            primString: 'string',
            array: [1, 3, 2],
            nestedObject: {
              primBoolean: true,
              primNumber: 1,
              primString: 'string',
              array: [1, 3, 2],
            },
          },
          anotherObject: {
            primBoolean: true,
            primNumber: 1,
            primString: 'string',
            array: [1, 3, 2],
          },
        });
      });

      it('should whitelist primitives correctly', function () {
        // Prepare
        const filters = ['primBoolean', 'primNumber', 'primString'];
        // Test
        const result = params.permit(filters).value();
        // Verify
        result.should.eql({
          primBoolean: true,
          primNumber: 1,
          primString: 'string',
        });
      });

      it('should whitelist primitives array correctly', function () {
        // Prepare
        const filters = [{ array: [] }];
        // Test
        const result = params.permit(filters).value();
        // Verify
        result.should.eql({
          array: [1, 3, 2],
        });
      });

      it('should whitelist nested object correctly', function () {
        // Prepare
        const filters = [{ object: [{ array: [], nestedObject: ['primBoolean', 'primNumber', 'primString'] }] }];
        // Test
        const result = params.permit(filters).value();
        // Verify
        result.should.eql({
          object: {
            array: [1, 3, 2],
            nestedObject: {
              primBoolean: true,
              primNumber: 1,
              primString: 'string',
            },
          },
        });
      });

      it('should whitelist object array correctly', function () {
        // Prepare
        const filters = [{ objectArray: ['primBoolean', 'primNumber', 'primString', { array: [] }] }];
        // Test
        const result = params.permit(filters).value();
        // Verify
        result.should.deepEqual({
          objectArray: [
            {
              primBoolean: true,
              primNumber: 1,
              primString: 'string',
              array: [1, 3, 2],
            },
            {
              primBoolean: false,
              primNumber: 2,
              primString: '',
              array: [4, 6, 5],
            },
          ],
        });
      });

      it('should whitelist of same fingerprint object and array correctly', function () {
        // Prepare
        const filters = [
          {
            objectArray: ['primBoolean', 'primNumber', 'primString', { array: [] }],
            anotherObject: ['primBoolean', 'primNumber', 'primString', { array: [] }],
          },
        ];
        // Test
        const result = params.permit(filters).value();
        // Verify
        result.should.deepEqual({
          objectArray: [
            {
              primBoolean: true,
              primNumber: 1,
              primString: 'string',
              array: [1, 3, 2],
            },
            {
              primBoolean: false,
              primNumber: 2,
              primString: '',
              array: [4, 6, 5],
            },
          ],
          anotherObject: {
            primBoolean: true,
            primNumber: 1,
            primString: 'string',
            array: [1, 3, 2],
          },
        });
      });

      it('should whitelist object notated array correctly', function () {
        // Prepare
        const filters = [{ objectNotatedArray: ['primBoolean', 'primNumber', 'primString'] }];
        // Test
        const result = params.permit(filters).value();
        // Verify
        result.should.deepEqual({
          objectNotatedArray: {
            0: {
              primBoolean: true,
              primNumber: 1,
              primString: 'string',
            },
            20: {
              primBoolean: false,
              primNumber: 2,
              primString: '',
            },
          },
        });
      });

      it('should handle scalar input for object filter', function () {
        // Prepare
        const filters = [{ primString: [] }];
        // Test
        const result = params.permit(filters).value();
        // Verify
        result.should.deepEqual({});
      });
    });
  });
});
