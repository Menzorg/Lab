import lodash from 'lodash';
import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { factorySpreadGraph, factoryPathGraph, GraphSpreading } from 'ancient-graph-spreading';
import { QueueSpreading } from '../queue';
import { ExistedGraph, NonExistedGraph } from '../removed';
import { getCollection } from '../getCollection';
import { refs } from '../refs';
import { isAllowed } from '../isAllowed';
import { attachGraphSpreadingPath } from '../attach';

Joining = new Meteor.Collection('joining');

Joining.color = colors.lime800;

if (Meteor.isServer) {
  var ExistedPathJoiningGraph = factoryPathGraph(ExistedGraph);
  var ExistedSpreadJoiningGraph = factorySpreadGraph(ExistedGraph);
  var NonExistedJoiningGraph = NonExistedGraph;
  
  Joining.graph = new ExistedPathJoiningGraph(Joining, {
      id: '_id', source: 'source', target: 'target',
      removed: 'removed', launched: 'launched', process: 'process'
  }, { name: 'joining', fromFields: ['source'], toFields: ['id'] });
  
  Joining.graph.removed = new NonExistedJoiningGraph(
    Joining.graph.collection, Joining.graph.fields, Joining.graph.config
  );
  
  Joining.spreadGraph = new ExistedSpreadJoiningGraph(Joining, {
      id: '_id', source: 'source', target: 'target',
      removed: 'removed', launched: 'launched', process: 'process', spreader: 'spreader',
      prev: 'prev', path: 'path', root: 'root'
  }, {
    name: 'joining',
    fromFields: ['source'], toFields: ['target'],
    constantField: 'source', variableField: 'target'
  });
  
  Joining.spreadGraph.removed = new NonExistedJoiningGraph(
    Joining.graph.collection, Joining.graph.fields, Joining.graph.config
  );

  Joining.spreading = new GraphSpreading(Joining.spreadGraph);
  Joining.spreading.addPathGraph(Joining.spreadGraph);
  
  Joining.queue = new QueueSpreading(Joining.spreading);
  
  Joining._queue = {};
  Joining._queue.spread = (newLink) => {
    refs.collection(newLink.target).update(refs.id(newLink.target), {
      $addToSet: { __joining: newLink.source }
    }, () => {
      Joining.queue.spreadBySpread(newLink, () => {
        Rights.queue.spreadByPath(Joining.graph, newLink);
      });
    });
  };
  Joining._queue.unspread = (oldLink) => {
    refs.collection(oldLink.target).update(refs.id(oldLink.target), {
      $pull: { __joining: oldLink.source }
    }, () => {
      Joining.queue.unspreadBySpread(oldLink, () => {
        Rights.queue.unspreadByPath(Joining.graph, oldLink);
      });
    });
  };
  
  Joining._queue.remove = (object) => {
    if (!object.launched || !object.launched.length) {
      Joining.graph.remove({ target: object.id });
      Joining.graph.remove({ source: object.id });
    }
  };
  
  Owning.graph.removed.on('insert', (oldLink, newLink) => {
    Owning._queue.remove(newLink);
    Joining._queue.remove(newLink);
  });
  Owning.graph.removed.on('update', (oldLink, newLink) => {
    Owning._queue.remove(newLink);
    Joining._queue.remove(newLink);
  });
}

if (Meteor.isServer) Meteor.publish('joining', function() {
  this.autorun((computation) => {
    var $or;
    var query = { removed: { $exists: false }, root: { $exists: false } };
    if (this.userId) {
      if (this.userId) {
        $or = [];
        $or.push.apply($or, Users.findOne(this.userId).mapJoining((join) => { return { __fetchable: join }}));
        $or.push.apply($or, Users.findOne(this.userId).mapJoining((join) => { return { target: join }}));
      }
      query.$or = $or
    };
    return Joining.find(query);
  });
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