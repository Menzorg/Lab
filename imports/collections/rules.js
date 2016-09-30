import lodash from 'lodash';
import { Meteor } from 'meteor/meteor';
import async from 'async';

import colors from 'material-ui/styles/colors';

import { factorySpreaderGraph } from 'ancient-graph-spreading';
import { ExistedGraph, NonExistedGraph } from '../removed';
import { refs } from '../refs';
import { isAllowed } from '../isAllowed';
import { attachGraphSpreadingSpreader, attachDraftField } from '../attach';

Rules = new Meteor.Collection('rules');

Rules.color = colors.green600;

if (Meteor.isServer) {
  var ExistedRulesGraph = factorySpreaderGraph(ExistedGraph);
  var NonExistedRulesGraph = NonExistedGraph;
  
  Rules.graph = new ExistedRulesGraph(Rules, {
      id: '_id', source: 'source', target: 'target',
      removed: 'removed', launched: 'launched', process: 'process', guarantor: 'guarantor',
      rightsTypes: 'rightsTypes'
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
  Rules._queue.breakpoints = (rule, breakpoints) => {
    var process = refs.generate(Rules._ref, rule._id);
    async.each(breakpoints, (breakpoint, nextBreakpoint) => {
      var rights = Rights.find({
        spreader: rule.ref(), target: breakpoint,
        removed: { $exists: false }
      }).fetch();
      async.each(rights, (right, nextRight) => {
        var rightRef = refs.generate(Rights._ref, right._id);
        Rights.spreading.unspreadFromRemovedSpreadLinkByPrevId(
          rightRef, { process: process }, undefined,
          (error, count) => {
            Rights.spreading.spreadFromSpreadLink(Rights.graph._generateLink(right), { process: process }, undefined, () => {
              nextRight();
            });
          }
        );
      }, () => {
        nextBreakpoint();
      });
    }, () => {
      Rights.queue.removeFromLaunched(process, 'breakpoints');
    });
  };
  
  Rules._queue.retype = (rule) => {
    Rights.update({ spreader: rule.id }, { $set: { rightsTypes: rule.rightsTypes }}, { multi: true }, () => {
      Rights.queue.removeFromLaunched(rule.id, 'retype');
    });
  }

  Rules.graph.removed.on('insert', (oldLink, newLink) => Owning._queue.remove(newLink));
  Rules.graph.removed.on('update', (oldLink, newLink) => Owning._queue.remove(newLink));
}

if (Meteor.isServer) Meteor.publish('rules', function() {
  this.autorun(function (computation) {
    var query = { removed: { $exists: false } };
    if (this.userId) {
      query.$or = [
        { $or: Users.findOne(this.userId).mapJoining((join) => { return { __fetchable: join }}) },
        { __draft: refs.generate(Users._ref, this.userId) }
      ]
    };
    return Rules.find(query);
  });
});

if (Meteor.isClient) Meteor.subscribe('rules');

if (Meteor.isServer) {
  attachDraftField(Rules);
}

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
      isAllowed(['editing'], refs.generate(Users._ref, userId), doc.ref())
    );
  },
  remove(userId, doc) {
    return isAllowed(['editing'], refs.generate(Users._ref, userId), doc.ref());
  }
});

if (Meteor.isServer) {
  Meteor.startup(function () {
    Rules.find({ $and: [{ launched: { $ne: 'unspread'}}, { launched: 'spread' }] }).observe({added(rule) {
      Rules._queue.spread(Rules.graph._generateLink(rule));
    }});
    Rules.find({ launched: 'unspread' }).observe({ added(rule) {
      Rules._queue.unspread(Rules.graph._generateLink(rule));
    } });
    Rules.find({ launched: 'breakpoints' }).forEach((rule) => {
      Rules._queue.breakpoints(rule, rule.breakpoints);
    });
    Rules.find({ launched: 'retype' }).observe({ added(rule) {
      Rules._queue.retype(Rules.graph._generateLink(rule));
    } });
    Rules.find({}).observe({
      changed(newRule, oldRule) {
        var difference = lodash.difference(newRule.breakpoints, oldRule.breakpoints);
        difference.push.apply(difference, lodash.difference(oldRule.breakpoints, newRule.breakpoints));
        Rules._queue.breakpoints(newRule, difference);
      }
    });
  });
}

if (Meteor.isServer) {
  attachGraphSpreadingSpreader(Rules);
  Rules.before.insert((userId, rule) => {
    if (!rule.rightsTypes) rule.rightsTypes = ['fetching'];
  });
}