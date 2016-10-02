import lodash from 'lodash';

import { refs } from './refs';

/**
 * Check right to object target for subject source.
 * 
 * @param {String|String[]} types
 * @param {String} [sourceId=Meteor.user().ref()]
 * @param {String} targetId
 * @param {Boolean} [allRequired=false]
 * @return {Boolean}
 */
function isAllowed(types, sourceId, targetId, allRequired) {
  var value, $subjects;
  if (typeof(types) == 'string') types = [types];
  if (!sourceId && Meteor.userId()) sourceId = Meteor.user().ref();
  if (!sourceId || !targetId) return false;
  if (refs.storage(targetId).findOne({ _id: refs.id(targetId), __draft: sourceId })) return true;
  else {
    $subjects = refs.get(sourceId).mapJoining((join) => { return { source: join }});
    
    if (!allRequired) {
      value = lodash.map(types, (type) => { return { rightsTypes: type }; });
    } else {
      value = { $all: types };
    }
    return !!Rights.findOne({ removed: { $exists: false }, target: targetId, $and: [{ $or: $subjects }, {[!allRequired?'$or':'rightsTypes']: value }] });
  }
};

export { isAllowed };