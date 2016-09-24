import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { ExistedGraph, NonExistedGraph } from './removed';
import { refs } from './refs';

Users = new Meteor.Collection('subjects');

Users.color = colors.grey900;

Users.isAllowed = function(sourceId, targetId, callback) {
  var result = !!Allow.findOne({ removed: { $exists: false }, source: sourceId, target: targetId });
  if (callback) callback(result);
  return result;
};

if (Meteor.isServer) {
  Users.after.insert(function (userId, doc) {
    doc = this.transform(doc);
    var allowerId = Allower.insert({
      guarantor: doc.ref(),
      source: doc.ref(),
      target: doc.ref()
    });
    Nesting.graph.insert({
      source: doc.ref(),
      target: refs.generate(Allower._ref, allowerId)
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