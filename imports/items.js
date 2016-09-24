import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { ExistedGraph, NonExistedGraph } from './removed';
import { refs } from './refs';

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
  
  Items.graph.removed.on('insert', (oldLink, newLink) => removeAncientItem(newLink));
  Items.graph.removed.on('update', (oldLink, newLink) => removeAncientItem(newLink));
}

if (Meteor.isServer) Meteor.publish('items', () => {
  return Items.find({ removed: { $exists: false }});
});

if (Meteor.isClient) Meteor.subscribe('items');

Items.allow({
  insert(userId, doc) {
    return true;
  },
  update(userId, doc) {
    return Users.isAllowed(refs.generate(Users._ref, userId), doc.ref());
  },
  remove(userId, doc) {
    return Users.isAllowed(refs.generate(Users._ref, userId), doc.ref());
  }
})