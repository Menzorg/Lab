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

import AppBar from 'material-ui/AppBar';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import FlatButton from 'material-ui/FlatButton';
import {RadioButton, RadioButtonGroup} from 'material-ui/RadioButton';

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
  constructor() {
    super();
    this.state = { ancientGraphForLinking: 'owning' };
  }
  getChildContext() {
    return {
      ancientGraphForLinking: this.state.ancientGraphForLinking
    };
  }
  render() {
    var style;
    return (<MuiThemeProvider>
      <div>
        <div>
          <AppBar
            style={{ backgroundColor: colors.white }}
            iconElementLeft={<span></span>}
            iconStyleLeft={{ color: colors.grey900 }}
            title={<div style={{ fontSize: '0.7em', paddingTop: '20px' }}>
              <RadioButtonGroup 
                name="shipSpeed"
                defaultSelected={this.state.ancientGraphForLinking}
                onChange={(event, value) => {
                  this.setState({ ancientGraphForLinking: value })
                }}
              >
                <RadioButton
                  value="owning"
                  label="Owning"
                  style={{ float: "left", width: "auto", margin: '0 12px' }}
                />
                <RadioButton
                  value="joining"
                  label="Joining"
                  style={{ float: "left", width: "auto", margin: '0 12px' }}
                />
                <RadioButton
                  value="commenting"
                  label="Commenting"
                  disabled={true}
                  style={{ float: "left", width: "auto", margin: '0 12px' }}
                />
                <RadioButton
                  value="aliasing"
                  label="Aliasing"
                  disabled={true}
                  style={{ float: "left", width: "auto", margin: '0 12px' }}
                />
              </RadioButtonGroup>
            </div>}
            iconClassNameRight="muidocs-icon-navigation-expand-more"
          />
          <Drag action="insert" collection={Items}>
            <button
              style={{
                backgroundColor: Items.color, color: 'white',
                marginLeft: 0
              }}
            >+item</button>
          </Drag>
          <Drag action="insert" collection={Rules}>
            <button
              style={{
                backgroundColor: Rules.color, color: 'white',
                marginLeft: 0
              }}
            >+rule</button>
          </Drag>
          <Authorization/>
        </div>
        
        <div>
          <br/>
          <span style={{ fontSize: '0.75em' }}>(Users)</span>
          <Documents collection={Users} query={{}}/>
          <br/><br/>
          <span style={{ fontSize: '0.75em' }}>(Owning)</span>
          <Documents collection={Owning} query={{}} recursion={true}/>
          <br/><br/>
          <span style={{ fontSize: '0.75em' }}>(Items)</span>
          <Documents collection={Items} query={{}} recursion={true}/>
        </div>
      </div>
    </MuiThemeProvider>);
  }
}

Page.childContextTypes = {
  ancientGraphForLinking: React.PropTypes.any
};

var _Page = DragDropContext(HTML5Backend)(Page);

Meteor.startup(() => {
  render(<_Page/>, document.getElementById('react'));
});