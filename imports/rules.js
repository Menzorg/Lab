import lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import colors from 'material-ui/styles/colors';

import { factorySpreaderGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from './removed';
import { refs } from './refs';

Rules = new Meteor.Collection('rules');

Rules.color = colors.green600;

if (Meteor.isServer) {
  var ExistedRulesGraph = factorySpreaderGraph(ExistedGraph);
  var NonExistedRulesGraph = NonExistedGraph;
  
  Rules.graph = new ExistedRulesGraph(Rules, {
      id: '_id', source: 'source', target: 'target',
      removed: 'removed', launched: 'launched', process: 'process', guarantor: 'guarantor'
  }, { name: 'rules', constantField: 'source', variableField: 'target' });
  
  Rules.graph.removed = new NonExistedRulesGraph(
    Rules.graph.collection, Rules.graph.fields, Rules.graph.config
  );
  
  Rules._queue = {};
  Rules._queue.spread = (newLink) => {
    Rights.queue.spreadBySpreader(Rules.graph, newLink);
  };
  Rules._queue.unspread = (oldLink) => {
    Rights.queue.unspreadBySpreader(Rules.graph, oldLink);
  };

  Rules.graph.on('insert', (oldLink, newLink) => {
    Rules._queue.spread(newLink);
  });
  
  Rules.graph.on('update', (oldLink, newLink) => {
    if (newLink.launched.length) {
      if (newLink.launched[0] == 'unspread') {
        Rules._queue.unspread(newLink);
      } else if (newLink.launched[0] == 'spread') {
        Rules._queue.spread(newLink);
      }
    }
  });
  
  Rules.graph.on('remove', (oldLink, newLink) => {
    Rules._queue.unspread(oldLink);
  });
  
  Rules.graph.removed.on('insert', (oldLink, newLink) => removeAncientItem(newLink));
  Rules.graph.removed.on('update', (oldLink, newLink) => removeAncientItem(newLink));
}

if (Meteor.isServer) Meteor.publish('rules', function() {
  return Rules.find({ removed: { $exists: false }, __rightly: refs.generate(Users._ref, this.userId) });
});

if (Meteor.isClient) Meteor.subscribe('rules');

Rules.allow({
  insert(userId, doc) {
    if (doc.guarantor != refs.generate(Users._ref, userId)) return false;
    return true;
  },
  update(userId, doc, fields, modifier) {
    var guarantor;
    if (lodash.includes(fields, 'guarantor')) {
      guarantor = modifier.guarantor?modifier.guarantor:(modifier.$set?modifier.$set.guarantor:undefined);
      if (guarantor && guarantor != refs.generate(Users._ref, userId)) return false;
    }
    return (
      Users.isRightsed(refs.generate(Users._ref, userId), doc.ref())
    );
  },
  remove(userId, doc) {
    return Users.isRightsed(refs.generate(Users._ref, userId), doc.ref());
  }
})

Rules.after.update(function(...args) {
  // console.log(...args);
  // console.trace('UPDATE');
});