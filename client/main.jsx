import { Meteor } from 'meteor/meteor';
import React from 'react';
import { render } from 'react-dom';

import { createContainer } from 'meteor/react-meteor-data';
import injectTapEventPlugin from 'react-tap-event-plugin';
import colors from 'material-ui/styles/colors';

import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { DragSource, DropTarget } from 'react-dnd';

import { GraphSpreading, QueueSpreading as AncientQueueSpreading } from 'ancient-graph-spreading';
import { factoryExistedGraph, factoryNonExistedGraph } from 'ancient-graph-removed';

import { Documents, Document } from './documents';
import { Drag, Drop } from './dnd';

injectTapEventPlugin();

var Authorization = createContainer(() => {
  return {
    user: Meteor.user()
  };
}, class extends React.Component {
  render() {
    return (<Drop action="authorization">
      <span>{!this.props.user?
        <span>users/
          <span style={{ color: colors.red700 }}>?</span>
        </span>:
        <span>
          {this.props.user.ref()}
          <span
            style={{
              color: colors.red700,
              cursor: 'pointer'
            }}
            onClick={() => {
              Meteor.logout();
            }}
          > ✗ </span>
        </span>
      }
      </span>
    </Drop>);
  }
});

class Page extends React.Component {
  render() {
    return (
      <div>
        <div>
          <Drag action="insert" collection={Items}>
            <button
              style={{
                backgroundColor: Items.color, color: 'white',
                marginLeft: 0
              }}
            >+item</button>
          </Drag>
          <Drag action="insert" collection={Allower}>
            <button
              style={{
                backgroundColor: Allower.color, color: 'white',
                marginLeft: 0
              }}
            >+allower</button>
          </Drag>
          <Authorization/>
        </div>
        <div>
          <br/>
          <span style={{ fontSize: '0.75em' }}>(Users)</span>
          <Documents collection={Users} query={{}}/>
          <br/><br/>
          <span style={{ fontSize: '0.75em' }}>(Nesting)</span>
          <Documents collection={Nesting} query={{}} recursion={true}/>
          <br/><br/>
          <span style={{ fontSize: '0.75em' }}>(Items)</span>
          <Documents collection={Items} query={{}} recursion={true}/>
        </div>
      </div>
    );
  }
}

var _Page = DragDropContext(HTML5Backend)(Page);

Meteor.startup(() => {
  render(<_Page/>, document.getElementById('react'));
});