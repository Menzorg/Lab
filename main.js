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
    if (!lodash.includes(fieldNames, 'launched') && !doc.removed) {
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
  attachGraphSpreadingSpreader(Rules);
  attachGraphSpreadingSpread(Rights);
  
  Meteor.startup(function () {
    Rights.find({ $nor: [{ process: { $size: 0 } }] }).observe({ added(right) {
      var launcher = refs.get(right.process[0]);
      if (launcher.launched) {
        if (lodash.includes(launcher.launched, 'unspread')) {
          Rights._queue.unspread(Rights.graph._generateLink(right));
        } else if (lodash.includes(launcher.launched, 'spread')) {
          Rights._queue.spread(Rights.graph._generateLink(right));
        }
      }
    } });
    
    Rules.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({added(rule) {
      Rules._queue.spread(Rules.graph._generateLink(rule));
    }});
    Rules.find({ launched: 'unspread' }).observe({ added(rule) {
      Rules._queue.unspread(Rules.graph._generateLink(rule));
    } });
    
    Nesting.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({ added(nesting) {
      Nesting._queue.spread(Nesting.graph._generateLink(nesting));
    } });
    Nesting.find({ launched: 'unspread' }).observe({ added(nesting) {
      Nesting._queue.unspread(Nesting.graph._generateLink(nesting));
    } });
  });
}

Error.stackTraceLimit = 25;