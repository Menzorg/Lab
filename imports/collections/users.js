import lodash from 'lodash';

import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { ExistedGraph, NonExistedGraph } from '../removed';
import { refs } from '../refs';

Users = Meteor.users;

Users.color = colors.grey900;

if (Meteor.isServer) {
  Users.after.insert(function (userId, doc) {
    doc = this.transform(doc);
    var ruleId = Rules.insert({
      guarantor: doc.ref(),
      source: doc.ref(),
      target: doc.ref(),
      rightsTypes: ['fetching', 'editing', 'owning', 'delegating']
    });
    Owning.graph.insert({
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
    
  Users.graph.removed.on('insert', (oldLink, newLink) => {
    Owning._queue.remove(newLink);
    Joining._queue.remove(newLink);
  });
  Users.graph.removed.on('update', (oldLink, newLink) => {
    Owning._queue.remove(newLink);
    Joining._queue.remove(newLink);
  });
}

if (Meteor.isServer) Meteor.publish('users', function(query) {
  this.autorun((computation) => {
    if (typeof(query) != 'object') query = {};
    query.removed = { $exists: false };
    return Users.find(query);
  });
});

if (Meteor.isClient) Meteor.subscribe('users');

Users.helpers({
  mapJoining(handler) {
    var $joining = lodash.map(this.__joining, handler);
    $joining.push(handler(this.ref()));
    return $joining;
  }
});