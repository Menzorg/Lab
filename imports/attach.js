import lodash from 'lodash';
import { refs } from './refs';

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
          var $each = [];
          if (
            lodash.includes(fieldNames, 'source') ||
            lodash.includes(fieldNames, 'target') ||
            lodash.includes(fieldNames, 'guarantor') ||
            lodash.includes(fieldNames, 'rightsTypes')
          ) {
            $each.push('unspread', 'spread', 'retype');
          }
          if ($each.length) {
            if (!modifier.$addToSet) modifier.$addToSet = {};
            modifier.$addToSet.launched = { $each: $each };
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
        modifier.$addToSet.launched = { $each: ['respread', 'retype'] };
      }
    }
  });
};

function attachDraftField(collection) {
  collection.before.insert((userId, doc) => {
    doc.__draft = refs.generate(Users._ref, userId);
  });
};

export { attachGraphSpreadingPath, attachGraphSpreadingSpread, attachGraphSpreadingSpreader, attachDraftField };