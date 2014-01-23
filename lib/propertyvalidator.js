// Propertyvalidator

var sanitize    = require('validator').sanitize;
var validators  = require('validator').validators;
var Promise     = require('bluebird');

/*jslint node: true */
"use strict";

var PropertyValidator = function (prop, value, options) {
  this.messageKey = '_messages';
  this.options = options;
  this.prop = prop;
  this.value = value;
  this.errors = null;
  this.messages = options[this.messageKey] || {};

  this.sanitize = sanitize;

  var Validator = require('validator').Validator;
  this.validator = new Validator();

  // assign a new error handler, so errors will not be thrown
  this.validator.error = PropertyValidator.prototype.error.bind(this);
  this.check = this.validator.check;
};

PropertyValidator.prototype.error = function (validationFuncName, msg) {
  this.errors = this.errors || {};

  // A custom validation function can thrown an error.
  // In this case the msg param will be an instance of `Error`
  // and not a plain string.
  if (msg instanceof Error) {
    var customMsg = this.messages[validationFuncName];
    msg = customMsg || msg.message;
  }
  // A custom validator will call the error function with a `validationFuncName`
  // and a `msg` argument. `this.validator` will only pass in a message,
  // since the validation function name is not bound to the error handler.
  // Because of that the next three lines look a bit hacky
  var gotMsg = msg !== undefined;
  var funcName = gotMsg ? validationFuncName : this.currentValidationFuncName;
  msg = gotMsg ? msg : validationFuncName;
  this.errors[funcName] = msg;
  return this;
};

PropertyValidator.prototype._callValidator = function (func, params) {
  var validator = this.validator;

  if (validators[func]) {
    // Initialize the validator with the current value
    // and the appropriate error messages
    validator.check(this.value, this.messages && this.messages[func]);
    this.currentValidationFuncName = func;

    // Reassign the error method, so that errors can
    // be collected first, before being collectively thrown
    // validator.error = errorHandler;
    validator[func].apply(validator, params);
    return this;
  }

  // Call custom validation function with the `PropertyValidator` as context,
  // allowing custom functions to modify the value as desired.
  if (typeof params === 'function') {
    return Promise.fulfilled().bind(this).then(params).then(function (validatedValue) {
      var funcName = func;

      // In case the custom validation function returns false, instead
      // of throwing an error, manually add an error
      if (validatedValue === false) {
        PropertyValidator.prototype.error.call(this, funcName, this.messages && this.messages[funcName] || '');
      }

      return this;

    // Because this error might be called async, we cannot rely on `this.currentValidationFuncName`
    // to contain the correct value. To migitate this problem, we bind the current validation
    // function name to the error handler
    }).catch(this.validator.error.bind(this, func));
  }

  return this;
};

PropertyValidator.prototype.validate = function () {
  // For now all values get sanitized by default
  // TODO: change this! (make it optional or whatever, just do not always sanitize the value like this)
  // What about type casting?
  this.value = this.sanitize(this.value).chain().entityEncode().trim().str;
  var toValidate = [];
  var options = this.options;
  for (var validationFunc in options) {
    if (validationFunc !== this.messageKey) {
      toValidate.push(this._callValidator(validationFunc, options[validationFunc]));
    }
  }

  // Returns a promise which will resolve with the `PropertyValidator` instance
  return Promise.all(toValidate).bind(this).then(function (values) {
    return this;
  });
};

module.exports = PropertyValidator;