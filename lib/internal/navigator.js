'use strict';

const {
  ObjectDefineProperties,
} = primordials;

const {
  kEnumerableProperty,
} = require('internal/util');

const {
  getAvailableParallelism,
} = internalBinding('os');

class Navigator {
  /**
   * @return {number}
   */
  get hardwareConcurrency() {
    return getAvailableParallelism();
  }
}

ObjectDefineProperties(Navigator.prototype, {
  hardwareConcurrency: kEnumerableProperty,
});

module.exports = new Navigator();
