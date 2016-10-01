import lodash from 'lodash';
import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

import { factoryPathGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from '../removed';
import { getCollection } from '../getCollection';
import { refs } from '../refs';
import { isAllowed } from '../isAllowed';
import { attachGraphSpreadingPath } from '../attach';

Owning = new Meteor.Collection('owning');

Owning.color = colors.lightBlue800;

if (Meteor.isServer) {
  var ExistedOwningGraph = factoryPathGraph(ExistedGraph);
  var NonExistedOwningGraph = NonExistedGraph;
  
  Owning.graph = new ExistedOwningGraph(Owning, {
      id: '_id', source: 'source', target: 'target',
      removed: 'removed', launched: 'launched', process: 'process'
  }, { name: 'owning', fromFields: ['source'], toFields: ['target', 'id'] });
  
  Owning.graph.removed = new NonExistedOwningGraph(
    Owning.graph.collection, Owning.graph.fields, Owning.graph.config
  );
  
  Owning._queue = {};
  Owning._queue.spread = (newLink) => {
    refs.collection(newLink.target).update(refs.id(newLink.target), {
      $unset: { '__draft': '' }
    }, () => {
      Rights.queue.spreadByPath(Owning.graph, newLink);
    });
  };
  Owning._queue.unspread = (oldLink) => {
    Rights.queue.unspreadByPath(Owning.graph, oldLink);
  };
  
  Owning._queue.remove = (object) => {
    if (!object.launched || !object.launched.length) {
      Owning.graph.remove({ target: object.id });
      Owning.graph.remove({ source: object.id });
    }
  };
  
  Owning.graph.removed.on('insert', (oldLink, newLink) => {
    Owning._queue.remove(newLink);
    Owning.graph.count({ target: newLink.target }, undefined, (error, count) => {
      if (!count) {
        var targetCollection = getCollection(newLink.target);
        if (targetCollection != Users) {
          targetCollection.graph.remove(newLink.target);
        }
      }
    });
  });
  Owning.graph.removed.on('update', (oldLink, newLink) => Owning._queue.remove(newLink));
}

if (Meteor.isServer) Meteor.publish('owning', function() {
  this.autorun((computation) => {
    var query = { removed: { $exists: false } };
    if (this.userId) {
      query.$or = [
        { $or: Users.findOne(this.userId).mapJoining((join) => { return { __fetchable: join }}) }
      ]
    };
    return Owning.find(query);
  });
});

if (Meteor.isClient) Meteor.subscribe('owning');

Owning.allow({
  insert(userId, doc) {
    return doc.source&&doc.target?isAllowed(['owning'], refs.generate(Users._ref, userId), doc.source)&&isAllowed(['owning'], refs.generate(Users._ref, userId), doc.target):false;
  },
  update(userId, doc, fields, modifier) {
    if (lodash.includes(fields, 'source') || lodash.includes(fields, 'target')) return false;
    return isAllowed(['editing'], refs.generate(Users._ref, userId), doc.ref());
  },
  remove(userId, doc) {
    return isAllowed(['owning'], refs.generate(Users._ref, userId), doc.ref());
  }
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    Owning.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({ added(owning) {
      Owning._queue.spread(Owning.graph._generateLink(owning));
    } });
    Owning.find({ launched: 'unspread' }).observe({ added(owning) {
      Owning._queue.unspread(Owning.graph._generateLink(owning));
    } });
  });
}

if (Meteor.isServer) {
  attachGraphSpreadingPath(Owning);
}