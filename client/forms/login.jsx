import React from 'react';

import RaisedButton from 'material-ui/RaisedButton';

import { Form } from 'formsy-react';
import { FormsyCheckbox, FormsyDate, FormsyRadio, FormsyRadioGroup, 
  FormsySelect, FormsyText, FormsyTime, FormsyToggle } from 'formsy-material-ui/lib';

class Login extends React.Component {
  constructor() {
    super();
    this.state = {
      disabled: false,
      errors: {}
    };
  }
  enable() {
    this.setState({
      disabled: false
    });
  }
  disable() {
    this.setState({
      disabled: true
    });
  }
  submit(form) {
    Meteor.loginWithPassword(form.email, form.password, (error) => {
      var setState = {
        errors: {}
      };
      
      if (error) {
        if (error.reason == 'User not found') {
          setState.errors.email = error.reason;
        } else if (error.reason == 'Incorrect password') {
          setState.errors.password = error.reason;
        }
      }
      
      this.setState(setState);
    });
  }
  render() {
    return (
      <Form
        onValidSubmit={(...args) => this.submit(...args)}
        onValid={() => this.enable()} onInvalid={() => this.disable()}
        validationErrors={this.state.errors}
        onChange={() => this.setState({ errors: {} })}
      >
        <FormsyText
          placeholder="email" name="email" required
          style={{ width: '100%' }}
          validations="isEmail" validationError="Must be email"
        />
        <FormsyText
          placeholder="password" name="password" required
          style={{ width: '100%' }}
        />
        <RaisedButton label="login" fullWidth={true} disabled={this.state.disabled} type="submit"/>
        <RaisedButton label="create" fullWidth={true}/>
      </Form>
    );
  }
};

export default Login;