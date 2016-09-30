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
  var value;
  if (typeof(types) == 'string') types = [types];
  if (!sourceId && Meteor.userId()) sourceId = Meteor.user().ref();
  if (!sourceId || !targetId) return false;
  if (refs.storage(sourceId) == Users && sourceId == targetId) return true;
  else {
    if (refs.storage(targetId).findOne({ _id: refs.id(targetId), __draft: sourceId })) return true;
    else {
      if (!allRequired) {
        value = lodash.map(types, (type) => { return { rightsTypes: type }; });
      } else {
        value = { $all: types };
      }
      return !!Rights.findOne({ removed: { $exists: false }, source: sourceId, target: targetId, [!allRequired?'$or':'rightsTypes']: value });
    }
  }
};

export { isAllowed };