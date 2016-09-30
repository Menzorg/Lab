import React from 'react';
import Popover from 'material-ui/Popover';
import {List, ListItem} from 'material-ui/List';

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
      <span>
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
          {this.props.rules}
           <List>
            <ListItem primaryText="All mail" />
            <ListItem primaryText="Trash" />
            <ListItem primaryText="Spam" />
            <ListItem primaryText="Follow up" />
          </List>
        </Popover>
      </span>
    );
  }
}

export { RulePopover };