import React from 'react';

import RaisedButton from 'material-ui/RaisedButton';

import { Form } from 'formsy-react';
import { FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup, 
  FormsySelect, FormsyText, FormsyTime, FormsyToggle } from 'formsy-material-ui/lib';

class Logout extends React.Component {
  render() {
    return (
      <RaisedButton label="logout" fullWidth={true} onTouchTap={() => Meteor.logout()}/>
    );
  }
};

export default Logout;