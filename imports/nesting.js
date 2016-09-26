import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { factoryPathGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from './removed';
import { getCollection } from './getCollection';
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
  
  Nesting._queue = {};
  Nesting._queue.spread = (newLink) => {
    Rights.queue.spreadByPath(Nesting.graph, newLink);
  };
  Nesting._queue.unspread = (oldLink) => {
    Rights.queue.unspreadByPath(Nesting.graph, oldLink);
  };

  Nesting.graph.on('insert', (oldLink, newLink) => {
    Nesting._queue.spread(newLink);
  });
  Nesting.graph.on('update', (oldLink, newLink) => {
    if (newLink.launched.length) {
      if (newLink.launched[0] == 'unspread') {
        Nesting._queue.unspread(newLink);
      } else if (newLink.launched[0] == 'spread') {
        Nesting._queue.spread(newLink);
      }
    }
  });
  Nesting.graph.on('remove', (oldLink, newLink) => {
    Nesting._queue.unspread(oldLink);
  });
  
  Nesting.graph.removed.on('insert', (oldLink, newLink) => {
    removeAncientItem(newLink);
    Nesting.graph.count({ target: newLink.target }, undefined, (error, count) => {
      if (!count) {
        var targetCollection = getCollection(newLink.target);
        targetCollection.graph.remove(newLink.target);
      }
    });
  });
  Nesting.graph.removed.on('update', (oldLink, newLink) => removeAncientItem(newLink));
}

if (Meteor.isServer) Meteor.publish('nesting', function() {
  return Nesting.find({ removed: { $exists: false }, __rightly: refs.generate(Users._ref, this.userId) });
});

if (Meteor.isClient) Meteor.subscribe('nesting');

Nesting.allow({
  insert(userId, doc) {
    return doc.source?Users.isRightsed(refs.generate(Users._ref, userId), doc.source):false;
  },
  update(userId, doc) {
    return Users.isRightsed(refs.generate(Users._ref, userId), doc.ref());
  },
  remove(userId, doc) {
    return Users.isRightsed(refs.generate(Users._ref, userId), doc.ref());
  }
})