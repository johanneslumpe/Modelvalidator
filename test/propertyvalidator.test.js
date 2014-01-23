var PropertyValidator = require('../lib/propertyvalidator');
var Validator = require('validator').Validator;
var sanitize = require('validator').sanitize;
var Promise = require('bluebird');
var expect = require('expect.js');

describe('PropertyValidator', function () {
  var propVal;
  var options = {};
  before(function() {
    propVal = new PropertyValidator('testProp', 123, options);
  });

  it('should exist', function () {
    expect(PropertyValidator).to.be.a('function');
  });

  it('should store property, value and config on the instance', function () {
    expect(propVal.prop).to.equal('testProp');
    expect(propVal.value).to.equal(123);
    expect(propVal.options).to.equal(options);
  });

  it('should alias node-validator\'s `sanitize method as `this.sanitize` and should create a new `Validator` instance as `this.validator', function () {
    expect(propVal.validator).to.be.a(Validator);
    expect(propVal.sanitize).to.equal(sanitize);
  });

  describe('#error', function () {
    it('should add the passed in message to the error object with the passed in validation function name as key');
    it('should use the message of an error instance, if one is passed instead of a message string');
    it('should use the custom message defined for a validation function instead of the message of the error instance');
  });

  describe('#validate', function() {

    it('should return a promise', function () {
      var propVal = new PropertyValidator('testProp', 123, {});
      var retVal = propVal.validate();
      expect(retVal).to.be.a(Promise);
    });

    it('should validate a value with the passed in validators', function (done) {
      var propVal = new PropertyValidator('testProp', '', {
        notEmpty: undefined
      });

      propVal.validate().then(function (validator) {
        expect(validator.errors).to.be.ok();
        expect(validator.errors.notEmpty).to.be.ok();
        done();
      });
    });

    it('should ignore key value pairs in the validation hash, if the key is not the name of a validator or the value is are not custom validation functions', function (done) {
      var propVal = new PropertyValidator('testProp', '', {
        invalidValidator: undefined
      });

      propVal.validate().then(function (validator) {
        expect(validator.errors).to.be(null);
        done();
      });
    });

    it('should return a custom error message for each validator, where one is specified in the validation hash', function (done) {
      var propVal = new PropertyValidator('testProp', '', {
        notEmpty: undefined,
        _messages: {
          notEmpty: 'Custom message'
        }
      });

      propVal.validate().then(function (validator) {
        expect(validator.errors).to.be.ok();
        expect(validator.errors.notEmpty).to.equal('Custom message');
        done();
      });
    });

    it('should handle multiple validators per property and return errors for all failed ones', function (done) {
      var propVal = new PropertyValidator('testProp', 'test', {
        notEmpty: undefined,
        len: [2,10],
        isEmail: undefined,
        isDecimal: undefined,
        _messages: {
          notEmpty: 'Custom message',
          isEmail: 'Not an email',
          isDecimal: 'Not decimal'
        }
      });

      propVal.validate().then(function (validator) {
        expect(validator.errors).to.be.ok();
        expect(validator.errors.notEmpty).to.be(undefined);
        expect(validator.errors.len).to.be(undefined);
        expect(validator.errors.isEmail).to.equal('Not an email');
        expect(validator.errors.isDecimal).to.equal('Not decimal');
        done();
      });
    });

    it('should call custom validation functions', function (done) {
      var propVal = new PropertyValidator('testProp', 'test', {
        custom: function() {
          done();
        }
      });

      propVal.validate();
    });

    it('should allow custom validators to modify the value', function (done) {
      var propVal = new PropertyValidator('testProp', 'test', {
        custom: function() {
          this.value = 'NEWVALUE';
        }
      });

      propVal.validate().then(function (validator) {
        expect(validator.value).to.be('NEWVALUE');
        done();
      });
    });

    it('should add an error for a custom validator if it returns false', function (done) {
      var propVal = new PropertyValidator('testProp', 'test', {
        custom: function() {
          return false;
        }
      });

      propVal.validate().then(function (validator) {
        expect(validator.errors).to.have.key('custom');
        done();
      });
    });

    it('should add an error for a custom validator throwing an error, containing the specified error message', function (done) {
      var propVal = new PropertyValidator('testProp', 'test', {
        custom: function() {
          throw new Error('TESTERROR');
        }
      });

      propVal.validate().then(function (validator) {
        expect(validator.errors.custom).to.equal('TESTERROR');
        done();
      });
    });

    it('should allow custom validators to return a promise and do async validation', function (done) {
      var propVal = new PropertyValidator('testProp', 'test', {
        custom: function() {
          return Promise.fulfilled().bind(this).delay(500).then(function () {
            return false;
          });
        }
      });

      propVal.validate().then(function (validator) {
        expect(validator.errors).to.have.key('custom');
        done();
      });
    });
  });
});