import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { ExistedGraph, NonExistedGraph } from './removed';

Items = new Meteor.Collection(null, { ref: 'items' });

Items.color = colors.purple500;

Items.counter = 0;

Items.before.insert(function (userId, doc) {
  doc._id = 'items/'+Items.counter;
  Items.counter++;
});

Items.graph = new ExistedGraph(Items, {
    id: '_id',
    removed: 'removed', launched: 'launched'
}, { name: 'items' });

Items.graph.removed = new NonExistedGraph(
  Items.graph.collection, Items.graph.fields, Items.graph.config
);

Items.graph.removed.on('insert', (oldLink, newLink) => removeAncientItem(newLink));
Items.graph.removed.on('update', (oldLink, newLink) => removeAncientItem(newLink));