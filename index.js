 // Modelvalidator
 //
 // (c) 2013 Johannes Lumpe

var Promise = require('bluebird');
var PropertyValidator = require('./lib/propertyvalidator');

/*jslint node: true */
"use strict";

var ModelValidatorError = function ModelValidatorError(errors) {
  Error.captureStackTrace(this, this);
  this.name = 'ModelValidatorError';
  this.multiple = errors.length > 1;
  this.errors = {};

  for (var i = errors.length - 1; i >= 0; i--) {
    var error = errors[i];
    var prop = error[0];
    this.errors[prop] = error[1];
  }

  this.message = errors.length + ' properties invalid: ' + Object.keys(this.errors).join(', ');
};

ModelValidatorError.prototype = new Error();
ModelValidatorError.prototype.constructor = ModelValidatorError;

ModelValidatorError.prototype.toJSON = function toJSON() {
  return this.errors;
};

ModelValidatorError.prototype.toString = function toString() {
  return this.message;
};


var ModelValidator = function ModelValidator() {
  // TODO: do something useful here, i.e. allow a global node-validator instance
  // to be passed in
};

ModelValidator.prototype.validate = function validate(attributes, validations) {
  var toValidate = [];
  var validatedProps = [];

  // Create a `PropertyValidator` instance for each `property`
  for (var prop in validations) {
    var propValue = attributes[prop];
    var propRules = validations[prop];
    var required = propRules['required'];
    var isRequired = (required === undefined || required === true);
    var propExists = propValue !== undefined && propValue !== null;

    if (isRequired || propExists) {
      var modval = new PropertyValidator(prop, propValue, propRules);
      validatedProps.push(prop);
      toValidate.push(modval.validate());
    }
  }

  // Return a promise, which will be resolved with the `PropertyValidator` instances
  // of each property
  return Promise.all(toValidate).bind(this).then(function (propValidators) {
    var allErrors = [];
    var validatedValues = {};

    for (var i = validatedProps.length - 1; i >= 0; i--) {
      var propValidator = propValidators[i];
      if (propValidator.errors) {
        allErrors.push([propValidator.prop, propValidator.errors]);
        continue;
      }

      validatedValues[validatedProps[i]] = propValidator.value;
    }

    // if any errors occured throw them now
    if (allErrors.length) {
      throw new ModelValidatorError(allErrors);
    }

    return validatedValues;
  });
};

module.exports.ModelValidator = ModelValidator;
module.exports.ModelValidatorError = ModelValidatorError;