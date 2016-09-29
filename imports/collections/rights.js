import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';
import async from 'async';
import lodash from 'lodash';

import { factorySpreadGraph, factoryRespreadGraph, GraphSpreading } from 'ancient-graph-spreading';

import { ExistedGraph, NonExistedGraph } from '../removed';
import { QueueSpreading } from '../queue';
import { getCollection } from '../getCollection';
import { refs } from '../refs';
import { isAllowed } from '../isAllowed';

import { attachGraphSpreadingSpread } from '../attach';

Rights = new Meteor.Collection('rights');

Rights.color = colors.lightGreen600;

if (Meteor.isServer) {
  var ExistedRightsGraph = (() => {
    var ExistedRightsGraph = factorySpreadGraph(ExistedGraph);
    class CustomExistedSpreadGraph extends ExistedRightsGraph {
      _spreadingHandler(prevSpreadLink, pathGraph, pathLink, newSpreadLink, context, callback) {
        if (prevSpreadLink) {
          if (prevSpreadLink.spreader) {
            newSpreadLink.spreader = prevSpreadLink.spreader;
          }
        }
        
        // <AppRightssLogic>
        var rule = refs.get(newSpreadLink.spreader);
        if (rule) {
          if (prevSpreadLink) {
            if (lodash.includes(rule.breakpoints, prevSpreadLink.target)) {
              return callback(undefined);
            }
          }
          
          if (lodash.includes(rule.rightsTypes, 'fetching')) {
            newSpreadLink.rightsTypes = rule.rightsTypes;
          }
          
          if (rule.guarantor && rule.source && rule.target) {
            if (!(
              rule.source == rule.target &&
              rule.source == rule.guarantor &&
              rule.source && getCollection(rule.source) == Users
            )) {
              var resolution = isAllowed(rule.rightsTypes, rule.guarantor, newSpreadLink.target, true);
              if (!resolution) {
                return callback(undefined);
              }
            }
          } else {
            return callback(undefined);
          }
        } else {
          return callback(undefined);
        }
        // </AppRightssLogic>
        
        if (pathLink) {
          var pathCollection = getCollection(pathLink.id);
          pathCollection.graph.get(pathLink.id, undefined, (error, pathLink) => {
            if (!pathLink) callback(undefined);
            else this.get({
              source: newSpreadLink.source, target: newSpreadLink.target,
              spreader: newSpreadLink.spreader
            }, undefined, (error, spreadLink) => {
              if (spreadLink) callback();
              else this.get(prevSpreadLink.id, undefined, (error, prevSpreadLink) => {
                callback(prevSpreadLink?newSpreadLink:undefined);
              });
            });
          });
        } else {
          this.count({
            source: newSpreadLink.source, target: newSpreadLink.target,
            spreader: newSpreadLink.spreader
          }, undefined, (error, count) => {
            if (count) callback();
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
    prev: 'prev', path: 'path', root: 'root',
    rightsTypes: 'rightsTypes'
  }, { name: 'spread', constantField: 'source', variableField: 'target' });
  
  Rights.graph.removed = new NonExistedRightsGraph(
    Rights.graph.collection, Rights.graph.fields, Rights.graph.config
  );

  Rights.spreading = new GraphSpreading(Rights.graph);
  Rights.spreading.addPathGraph(Nesting.graph);
  Rights.spreading.addPathGraph(Joining.graph);
  
  Rights.queue = new QueueSpreading(Rights.spreading);
  
  Rights._queue = {};
  Rights._queue.spread = (newLink) => {
    var targetCollection = getCollection(newLink.target);
    if (lodash.includes(newLink.rightsTypes, 'fetching')) {
      targetCollection.update(refs.parse(newLink.target)[1], { $addToSet: { __fetchable: newLink.source } }, () => {
        Rights.queue.spreadBySpread(newLink);
      });
    }
  }
  Rights._queue.unspread = (oldLink) => {
    var targetCollection = getCollection(oldLink.target);
    if (targetCollection != Users) {
      var count = Rights.find({
        _id: { $not: { $eq: oldLink._id } },
        removed: { $exists: false }, source: oldLink.source, target: oldLink.target,
        rightsTypes: 'fetching'
      }).count();
      if (!count) {
        targetCollection.update(refs.parse(oldLink.target)[1], { $pull: { __fetchable: oldLink.source } }, () => {
          Rights.queue.unspreadBySpread(oldLink);
        });
      } else Rights.queue.unspreadBySpread(oldLink);
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
        var allowed = isAllowed(rule.rightsTypes, rule.guarantor, link.target, true);
        if (allowed) {
          Rights.spreading.spreadNewSpreadLink({
            [Rights.spreading.spreadGraph.constantField]: rule[Rules.graph.constantField],
            [Rights.spreading.spreadGraph.variableField]: rule[Rules.graph.variableField],
            spreader: rule.id
          }, { process: link.id }, () => {
            next();
          });
        }
      }, () => {
        if (callback) callback();
        else Rights.queue.removeFromLaunched(link.id, 'respread');
      });
    });
  };
  
  Rights._queue.respread.remove = (link, callback) => {
    Rules.graph.fetch({ target: link.target }, undefined, (error, rules) => {
      async.each(rules, (rule, next) => {
        var allowed = isAllowed(rule.rightsTypes, rule.guarantor, link.target, true);
        if (!allowed) {
          Rights.graph.remove({
            spreader: rule.id
          }, (error, count) => {
            next();
          });
        }
      }, () => {
        Rights.spreading.spreadTo(link.target, undefined, undefined, () => {
          if (callback) callback();
          else Rights.queue.removeFromLaunched(link.id, 'respread');
        });
      });
    });
  };
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

if (Meteor.isServer) {
  Meteor.startup(function () {
    Rights.find({ $or: [{ process: { $not: { $size: 0 } } }, { launched: { $not: { $size: 0 } } }], removed: { $exists: false } }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.spread(_right);
        Rights._queue.respread.insert(_right);
      },
      changed(newRight, oldRight) {
        var _right = Rights.graph._generateLink(newRight);
        Rights._queue.respread(_right);
      }
    });
    Rights.find({ $or: [{ process: { $not: { $size: 0 } } }, { launched: { $not: { $size: 0 } } }], removed: { $exists: true } }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.unspread(_right);
        Rights._queue.respread.remove(_right);
      },
      changed(newRight, oldRight) {
        var _right = Rights.graph._generateLink(newRight);
        Rights._queue.respread(_right);
      }
    });
  });
}

if (Meteor.isServer) {
  attachGraphSpreadingSpread(Rights);
}