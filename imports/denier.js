import { Meteor } from 'meteor/meteor';
import colors from 'material-ui/styles/colors';

Denier = new Meteor.Collection(null, { ref: 'denier' });

Denier.counter = 0;

Denier.before.insert(function (userId, doc) {
  doc._id = 'denier/'+Denier.counter;
  Denier.counter++;
});