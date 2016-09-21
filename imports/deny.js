import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

Deny = new Meteor.Collection(null, { ref: 'deny' });

Deny.counter = 0;

Deny.before.insert(function (userId, doc) {
  doc._id = 'deny/'+Deny.counter;
  Deny.counter++;
});