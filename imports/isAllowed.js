import { refs } from './refs';

/**
 * Check right to object target for subject source.
 * 
 * @param {String} [sourceId=Meteor.user().ref()]
 * @param {String} targetId
 * @return {Boolean}
 */
function isAllowed(sourceId, targetId, callback) {
  if (!sourceId && Meteor.userId()) sourceId = Meteor.user().ref();
  var result, storage;
  if (!sourceId || !targetId) return false;
  storage = refs.storage(sourceId);
  if (storage == Users && sourceId == targetId) result = true;
  else {
    result = !!Rights.findOne({ removed: { $exists: false }, source: sourceId, target: targetId });
  }
  if (callback) callback(result);
  return result;
};

export { isAllowed };