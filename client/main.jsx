import { Meteor } from 'meteor/meteor';
import React from 'react';
import { render } from 'react-dom';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import Bar from './bar';
import SidebarProfile from './sidebars/profile';
import SidebarNavigation from './sidebars/navigation';

class Env extends React.Component {
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

Meteor.startup(() => {
  render(<Env/>, document.getElementById('react'));
});