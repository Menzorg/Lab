import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { factoryPathGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from '../removed';
import { getCollection } from '../getCollection';
import { refs } from '../refs';
import { isAllowed } from '../isAllowed';
import { attachGraphSpreadingPath } from '../attach';

Joining = new Meteor.Collection('joining');

Joining.color = colors.lime800;

if (Meteor.isServer) {
  var ExistedJoiningGraph = factoryPathGraph(ExistedGraph);
  var NonExistedJoiningGraph = NonExistedGraph;
  
  Joining.graph = new ExistedJoiningGraph(Joining, {
      id: '_id', source: 'source', target: 'target',
      removed: 'removed', launched: 'launched', process: 'process'
  }, { name: 'joining', fromFields: ['source'], toFields: ['id'] });
  
  Joining.graph.removed = new NonExistedJoiningGraph(
    Joining.graph.collection, Joining.graph.fields, Joining.graph.config
  );
  
  Joining._queue = {};
  Joining._queue.spread = (newLink) => {
    Rights.queue.spreadByPath(Joining.graph, newLink);
  };
  Joining._queue.unspread = (oldLink) => {
    Rights.queue.unspreadByPath(Joining.graph, oldLink);
  };
  
  Joining.graph.removed.on('insert', (oldLink, newLink) => Owning._queue.remove(newLink));
  Joining.graph.removed.on('update', (oldLink, newLink) => Owning._queue.remove(newLink));
}

if (Meteor.isServer) Meteor.publish('joining', function() {
  return Joining.find({ removed: { $exists: false }, __fetchable: refs.generate(Users._ref, this.userId) });
});

if (Meteor.isClient) Meteor.subscribe('joining');

Joining.allow({
  insert(userId, doc) {
    return doc.source?isAllowed(['editing'], refs.generate(Users._ref, userId), doc.source):false;
  },
  update(userId, doc, fields) {
    if (lodash.includes(fields, 'source') || lodash.includes(fields, 'target')) return false;
    return isAllowed(['editing'], refs.generate(Users._ref, userId), doc.ref());
  },
  remove(userId, doc) {
    return isAllowed(['editing'], refs.generate(Users._ref, userId), doc.ref());
  }
});

if (Meteor.isServer) {
  attachGraphSpreadingPath(Joining);
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Joining.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({ added(joining) {
      Joining._queue.spread(Joining.graph._generateLink(joining));
    } });
    Joining.find({ launched: 'unspread' }).observe({ added(joining) {
      Joining._queue.unspread(Joining.graph._generateLink(joining));
    } });
  });
}