import { Meteor } from 'meteor/meteor';

import colors from 'material-ui/styles/colors';

import { factorySpreaderGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from './removed';

Allower = new Meteor.Collection(null, { ref: 'allower' });

Allower.color = colors.green600;

Allower.counter = 0;

Allower.before.insert(function (userId, doc) {
  doc._id = 'allower/'+Allower.counter;
  Allower.counter++;
});

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
  if (oldLink.source != newLink.source || oldLink.target != newLink.target || oldLink.guarantor != newLink.guarantor) {
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