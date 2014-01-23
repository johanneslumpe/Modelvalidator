Modelvalidator
================

A small library to validate objects using node-validator and custom validators, by passing in a configuration hash.

## Basic usage

```javascript

var objectToValidate = {
  some:  'string',
  another: 123
}

var validations = {
  some: {
    notEmpty: undefined,
    _messages: {
      notEmpty: 'Please enter a value for "some"',
    },
  },

  another: {
    isInt: undefined,
    max: [1],
    min: [0]
  },
};

(new ModelValidator())
.validate(objectToValidate, validations)
.then(function (validatedValues) {
  // do something with the validated values
}.catch(function (err) {
  // some value is not valid
});
