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
  
  Meteor.startup(function () {
    Rights.find({ $or: [{ process: { $not: { $size: 0 } } }, { launched: { $not: { $size: 0 } } }], removed: { $exists: false } }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.spread(_right);
        Rights._queue.respread.insert(_right);
      },
      changed(newRight, oldRight) {
        var _right = Rights.graph._generateLink(newRight);
        Rights._queue.respread(_right);
      }
    });
    Rights.find({ $or: [{ process: { $not: { $size: 0 } } }, { launched: { $not: { $size: 0 } } }], removed: { $exists: true } }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.unspread(_right);
        Rights._queue.respread.remove(_right);
      },
      changed(newRight, oldRight) {
        var _right = Rights.graph._generateLink(newRight);
        Rights._queue.respread(_right);
      }
    });
    
    Rules.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({added(rule) {
      Rules._queue.spread(Rules.graph._generateLink(rule));
    }});
    Rules.find({ launched: 'unspread' }).observe({ added(rule) {
      Rules._queue.unspread(Rules.graph._generateLink(rule));
    } });
    Rules.find({ launched: 'breakpoints' }).forEach((rule) => {
      Rules._queue.breakpoints(rule, rule.breakpoints);
    });
    Rules.find({}).observe({
      changed(newRule, oldRule) {
        var difference = lodash.difference(newRule.breakpoints, oldRule.breakpoints);
        difference.push.apply(difference, lodash.difference(oldRule.breakpoints, newRule.breakpoints));
        Rules._queue.breakpoints(newRule, difference);
      }
    });
    
    Nesting.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({ added(nesting) {
      Nesting._queue.spread(Nesting.graph._generateLink(nesting));
    } });
    Nesting.find({ launched: 'unspread' }).observe({ added(nesting) {
      Nesting._queue.unspread(Nesting.graph._generateLink(nesting));
    } });
    
    Joining.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({ added(joining) {
      Joining._queue.spread(Joining.graph._generateLink(joining));
    } });
    Joining.find({ launched: 'unspread' }).observe({ added(joining) {
      Joining._queue.unspread(Joining.graph._generateLink(joining));
    } });
  });
}

Error.stackTraceLimit = 25;