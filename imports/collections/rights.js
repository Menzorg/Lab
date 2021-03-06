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
              var resolution = isAllowed(['delegating', ...rule.rightsTypes], rule.guarantor, newSpreadLink.target, true);
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
  Rights.spreading.addPathGraph(Owning.graph);
  Rights.spreading.addPathGraph(Joining.graph);
  
  Rights.queue = new QueueSpreading(Rights.spreading);
  
  Rights._queue = {};
  Rights._queue.spread = (newLink) => {
    var targetCollection = getCollection(newLink.target);
    if (lodash.includes(newLink.rightsTypes, 'fetching')) {
      Rights._queue.insertRightType(newLink, () => {
        Rights.queue.spreadBySpread(newLink);
      });
    } else {
      Rights.queue.spreadBySpread(newLink);
    }
  }
  Rights._queue.unspread = (oldLink) => {
    Rights._queue.removeRightType(oldLink,() => {
      Rights.queue.unspreadBySpread(oldLink);
    });
  }
  
  Rights._queue.removeRightType = (link, callback) => {
    var targetCollection = getCollection(link.target);
    var count = Rights.find({
      _id: { $not: { $eq: link._id } },
      removed: { $exists: false }, source: link.source, target: link.target,
      rightsTypes: 'fetching'
    }).count();
    if (!count) {
      targetCollection.update(refs.parse(link.target)[1], { $pull: { __fetchable: link.source } }, () => {
        if (callback) callback();
      });
    } else {
      if (callback) callback();
    }
  };
  
  Rights._queue.insertRightType = (link, callback) => {
    var targetCollection = getCollection(link.target);
    targetCollection.update(refs.parse(link.target)[1], { $addToSet: { __fetchable: link.source } }, () => {
      if (callback) callback();
    });
  };
  
  Rights._queue.respread = (link) => {
    Rights._queue.respread.insert(link, () => {
      Rights._queue.respread.remove(link);
    });
  };
  Rights._queue.respread.insert = (link, callback) => {
    Rules.graph.fetch({ target: link.target }, undefined, (error, rules) => {
      async.each(rules, (rule, next) => {
        var allowed = isAllowed(['delegating', ...rule.rightsTypes], rule.guarantor, link.target, true);
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
        var allowed = isAllowed(['delegating', ...rule.rightsTypes], rule.guarantor, link.target, true);
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

if (Meteor.isServer) Meteor.publish('rights', function(query) {
  this.autorun((computation) => {
    if (typeof(query) != 'object') query = {};
    query.removed = { $exists: false };
    if (this.userId) {
      query.$or = [
        { $or: Users.findOne(this.userId).mapJoining((join) => { return { source: join }}) }
      ]
    };
    return Rights.find(query);
  });
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
    Rights.find({ launched: 'retype' }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        if (lodash.includes(_right.rightsTypes, 'fetching')) {
          Rights._queue.insertRightType(_right, () => {
            Rights.queue.removeFromLaunched(_right.id, 'retype');
          });
        } else {
          Rights._queue.removeRightType(_right, () => {
            Rights.queue.removeFromLaunched(_right.id, 'retype');
          });
        }
      }
    });
    Rights.find({ launched: 'respread', $or: [{ process: { $exists: false } }, { process: { $size: 0 } }], removed: { $exists: false } }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.respread.insert(_right);
      }
    });
    Rights.find({ launched: 'respread', $or: [{ process: { $exists: false } }, { process: { $size: 0 } }], removed: { $exists: true } }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.respread.remove(_right);
      }
    });
    Rights.find({ launched: 'respread', $or: [{ process: { $exists: false } }, { process: { $size: 0 } }] }).observe({
      changed(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.respread(_right);
      }
    });
    Rights.find({ process: { $not: { $size: 0 } }, removed: { $exists: false } }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.spread(_right);
      }
    });
    Rights.find({ process: { $not: { $size: 0 } }, removed: { $exists: true } }).observe({
      added(right) {
        var _right = Rights.graph._generateLink(right);
        Rights._queue.unspread(_right);
      }
    });
  });
}

if (Meteor.isServer) {
  attachGraphSpreadingSpread(Rights);
}