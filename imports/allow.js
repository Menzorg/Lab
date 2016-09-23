import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';
import async from 'async';

import { factorySpreadGraph, factoryRespreadGraph, GraphSpreading } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from './removed';
import { QueueSpreading } from '../imports/queue';

import { getCollection } from '../imports/getCollection';

Allow = new Meteor.Collection(null, { ref: 'allow' });

Allow.color = colors.lightGreen600;

Allow.counter = 0; 

Allow.before.insert(function (userId, doc) {
  doc._id = 'allow/'+Allow.counter;
  Allow.counter++;
});

var ExistedAllowGraph = (() => {
  var ExistedAllowGraph = factoryRespreadGraph(factorySpreadGraph(ExistedGraph));
  class CustomExistedSpreadGraph extends ExistedAllowGraph {
    _spreadingHandler(prevSpreadLink, pathGraph, pathLink, newSpreadLink, context, callback) {
      if (prevSpreadLink && prevSpreadLink.spreader) {
        newSpreadLink.spreader = prevSpreadLink.spreader;
      }
      
      // <AppRightsLogic>
      var allower = Allower.findOne(newSpreadLink.spreader);
      if (allower && allower.guarantor) {
        if (!(
          allower.source == allower.target &&
          allower.source == allower.guarantor &&
          getCollection(allower.source) == Users
        )) {
          var resolution = Allow.findOne({
            source: allower.guarantor, target: newSpreadLink.target
          });
          if (!resolution) {
            // return callback(undefined);
          }
        }
      } else {
        return callback(undefined);
      }
      // </AppRightsLogic>
      
      if (pathLink) {
        Nesting.graph.get(pathLink.id, undefined, (error, pathLink) => {
          if (!pathLink) callback(undefined);
          else this.get({
            source: newSpreadLink.source, target: newSpreadLink.target
          }, undefined, (error, spreadLink) => {
            if (spreadLink) callback();
            else this.get(prevSpreadLink.id, undefined, (error, prevSpreadLink) => {
              callback(prevSpreadLink?newSpreadLink:undefined);
            });
          });
        });
      } else {
        this.get({
          source: newSpreadLink.source, target: newSpreadLink.target
        }, undefined, (error, spreadLink) => {
          if (spreadLink) callback();
          else callback(newSpreadLink);
        });
      }
    }
  }
  return CustomExistedSpreadGraph;
})();
var NonExistedAllowGraph = factorySpreadGraph(NonExistedGraph);

Allow.graph = new ExistedAllowGraph(Allow, {
  id: '_id', source: 'source', target: 'target',
  removed: 'removed', launched: 'launched', process: 'process', spreader: 'spreader',
  prev: 'prev', path: 'path', root: 'root'
}, { name: 'spread', constantField: 'source', variableField: 'target' });

Allow.graph.removed = new NonExistedAllowGraph(
  Allow.graph.collection, Allow.graph.fields, Allow.graph.config
);

Allow.spreading = new GraphSpreading(Allow.graph);
Allow.spreading.addPathGraph(Nesting.graph);

Allow.queue = new QueueSpreading(Allow.spreading);

Allow.graph.on('insert', (oldLink, newLink) => {
  Allow.queue.insertedSpreadLink(newLink);
});
Allow.graph.on('remove', (oldLink, newLink) => {
  if (oldLink.process.length) Allow.queue.removedSpreadLink(oldLink);
});

Allow.graph.on('insert', (oldLink, newLink) => {
  Allower.graph.fetch({ target: newLink.target }, undefined, (error, allowers) => {
    async.each(allowers, (allower, next) => {
      Users.isAllowed(allower.guarantor, newLink.target, (allowed) => {
        if (allowed) {
          Allow.spreading.spreadNewSpreadLink({
            [Allow.spreading.spreadGraph.constantField]: allower[Allower.graph.constantField],
            [Allow.spreading.spreadGraph.variableField]: allower[Allower.graph.variableField],
            spreader: allower.id
          }, { process: newLink.id }, () => {
            next();
          });
        }
      });
    }, () => {
      Allow.graph.removed.update(newLink.id, { launched: { remove: 'respread' } });
    });
  });
});
Allow.graph.removed.on('insert', (oldLink, newLink) => {
  Allower.graph.fetch({ target: newLink.target }, undefined, (error, allowers) => {
    async.each(allowers, (allower, next) => {
      Users.isAllowed(allower.guarantor, newLink.target, (allowed) => {
        if (!allowed) {
          Allow.graph.remove({
            spreader: allower.id
          }, (error, count) => {
            next();
          });
        }
      });
    }, () => {
      Allow.graph.removed.update(newLink.id, { launched: { remove: 'respread' } });
    });
  });
});