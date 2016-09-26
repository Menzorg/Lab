import lodash from 'lodash';

removeAncientItem = function(item) {
  if (!item.launched || !item.launched.length) {
    Nesting.graph.remove({ target: item.id });
    Nesting.graph.remove({ source: item.id });
  }
};

import './imports/refs';
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
  // attachGraphSpreadingSpread(Rights);
  
function doItPlease() {
  Rights.find({ launched: 'spread' }).forEach((right) => {
    Rights._queue.spread(Rights.graph._generateLink(right));
  });
  Rights.find({ launched: 'unspread' }).forEach((right) => {
    Rights._queue.unspread(Rights.graph._generateLink(right));
  });
  Rights.find({ launched: 'respread' }).forEach((right) => {
    Rights._queue.respread(Rights.graph._generateLink(right));
  });
  Rules.find({ launched: 'spread' }).forEach((rule) => {
    Rules._queue.spread(Rules.graph._generateLink(rule));
  });
  Rules.find({ launched: 'unspread' }).forEach((rule) => {
    Rules._queue.unspread(Rules.graph._generateLink(rule));
  });
  Nesting.find({ launched: 'spread' }).forEach((nesting) => {
    Nesting._queue.spread(Nesting.graph._generateLink(nesting));
  });
  Nesting.find({ launched: 'unspread' }).forEach((nesting) => {
    Nesting._queue.unspread(Nesting.graph._generateLink(nesting));
  });
};
  
  Meteor.startup(function () {
    doItPlease();
  });

  Meteor.methods({ doItPlease });
}
// if (Meteor.isServer) {
//   var u0 = Users.insert({});
//   var u1 = Users.insert({});
//   var u2 = Users.insert({});
  
//   var i0 = Items.insert({});
//   var i1 = Items.insert({});
  
//   var n0 = Nesting.insert({
//     source: Users.findOne(u0).ref(),
//     target: Items.findOne(i0).ref()
//   });
//   var n1 = Nesting.insert({
//     source: Users.findOne(u0).ref(),
//     target: Items.findOne(i1).ref()
//   });
// }

Error.stackTraceLimit = 25;