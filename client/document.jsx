import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';

import lodash from 'lodash';
import { refs } from '../imports/refs';

class _Document extends React.Component {
  constructor(props) {
    super(props);
  }
  componentWillUnmount() {
    this.props.subscription.stop();
  }
  render() {
    var { component: Component, document } = this.props;
    
    return <Component {...this.props}>
      {this.props.children}
    </Component>;
  }
}

var Document = createContainer((props) => {
  var subscription, _subscription, query, options, collection, document;
  
  query = props.query||{};
  options = props.options||{};
  
  if (props.refId) {
    query = { _id: refs.id(props.refId) };
  }
  
  if (typeof(props.collection) == 'string') {
    collection = Shuttler.collection(props.collection);
  } else if(props.collection instanceof Meteor.Collection) {
    collection = props.collection;
  } else if(props.refId) {
    collection = refs.collection(props.refId);
  }
  
  if (collection) {
    if (props.subscription) subscription = props.subscription;
    else if (props.publication) subscription = Meteor.subscribe(props.publication, query);
    else subscription = Meteor.subscribe(collection._ref, query);
    
    _subscription = subscription.ready();
    
    document = collection.findOne(query);
  } else {
    document = [];
  }
  
  return {
    ...props,
    subscription, _subscription, collection,
    query, options,
    document
  };
}, _Document);

export default Document;