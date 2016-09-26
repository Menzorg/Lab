import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';
import async from 'async';

import { factorySpreadGraph, factoryRespreadGraph, GraphSpreading } from 'ancient-graph-spreading';

import { ExistedGraph, NonExistedGraph } from './removed';
import { QueueSpreading } from '../imports/queue';
import { getCollection } from '../imports/getCollection';
import { refs } from '../imports/refs';

Allow = new Meteor.Collection('allow');

Allow.color = colors.lightGreen600;

if (Meteor.isServer) {
  var ExistedAllowGraph = (() => {
    var ExistedAllowGraph = factorySpreadGraph(ExistedGraph);
    class CustomExistedSpreadGraph extends ExistedAllowGraph {
      _spreadingHandler(prevSpreadLink, pathGraph, pathLink, newSpreadLink, context, callback) {
        if (prevSpreadLink && prevSpreadLink.spreader) {
          newSpreadLink.spreader = prevSpreadLink.spreader;
        }
        
        // <AppRightsLogic>
        var allower = refs.get(newSpreadLink.spreader);
        if (allower && allower.guarantor && allower.source && allower.target) {
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
  
  Allow._queue = {};
  Allow._queue.spread = (newLink) => Allow.queue.insertedSpreadLink(newLink);
  Allow._queue.unspread = (oldLink) => Allow.queue.removedSpreadLink(oldLink);
  Allow._queue.respread = (link) => {
    Allow._queue.respread.insert(link, () => {
      Allow._queue.respread.remove(link);
    });
  };
  
  Allow._queue.respread.insert = (link, callback) => {
    Allower.graph.fetch({ target: link.target }, undefined, (error, allowers) => {
      async.each(allowers, (allower, next) => {
        Users.isAllowed(allower.guarantor, link.target, (allowed) => {
          if (allowed) {
            Allow.spreading.spreadNewSpreadLink({
              [Allow.spreading.spreadGraph.constantField]: allower[Allower.graph.constantField],
              [Allow.spreading.spreadGraph.variableField]: allower[Allower.graph.variableField],
              spreader: allower.id
            }, { process: link.id }, () => {
              next();
            });
          }
        });
      }, () => {
        if (callback) callback();
        else Allow.queue.mayBeEndedLaunched(link.id, 'respread');
      });
    });
  };
  
  Allow._queue.respread.remove = (link, callback) => {
    Allower.graph.fetch({ target: link.target }, undefined, (error, allowers) => {
      async.each(allowers, (allower, next) => {
        Users.isAllowed(allower.guarantor, link.target, (allowed) => {
          if (!allowed) {
            Allow.graph.remove({
              spreader: allower.id
            }, (error, count) => {
              next();
            });
          }
        });
      }, () => {
        Allow.spreading.spreadTo(link.target, undefined, undefined, () => {
          if (callback) callback();
          else Allow.queue.mayBeEndedLaunched(link.id, 'respread');
        });
      });
    });
  };
  
  Allow.graph.on('insert', (oldLink, newLink) => {
    Allow._queue.spread(newLink)
  });
  
  Allow.graph.on('remove', (oldLink, newLink) => {
    if (oldLink.process && oldLink.process.length) Allow._queue.unspread(oldLink);
  });
  
  Allow.graph.on('insert', (oldLink, newLink) => {
    Allow._queue.respread.insert(newLink);
  });
  Allow.graph.removed.on('insert', (oldLink, newLink) => {
    Allow._queue.respread.remove(newLink);
  });
}

if (Meteor.isServer) Meteor.publish('allow', () => {
  return Allow.find({ removed: { $exists: false }});
});

if (Meteor.isClient) Meteor.subscribe('allow');

Allow.allow({
  insert() {
    return false;
  },
  update() {
    return false;
  },
  remove() {
    return false;
  }
})