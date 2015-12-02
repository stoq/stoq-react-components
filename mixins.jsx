let Mixins = {};

Mixins.EventsMixin = {
  on(element, event, callback) {
    // Add a callback, keeping track of each added callback, so we can remove
    // them later
    this['__onEvent' + element.toString() + event + '__'] = callback;
    $(element).on(event, callback);
  },

  off(element, event) {
    // Remove a previously added callback
    $(element).off(event, this['__onEvent' + element.toString() + event + '__']);
  },
};

module.exports = Mixins;
