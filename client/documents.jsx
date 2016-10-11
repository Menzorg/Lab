import lodash from 'lodash';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';

class _Documents extends React.Component {
  constructor(props) {
    super(props);
  }
  componentWillUnmount() {
    this.props.subscription.stop();
  }
  render() {
    var { component: Component, documents } = this.props;
    
    return <span>
      {documents.map((document) => {
        return <Component key={document._id} {...this.props} document={document}>
          {this.props.children}
        </Component>;
      })}
    </span>;
  }
}

var Documents = createContainer((props) => {
  var subscription, _subscription, query, options, collection, documents;
  
  query = props.query||{};
  options = props.options||{};
  
  if (typeof(props.collection) == 'string') {
    collection = Shuttler.collection(props.collection);
  } else if(props.collection instanceof Meteor.Collection) {
    collection = props.collection;
  }
  
  if (collection) {
    if (props.subscription) subscription = props.subscription;
    else if (props.publication) subscription = Meteor.subscribe(props.publication, query, options);
    else subscription = Meteor.subscribe(collection._ref, query, options);
    
    _subscription = subscription.ready();
    
    documents = collection.find(query, options).fetch();
  } else {
    documents = [];
  }
  
  return {
    ...props,
    subscription, _subscription, collection,
    query, options,
    documents
  };
}, _Documents);

export default Documents;