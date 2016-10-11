import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { ExistedGraph, NonExistedGraph } from '../removed';
import { refs } from '../refs';
import { isAllowed } from '../isAllowed';
import { attachDraftField } from '../attach';

Items = new Meteor.Collection('items');

Items.color = colors.purple500;

if (Meteor.isServer) {
  Items.graph = new ExistedGraph(Items, {
      id: '_id',
      removed: 'removed', launched: 'launched'
  }, { name: 'items' });
  
  Items.graph.removed = new NonExistedGraph(
    Items.graph.collection, Items.graph.fields, Items.graph.config
  );
  
  Items.graph.removed.on('insert', (oldLink, newLink) => {
    Owning._queue.remove(newLink);
    Joining._queue.remove(newLink);
  });
  Items.graph.removed.on('update', (oldLink, newLink) => {
    Owning._queue.remove(newLink);
    Joining._queue.remove(newLink);
  });
}

if (Meteor.isServer) Meteor.publish('items', function(query) {
  this.autorun((computation) => {
    if (typeof(query) != 'object') query = {};
    query.removed = { $exists: false };
    if (this.userId) {
      query.$or = [
        { $or: Users.findOne(this.userId).mapJoining((join) => { return { __fetchable: join }}) }
      ]
    };
    return Items.find(query);
  });
});

if (Meteor.isServer) {
  attachDraftField(Items);
}

Items.allow({
  insert(userId, doc) {
    return true;
  },
  update(userId, doc) {
    return isAllowed(['editing'], refs.generate(Users._ref, userId), doc.ref());
  },
  remove(userId, doc) {
    return isAllowed(['editing'], refs.generate(Users._ref, userId), doc.ref());
  }
});