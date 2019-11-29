let Mixins = {};

Mixins.EventsMixin = {
  on(element, event, callback) {
    // Add a callback, keeping track of each added callback, so we can remove
    // them later
    this["__onEvent" + element.toString() + event + "__"] = callback;
    $(element).on(event, callback);
  },

  off(element, event) {
    // Remove a previously added callback
    $(element).off(event, this["__onEvent" + element.toString() + event + "__"]);
  },
};

Mixins.Blinkable = {
  // The id of the 'setTimeout' used to make the rows blink
  _blinkTimeoutId: null,

  blinkTimeout: function(func, millis) {
    // Clear last blink Timeout and set another one
    clearTimeout(this._blinkTimeoutId);
    this._blinkTimeoutId = setTimeout(func, millis);
  },

  componentWillUnmount: function() {
    // Do not allow the registered blinkTimeout to be executed
    clearTimeout(this._blinkTimeoutId);
  },
};

module.exports = Mixins;
