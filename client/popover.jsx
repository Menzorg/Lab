import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';

class RulePopover extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      open: false,
    };
  
    this.handleTouchTap = (event) => {
      // This prevents ghost click.
      event.preventDefault();
  
      this.setState({
        open: true,
        anchorEl: event.currentTarget,
      });
    };
  
    this.handleRequestClose = () => {
      this.setState({
        open: false,
      });
    };
  }

  render() {
    return (
      <div>
        <span onTouchTap={this.handleTouchTap}>
          {this.props.children}
        </span>
        <Popover
          open={this.state.open}
          anchorEl={this.state.anchorEl}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this.handleRequestClose}
        >
          <Menu>
            <MenuItem primaryText="Refresh" />
            <MenuItem primaryText="Help &amp; feedback" />
            <MenuItem primaryText="Settings" />
            <MenuItem primaryText="Sign out" />
          </Menu>
        </Popover>
      </div>
    );
  }
}

export { RulePopover };