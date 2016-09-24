import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { factoryPathGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from './removed';
import { refs } from './refs';

Nesting = new Meteor.Collection('nesting');

Nesting.color = colors.lightBlue800;

if (Meteor.isServer) {
  var ExistedNestingGraph = factoryPathGraph(ExistedGraph);
  var NonExistedNestingGraph = NonExistedGraph;
  
  Nesting.graph = new ExistedNestingGraph(Nesting, {
      id: '_id', source: 'source', target: 'target',
      removed: 'removed', launched: 'launched', process: 'process'
  }, { name: 'nesting', fromFields: ['source'], toFields: ['target', 'id'] });
  
  Nesting.graph.removed = new NonExistedNestingGraph(
    Nesting.graph.collection, Nesting.graph.fields, Nesting.graph.config
  );

  Nesting.graph.on('insert', (oldLink, newLink) => {
    Allow.queue.insertedPathLink(Nesting.graph, newLink);
  });
  Nesting.graph.on('update', (oldLink, newLink) => {
    if (oldLink.source != newLink.source || oldLink.target != newLink.target) {
      Allow.queue.updatedSourceOrTargetPathLink(Nesting.graph, newLink);
    } else {
      if (newLink.launched.length) {
        Allow.queue.updatedLaunchedUnspreadPathLink(Nesting.graph, newLink);
      }
    }
  });
  Nesting.graph.on('remove', (oldLink, newLink) => {
    Allow.queue.removedPathLink(Nesting.graph, oldLink);
  });
  
  Nesting.graph.removed.on('insert', (oldLink, newLink) => removeAncientItem(newLink));
  Nesting.graph.removed.on('update', (oldLink, newLink) => removeAncientItem(newLink));
}

if (Meteor.isServer) Meteor.publish('nesting', () => {
  return Nesting.find({ removed: { $exists: false }});
});

if (Meteor.isClient) Meteor.subscribe('nesting');

Nesting.allow({
  insert(userId, doc) {
    return doc.source?Users.isAllowed(refs.generate(Users._ref, userId), doc.source):false;
  },
  update(userId, doc) {
    return Users.isAllowed(refs.generate(Users._ref, userId), doc.ref());
  },
  remove(userId, doc) {
    return Users.isAllowed(refs.generate(Users._ref, userId), doc.ref());
  }
})