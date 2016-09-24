import React from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import ReactTooltip from 'react-tooltip'
import { getCollection } from '../imports/getCollection';

class Right extends React.Component {
  render() {
    var
      style = {
        color: this.props.collection.color,
        cursor: 'pointer'
      }
    ;
    return <span>
      <span style={style} data-tip data-for={this.props.document._id+'/tooltip'}>
        {this.props.document.spreader.split('/')[1]}
      </span>
      <ReactTooltip id={this.props.document._id+'/tooltip'}>
        Right <span style={{ color: getCollection(this.props.document.ref()).color }}>{this.props.document.ref()}</span> spreaded from <span style={{ color: getCollection(this.props.document.spreader).color }}>{this.props.document.spreader}</span>
      </ReactTooltip>
    </span>;
  }
}

class _Rights extends React.Component {
  render() {
    return (<span style={{
      fontSize: '0.75em'
    }}>
      {this.props.allow.map((document) => {
        return (<span key={document._id}>
          <Right collection={Allow} document={document}/>&nbsp;
        </span>);
      })}
    </span>);
  }
}

var Rights = createContainer(({ target }) => {
  return {
    allow: Allow.find({ removed: { $exists: false }, target: target }).fetch()
  };
}, _Rights);

export { Rights, Right };