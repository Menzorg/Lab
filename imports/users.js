import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { ExistedGraph, NonExistedGraph } from './removed';

Users = new Meteor.Collection(null, { ref: 'subjects' });

Users.color = colors.grey900;

Users.counter = 0;

Users.before.insert(function (userId, doc) {
  doc._id = 'subjects/'+Users.counter;
  Users.counter++;
});

Users.isAllowed = function(sourceId, targetId, callback) {
  var result = !!Allow.findOne({ removed: { $exists: false }, source: sourceId, target: targetId });
  if (callback) callback(result);
  return result;
};

Users.after.insert(function (userId, doc) {
  Nesting.graph.insert({
    source: doc._id,
    target: Allower.insert({
      guarantor: doc._id,
      source: doc._id,
      target: doc._id
    })
  });
});

Users.graph = new ExistedGraph(Users, {
    id: '_id',
    removed: 'removed', launched: 'launched'
}, { name: 'subjects' });

Users.graph.removed = new NonExistedGraph(
  Users.graph.collection, Users.graph.fields, Users.graph.config
);

Users.graph.removed.on('insert', (oldLink, newLink) => removeAncientItem(newLink));
Users.graph.removed.on('update', (oldLink, newLink) => removeAncientItem(newLink));