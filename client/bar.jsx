import React from 'react';

import colors from 'material-ui/styles/colors';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';

import Menu from 'material-ui/svg-icons/navigation/menu';
import PermIdentity from 'material-ui/svg-icons/action/perm-identity';

export default class extends React.Component {
  render() {
    return (
      <AppBar
        style={{ backgroundColor: colors.white }}
        iconElementLeft={
          <IconButton onTouchTap={this.props.onTouchLeft}>
            <Menu color={colors.black}/>
          </IconButton>
        }
        iconElementRight={
          <IconButton onTouchTap={this.props.onTouchRight}>
            <PermIdentity color={colors.black}/>
          </IconButton>
        }
      />
    );
  }
}