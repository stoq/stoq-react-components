import React from 'react';
import $ from 'jquery';

import ComponentUtils from '../utils';

import _ from 'gettext';

var Utils = {
  subscriptionStatuses: [
      {label: 'bg-primary', text: _('Trialing')},
      {label: 'label-success', text: _('Paid')},
      {label: 'label-warning', text: _('Waiting Payment')},
      {label: 'label-danger', text: _('Unpaid')},
      {label: 'bg-purple', text: _('Canceled')},
      {label: 'bg-purple', text: _('Ended')},
  ],

  paymentTypes: {
    'out': {
      className: 'label-danger',
      label: _('Out'),
    },
    'in': {
      className: 'label-success',
      label: _('In'),
    },
  },

  formatters: {
    cep: function(string) {
      if (string.length <= 5) {
        return string;
      }
      return string.substring(0, 5) + '-' + string.substring(5);
    },

    subscriptionStatus: function(index) {
      var status = this.subscriptionStatuses[index];
      return React.createElement(
        'span',
        { className: 'label ' + status.label, style: { display: 'inline' } },
        status.text
      );
    },

    paymentType: function(type) {
      var settings = this.paymentTypes[type];
      return <span className={'label ' + settings.className}>
        { settings.label }
      </span>;
    },

    ...ComponentUtils.formatters,
  },

  /* Add possibly missing categories to a list */
  categoryMerge: function(receivedCategories, sellableCategories) {
    var nullCategory = receivedCategories.filter(function(category) {
      // Find the null representative id
      return category.id == '00000000-0000-0000-0000-000000000000';
    });
    // Rename the null representative id
    nullCategory[0].id = '__null__';

    // Merge the categories from config with the incoming ones
    var mergedCategories = sellableCategories.map(function(sc) {
      var retval = {
        id: sc.id,
        description: sc.description,
        parent_id: sc.category_id,
      };
      receivedCategories.forEach(function(c) {
        if (c.id == sc.id) {
          retval = $.extend(retval, c);
        }
      });
      return retval;
    });
    return mergedCategories.concat(nullCategory);
  },

  /** Given a category_list regroup it to build a tree structure
  *
  * @param category_list: The list of categories. Each object should contain
  *     a 'parent_id' attribute that points to it's corresponding parent.
  *     Objects with parent_id set to 'null' represent a root category.
  *
  * @param summary_func: Optional summary function. If it is defined, it
  *     will be called for each root category, giving the oportunity to
  *     attach a summary to each category.
  *
  * @returns A list of root_categories, with a 'children' attribute,
  *     that represents their children.
  *
  * @see www/stoq/views/products/stock_by_category.js for an example
  */
  categoryTree: function(category_list, summary_func) {
    // Separate root categories from the other ones
    var root_categories = category_list.filter(function(category) {
      return !category.parent_id;
    });
    var remaining_categories = category_list.filter(function(category) {
      return category.parent_id;
    });

    // Then Build the tree
    var tree = this._tree(root_categories, remaining_categories)[0];

    // If a summary function is provided, build the summary for the tree
    if (summary_func) {
      tree.forEach(object => {
        summary_func(object);
      });
    }
    return tree;
  },

  /** Regroup remaining_categories into into its correponding parent category
   *
   * @param root_categories: Categories that will have it's children matched
   *     they'll have a 'children' attribute attached to it, that will
   *     represent all its children categories.
   *
   * @param remaining_categories: Categories that still don't have any parent
   *     matched, they'll be our search domain to build the 'children' list.
   */
  _tree: function(root_categories, remaining_categories) {
    // First add an empty list to all root categories
    root_categories.forEach(category => {
      category.children = [];
    });

    // Then try to find any root category parent on the
    // remaining_categories, grep will also remove elements when it's
    // function return false
    var matched_categories = [];
    remaining_categories = remaining_categories.filter(object => {
      var parent = root_categories.find(object => {return object.id == object.parent_id;});
      if (parent) {
        parent.children.push(object);
        matched_categories.push(object);
        return false;
      }
      return true;
    });

    // After matching parent categories, recursively call this
    // function to do the same for the newly formed child categories.
    root_categories.forEach(category => {
      if (category.children.length > 0) {
        remaining_categories = this._tree(category.children,
                                          remaining_categories)[1];
      }
    });
    return [root_categories, remaining_categories];
  },

  /* Iterate through all properties of a object and call the given function
   * only for the ones that are numbers
   *
   * @param object: the object to be iterated over
   * @param func: the function to be called for each key/value that is a
   *      number, it receives the parameters key and value.
   */
  forEachNumber: function(object, func) {
    for (var key in object) {
      if (object.hasOwnProperty(key) && typeof object[key] === 'number') {
        func(key, object[key]);
      }
    }
  },

  ajax: function(options, view=null) {
    options.crossDomain = true;
    options.xhrFields = {
      withCredentials: true,
    };

    if (options.instance) {
      options.url = options.instance.premium_url + options.url;
      options.data = {auth_key: options.instance.premium_key, ...options.data};
    } else {
      options.url = Environment.ADMIN_REMOTE_URL + options.url;
    }

    // If no view was set, simply make the ajax request
    if (!view) {
      return $.ajax(options);
    }

    // If a view was set its state to loading, add proper callbacks that remove
    // loading state once the ajax call is done and only then execute the ajax
    // call
    var wrap = function(type) {
      let onCallback = options[type] || function() {};
      options[type] = (...args) => view.setState({
        loading: false,
      }, () => onCallback(...args));
    };

    wrap('success');
    wrap('error');
    view.setState({loading: true}, () => $.ajax(options));
  },
};

/* Bind the formatters with their parent for getting access to it's properties */
Object.keys(Utils.formatters).forEach(function(key) {
  if (typeof Utils.formatters[key] === 'function') {
    Utils.formatters[key] = Utils.formatters[key].bind(Utils);
  }
});

module.exports = {...ComponentUtils, ...Utils};
