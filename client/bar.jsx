import React from 'react';

import colors from 'material-ui/styles/colors';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import FlatButton from 'material-ui/FlatButton';

import Menu from 'material-ui/svg-icons/navigation/menu';
import Person from 'material-ui/svg-icons/social/person';
import PersonOutline from 'material-ui/svg-icons/social/person-outline';

class Bar extends React.Component {
  render() {
    return (
      <AppBar
        style={{ backgroundColor: colors.white }}
        title={
          <div style={{ float: 'right' }}>
            {this.context.user&&this.context.user.loginStateSignedUp?
              <FlatButton
                onTouchTap={this.props.onTouchRight}
                style={{
                  width: 'auto', padding: '0 16px',
                  fontSize: '0.8em'
                }}
                labelStyle={{
                  marginRight: 16
                }}
                icon={<Person color={colors.black}/>}
              >
                {this.context.user.username}
              </FlatButton>
              :undefined
            }
          </div>
        }
        iconElementRight={
          this.context.user&&this.context.user.loginStateSignedUp?undefined:
          <IconButton onTouchTap={this.props.onTouchRight}>
            <PersonOutline color={colors.black}/>
          </IconButton>
        }
        iconElementLeft={
          <IconButton onTouchTap={this.props.onTouchLeft}>
            <Menu color={colors.black}/>
          </IconButton>
        }
      />
    );
  }
}

Bar.contextTypes = {
  user: React.PropTypes.any
};

export default Bar;