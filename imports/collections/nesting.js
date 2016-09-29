import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { factoryPathGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from '../removed';
import { getCollection } from '../getCollection';
import { refs } from '../refs';
import { isAllowed } from '../isAllowed';
import { attachGraphSpreadingPath } from '../attach';

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
  
  Nesting._queue.remove = (object) => {
    if (!object.launched || !object.launched.length) {
      Nesting.graph.remove({ target: object.id });
      Nesting.graph.remove({ source: object.id });
    }
  };
  
  Nesting.graph.removed.on('insert', (oldLink, newLink) => {
    Nesting._queue.remove(newLink);
    Nesting.graph.count({ target: newLink.target }, undefined, (error, count) => {
      if (!count) {
        var targetCollection = getCollection(newLink.target);
        if (targetCollection != Users) {
          targetCollection.graph.remove(newLink.target);
        }
      }
    });
  });
  Nesting.graph.removed.on('update', (oldLink, newLink) => Nesting._queue.remove(newLink));
}

if (Meteor.isServer) Meteor.publish('nesting', function() {
  return Nesting.find({ removed: { $exists: false }, __fetchable: refs.generate(Users._ref, this.userId) });
});

if (Meteor.isClient) Meteor.subscribe('nesting');

Nesting.allow({
  insert(userId, doc) {
    return doc.source?isAllowed(['owning'], refs.generate(Users._ref, userId), doc.source):false;
  },
  update(userId, doc) {
    return isAllowed(['owning'], refs.generate(Users._ref, userId), doc.ref());
  },
  remove(userId, doc) {
    return isAllowed(['owning'], refs.generate(Users._ref, userId), doc.ref());
  }
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    Nesting.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({ added(nesting) {
      Nesting._queue.spread(Nesting.graph._generateLink(nesting));
    } });
    Nesting.find({ launched: 'unspread' }).observe({ added(nesting) {
      Nesting._queue.unspread(Nesting.graph._generateLink(nesting));
    } });
  });
}

if (Meteor.isServer) {
  attachGraphSpreadingPath(Nesting);
}