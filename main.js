import lodash from 'lodash';

removeAncientItem = function(item) {
  if (!item.launched || !item.launched.length) {
    Nesting.graph.remove({ target: item.id });
    Nesting.graph.remove({ source: item.id });
  }
};

import { refs } from './imports/refs';
import './imports/users';
import './imports/items';
import './imports/nesting';
import './imports/joining';
import './imports/rights';
import './imports/rules';

function attachGraphSpreadingPath(collection) {
  collection.before.insert((userId, doc) => {
    doc.launched = ['spread'];
  });
  collection.before.update((userId, doc, fieldNames, modifier, options) => {
    if (!lodash.includes(fieldNames, 'launched')) {
      if (lodash.includes(fieldNames, 'removed')) {
        if (!modifier.$addToSet) modifier.$addToSet = {};
        modifier.$addToSet.launched = 'unspread';
      } else if (!doc.launched) {
        if (!modifier.$addToSet) modifier.$addToSet = {};
        modifier.$addToSet.launched = { $each: ['unspread', 'spread'] };
      }
    }
  });
};

function attachGraphSpreadingSpreader(collection) {
  collection.before.insert((userId, doc) => {
    doc.launched = ['spread'];
  });
  collection.before.update((userId, doc, fieldNames, modifier, options) => {
    var source, target, guarantor;
    if (!doc.removed) {
      if (lodash.includes(fieldNames, 'breakpoints')) {
        if (!modifier.$addToSet) modifier.$addToSet = {};
        modifier.$addToSet.launched = 'breakpoints';
      }
      if (!lodash.includes(fieldNames, 'launched')) {
        if (lodash.includes(fieldNames, 'removed')) {
          if (!modifier.$addToSet) modifier.$addToSet = {};
          modifier.$addToSet.launched = 'unspread';
        } else {
          if (
            lodash.includes(fieldNames, 'source') ||
            lodash.includes(fieldNames, 'target') ||
            lodash.includes(fieldNames, 'guarantor')
          ) {
            if (!modifier.$addToSet) modifier.$addToSet = {};
            modifier.$addToSet.launched = { $each: ['unspread', 'spread'] };
          }
        }
      }
    }
  });
};

function attachGraphSpreadingSpread(collection) {
  collection.before.insert((userId, doc) => {
    doc.launched = ['respread'];
  });
  collection.before.update((userId, doc, fieldNames, modifier, options) => {
    if (!lodash.includes(fieldNames, 'launched')) {
      if (lodash.includes(fieldNames, 'respread')) {
        if (!modifier.$addToSet) modifier.$addToSet = {};
        modifier.$addToSet.launched = 'respread';
      } else if (!doc.removed) {
        if (!modifier.$addToSet) modifier.$addToSet = {};
        modifier.$addToSet.launched = { $each: ['respread'] };
      }
    }
  });
};

if (Meteor.isServer) {
  attachGraphSpreadingPath(Nesting);
  attachGraphSpreadingPath(Joining);
  attachGraphSpreadingSpreader(Rules);
  attachGraphSpreadingSpread(Rights);
}

Error.stackTraceLimit = 25;