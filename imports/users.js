import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { ExistedGraph, NonExistedGraph } from './removed';
import { refs } from './refs';

Users = Meteor.users;

Users.color = colors.grey900;

Users.isAllowed = function(sourceId, targetId, callback) {
  var result, storage;
  if (!sourceId || !targetId) return false;
  storage = refs.storage(sourceId);
  if (storage == Users && sourceId == targetId) result = true;
  else result = !!Rights.findOne({ removed: { $exists: false }, source: sourceId, target: targetId });
  if (callback) callback(result);
  return result;
};

if (Meteor.isServer) {
  Users.after.insert(function (userId, doc) {
    doc = this.transform(doc);
    var ruleId = Rules.insert({
      guarantor: doc.ref(),
      source: doc.ref(),
      target: doc.ref()
    });
    Nesting.graph.insert({
      source: doc.ref(),
      target: refs.generate(Rules._ref, ruleId)
    });
  });
}

if (Meteor.isServer) {
  Users.graph = new ExistedGraph(Users, {
      id: '_id',
      removed: 'removed', launched: 'launched'
  }, { name: 'subjects' });
  
  Users.graph.removed = new NonExistedGraph(
    Users.graph.collection, Users.graph.fields, Users.graph.config
  );
    
  Users.graph.removed.on('insert', (oldLink, newLink) => removeAncientItem(newLink));
  Users.graph.removed.on('update', (oldLink, newLink) => removeAncientItem(newLink));
}

if (Meteor.isServer) Meteor.publish('users', () => {
  return Users.find({ removed: { $exists: false }});
});

if (Meteor.isClient) Meteor.subscribe('users');