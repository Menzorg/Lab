import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';
import async from 'async';

import { factorySpreadGraph, factoryRespreadGraph, GraphSpreading } from 'ancient-graph-spreading';

import { ExistedGraph, NonExistedGraph } from './removed';
import { QueueSpreading } from '../imports/queue';
import { getCollection } from '../imports/getCollection';
import { refs } from '../imports/refs';

Rights = new Meteor.Collection('rights');

Rights.color = colors.lightGreen600;

if (Meteor.isServer) {
  var ExistedRightsGraph = (() => {
    var ExistedRightsGraph = factorySpreadGraph(ExistedGraph);
    class CustomExistedSpreadGraph extends ExistedRightsGraph {
      _spreadingHandler(prevSpreadLink, pathGraph, pathLink, newSpreadLink, context, callback) {
        if (prevSpreadLink) {
          if (prevSpreadLink.removed) {
            return callback(undefined);
          }
          if (prevSpreadLink.spreader) {
            newSpreadLink.spreader = prevSpreadLink.spreader;
          }
        }
        
        // <AppRightssLogic>
        var rule = refs.get(newSpreadLink.spreader);
        if (rule && rule.guarantor && rule.source && rule.target) {
          if (!(
            rule.source == rule.target &&
            rule.source == rule.guarantor &&
            getCollection(rule.source) == Users
          )) {
            var resolution = Rights.findOne({
              source: rule.guarantor, target: newSpreadLink.target
            });
            if (!resolution) {
              // return callback(undefined);
            }
          }
        } else {
          return callback(undefined);
        }
        // </AppRightssLogic>
        
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
  var NonExistedRightsGraph = factorySpreadGraph(NonExistedGraph);

  Rights.graph = new ExistedRightsGraph(Rights, {
    id: '_id', source: 'source', target: 'target',
    removed: 'removed', launched: 'launched', process: 'process', spreader: 'spreader',
    prev: 'prev', path: 'path', root: 'root'
  }, { name: 'spread', constantField: 'source', variableField: 'target' });
  
  Rights.graph.removed = new NonExistedRightsGraph(
    Rights.graph.collection, Rights.graph.fields, Rights.graph.config
  );

  Rights.spreading = new GraphSpreading(Rights.graph);
  Rights.spreading.addPathGraph(Nesting.graph);
  
  Rights.queue = new QueueSpreading(Rights.spreading);
  
  Rights._queue = {};
  Rights._queue.spread = (newLink) => {
    var targetCollection = getCollection(newLink.target);
    if (targetCollection != Users) {
      targetCollection.update(refs.parse(newLink.target)[1], { $addToSet: { __rightly: newLink.source } }, () => {
        Rights.queue.spreadBySpread(newLink);
      });
    } else Rights.queue.spreadBySpread(newLink);
  }
  Rights._queue.unspread = (oldLink) => {
    var targetCollection = getCollection(oldLink.target);
    if (targetCollection != Users) {
      targetCollection.update(refs.parse(oldLink.target)[1], { $pull: { __rightly: oldLink.source } }, () => {
        Rights.queue.unspreadBySpread(oldLink);
      });
    } else Rights.queue.unspreadBySpread(oldLink);
  }
  Rights._queue.respread = (link) => {
    Rights._queue.respread.insert(link, () => {
      Rights._queue.respread.remove(link);
    });
  };
  
  Rights._queue.respread.insert = (link, callback) => {
    Rules.graph.fetch({ target: link.target }, undefined, (error, rules) => {
      async.each(rules, (rule, next) => {
        Users.isRightsed(rule.guarantor, link.target, (rightly) => {
          if (rightly) {
            Rights.spreading.spreadNewSpreadLink({
              [Rights.spreading.spreadGraph.constantField]: rule[Rules.graph.constantField],
              [Rights.spreading.spreadGraph.variableField]: rule[Rules.graph.variableField],
              spreader: rule.id
            }, { process: link.id }, () => {
              next();
            });
          }
        });
      }, () => {
        if (callback) callback();
        else Rights.queue.removeFromLaunched(link.id, 'respread');
      });
    });
  };
  
  Rights._queue.respread.remove = (link, callback) => {
    Rules.graph.fetch({ target: link.target }, undefined, (error, rules) => {
      async.each(rules, (rule, next) => {
        Users.isRightsed(rule.guarantor, link.target, (rightly) => {
          if (!rightly) {
            Rights.graph.remove({
              spreader: rule.id
            }, (error, count) => {
              next();
            });
          }
        });
      }, () => {
        Rights.spreading.spreadTo(link.target, undefined, undefined, () => {
          if (callback) callback();
          else Rights.queue.removeFromLaunched(link.id, 'respread');
        });
      });
    });
  };
  
  Rights.graph.on('insert', (oldLink, newLink) => {
    Rights._queue.spread(newLink)
  });
  
  Rights.graph.on('remove', (oldLink, newLink) => {
    if (oldLink.process && oldLink.process.length) Rights._queue.unspread(oldLink);
  });
  
  Rights.graph.on('insert', (oldLink, newLink) => {
    Rights._queue.respread.insert(newLink);
  });
  Rights.graph.removed.on('insert', (oldLink, newLink) => {
    Rights._queue.respread.remove(newLink);
  });
}

if (Meteor.isServer) Meteor.publish('rights', () => {
  return Rights.find({ removed: { $exists: false }});
});

if (Meteor.isClient) Meteor.subscribe('rights');

Rights.allow({
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