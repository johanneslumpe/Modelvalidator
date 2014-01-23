var ModelValidator = require('../index').ModelValidator;
var expect = require('expect.js');

describe('ModelValidator', function () {
  describe('#validate', function () {

    it('validates all properties of a passed in object, which have validation rules', function (done) {
      var attributes = {
        aString: 'abc',
        aNumber: 123,
        aStringWithWrongValue: 123
      };

      var validations = {
        aString: {
          notEmpty: undefined
        },
        aNumber: {
          isInt: undefined
        },
        aStringWithWrongValue: {
          isAlpha: undefined
        }
      };

      (new ModelValidator()).validate(attributes, validations).then(function (validatedValues) {
        throw new Error('OOOPS');
      }).catch(function (err) {
        expect(err).to.be.ok();
        expect(err.errors.aStringWithWrongValue).to.be.ok();
        done();
      });
    });

    it('it does not validate attributes which have `required` set to false and are undefined', function (done) {
      var attributes = {
        aString: 'abc',
        aNumber: 123
      };

      var validations = {
        aString: {
          notEmpty: undefined
        },
        aNumber: {
          required: true,
          isInt: undefined
        },
        aStringWithWrongValue: {
          required: false,
          isAlpha: undefined
        }
      };

      (new ModelValidator()).validate(attributes, validations).then(function (validatedValues) {
        expect(validatedValues.aStringWithWrongValue).to.be(undefined);
        done();
      }).catch(function (err) {
        console.log(err);
        throw new Error('OOOPS');
      });
    });

    it('it does validate attributes which have `required` set to false and contain a value other than `undefined`', function (done) {
      var attributes = {
        aString: 'abc',
        aNumber: 123,
        aStringWithWrongValue: 123
      };

      var validations = {
        aString: {
          notEmpty: undefined
        },
        aNumber: {
          required: true,
          isInt: undefined
        },
        aStringWithWrongValue: {
          required: false,
          isAlpha: undefined
        }
      };

      (new ModelValidator()).validate(attributes, validations).then(function (validatedValues) {
        throw new Error('OOOPS');
      }).catch(function (err) {
        expect(err).to.be.ok();
        expect(err.errors.aStringWithWrongValue).to.be.ok();
        done();
      });
    });
  });
});