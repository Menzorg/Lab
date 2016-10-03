import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import React from 'react';
import { render } from 'react-dom';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import Bar from './bar';
import SidebarProfile from './sidebars/profile';
import SidebarNavigation from './sidebars/navigation';

class MainComponent extends React.Component {
  getChildContext() {
    return {
      user: this.props.user,
      userId: this.props.userId
    };
  }
  render() {
    return (
      <MuiThemeProvider>
        <SidebarProfile ref="sidebarProfile">
          <SidebarNavigation ref="sidebarNavigation">
            <span onTouchTap={() => {
              this.refs.sidebarProfile.handleOuterClick();
              this.refs.sidebarNavigation.handleOuterClick();
            }}>
              <Bar
                ref="bar"
                onTouchLeft={() => {
                  this.refs.sidebarNavigation.toggleOpen();
                }}
                onTouchRight={() => {
                  this.refs.sidebarProfile.toggleOpen();
                }}
              />
            </span>
          </SidebarNavigation>
        </SidebarProfile>
      </MuiThemeProvider>
    );
  }
}

MainComponent.childContextTypes = {
  user: React.PropTypes.any,
  userId: React.PropTypes.any
};

var MainContainer = createContainer(() => {
  var subscription = Meteor.subscribe('users', { _id: Meteor.userId() });
  return {
    __userReady: subscription.ready(),
    userId: Meteor.userId(),
    user: Meteor.user()
  }
}, MainComponent);

Meteor.startup(() => {
  render(<MainContainer/>, document.getElementById('react'));
});