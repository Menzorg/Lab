import lodash from 'lodash';
import React from 'react';
import { findDOMNode } from 'react-dom';

import { List, ListItem } from 'material-ui/List';
import RaisedButton from 'material-ui/RaisedButton';
import EnhancedButton from 'material-ui/internal/EnhancedButton';
import Paper from 'material-ui/Paper';
import { Router, Route, Link, browserHistory } from 'react-router'

import Documents from './documents';
import Document from './document';
import { Drag, Drop } from './dnd';
 
import Recursion from './recursion';

/**
 * Unibersal symbol of any document or ref in document field.
 * Two stages: !_subscription && !!_subscription.
 * Can be labled.
 * Reaction can be revrited.
 */
class Badge extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      droppable: false,
      disabled: false,
      droppable: false
    };
  }
  render() {
    var badge, label;
    var { _subscription, document, field, style } = this.props;
    
    if (_subscription && document) {
      label = <span>
        {document?document.ref():null}
        {field?<small>{field}</small>:null}
      </span>;
      
      badge = (
        <Drop
          onDragStart={(drag) => {
            this.setState({ droppable: true });
          }}
          onDragStop={() => {
            this.setState({ droppable: false });
          }}
          onDrop={(drag) => {
            if (this.props.onDrop) {
              this.props.onDrop(drag);
            }
          }}
        >
          <Drag
            ref="drag"
            document={document}
            onDrag={() => {
              this.refs.dragButton.setState({ zDepth: 5 })
            }}
            component={
              <RaisedButton
                ref="dragButton"
                label={label}
                labelStyle={{ textTransform: 'none' }}
              />
            }
          >
            <RaisedButton
              ref="originButton"
              label={label}
              labelStyle={{ textTransform: 'none' }}
              disabled={this.state.disabled?true:!!document}
              onTouchTap={() => { browserHistory.push('/'+document.ref()); }}
              style={style}
            />
          </Drag>
        </Drop>
      );
      
      return badge;
    } else {
      return null;
    }
  }
}

Badge.propTypes = {
  _subscription: React.PropTypes.any,
  collection: React.PropTypes.any,
  document: React.PropTypes.any,
  field: React.PropTypes.string,
  style: React.PropTypes.object,
};

export { Badge };