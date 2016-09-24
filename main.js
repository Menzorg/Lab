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
import './imports/allow';
import './imports/allower';

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
    if (!lodash.includes(fieldNames, 'launched')) {
      if (lodash.includes(fieldNames, 'removed')) {
        if (!modifier.$addToSet) modifier.$addToSet = {};
        modifier.$addToSet.launched = 'unspread';
      } else if (!doc.removed) {
        if (!modifier.$addToSet) modifier.$addToSet = {};
        modifier.$addToSet.launched = { $each: ['unspread', 'spread'] };
      }
    }
  });
};

if (Meteor.isServer) {
  attachGraphSpreadingPath(Nesting);
  attachGraphSpreadingSpreader(Allower);
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