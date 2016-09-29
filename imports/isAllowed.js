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
  if (typeof(types) == 'string') types = [types];
  if (!allRequired) {
    var value = lodash.map(types, (type) => { return { rightsTypes: type }; });
  } else {
    var value = { $all: types };
  }
  if (!sourceId && Meteor.userId()) sourceId = Meteor.user().ref();
  var result, storage;
  if (!sourceId || !targetId) return false;
  storage = refs.storage(sourceId);
  if (storage == Users && sourceId == targetId) result = true;
  else {
    result = !!Rights.findOne({ removed: { $exists: false }, source: sourceId, target: targetId, [!allRequired?'$or':'rightsTypes']: value });
  }
  return result;
};

export { isAllowed };