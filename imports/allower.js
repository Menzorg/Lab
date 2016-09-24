import lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import colors from 'material-ui/styles/colors';

import { factorySpreaderGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from './removed';
import { refs } from './refs';

Allower = new Meteor.Collection('allower');

Allower.color = colors.green600;

if (Meteor.isServer) {
  var ExistedAllowerGraph = factorySpreaderGraph(ExistedGraph);
  var NonExistedAllowerGraph = NonExistedGraph;
  
  Allower.graph = new ExistedAllowerGraph(Allower, {
      id: '_id', source: 'source', target: 'target',
      removed: 'removed', launched: 'launched', process: 'process', guarantor: 'guarantor'
  }, { name: 'allower', constantField: 'source', variableField: 'target' });
  
  Allower.graph.removed = new NonExistedAllowerGraph(
    Allower.graph.collection, Allower.graph.fields, Allower.graph.config
  );

  Allower.graph.on('insert', (oldLink, newLink) => {
    Allow.queue.insertedSpreaderLink(Allower.graph, newLink);
  });
  
  Allower.graph.on('update', (oldLink, newLink) => {
    if (
      oldLink.source != newLink.source ||
      oldLink.target != newLink.target ||
      oldLink.guarantor != newLink.guarantor
    ) {
      Allow.queue.updatedSourceOrTargetSpreaderLink(Allower.graph, newLink);
    } else {
      if (newLink.launched.length) {
        Allow.queue.updatedLaunchedUnspreadSpreaderLink(Allower.graph, newLink);
      }
    }
  });
  
  Allower.graph.on('remove', (oldLink, newLink) => {
    Allow.queue.removedSpreaderLink(Allower.graph, oldLink);
  });
  
  Allower.graph.removed.on('insert', (oldLink, newLink) => removeAncientItem(newLink));
  Allower.graph.removed.on('update', (oldLink, newLink) => removeAncientItem(newLink));
}

if (Meteor.isServer) Meteor.publish('allower', () => {
  return Allower.find({ removed: { $exists: false }});
});

if (Meteor.isClient) Meteor.subscribe('allower');

Allower.allow({
  insert(userId, doc) {
    if (doc.guarantor != refs.generate(Users._ref, userId)) return false;
    return true;
  },
  update(userId, doc, fields, modifier) {
    var guarantor;
    if (lodash.includes(fields, 'guarantor')) {
      guarantor = modifier.guarantor?modifier.guarantor:(modifier.$set?modifier.$set.guarantor:undefined);
      if (guarantor != refs.generate(Users._ref, userId)) return false;
    }
    return Users.isAllowed(refs.generate(Users._ref, userId), doc.ref());
  },
  remove(userId, doc) {
    return Users.isAllowed(refs.generate(Users._ref, userId), doc.ref());
  }
})