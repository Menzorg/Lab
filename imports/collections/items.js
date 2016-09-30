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
  
  Items.graph.removed.on('insert', (oldLink, newLink) => Owning._queue.remove(newLink));
  Items.graph.removed.on('update', (oldLink, newLink) => Owning._queue.remove(newLink));
}

if (Meteor.isServer) Meteor.publish('items', function() {
  return Items.find({
    removed: { $exists: false },
    $or: [
      { __fetchable: refs.generate(Users._ref, this.userId) },
      { __draft: refs.generate(Users._ref, this.userId) }
    ]
  });
});

if (Meteor.isClient) Meteor.subscribe('items');

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