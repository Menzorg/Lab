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
 * Reaction can be revrited.
 */
class Badge extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      dragging: false
    };
  }
  zDepthApply(zDepth) {
    this.refs.originBadge.setState({ zDepth });
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.zDepth) {
      this.zDepthApply(nextProps.zDepth);
    }
  }
  render() {
    var badge, label;
    var { _subscription, document } = this.props;
    
    var buttonProps = () => {
      var {
        backgroundColor, buttonStype, className,
        disabledBackgroundColor, disabledLabelColor,
        fullWidth, href, icon, label, labelColor,
        labelPosition, labelStyle, primary, rippleStyle, secondary, style,
      } = this.props;
      return {
        backgroundColor, buttonStype, className,
        disabledBackgroundColor, disabledLabelColor,
        fullWidth, href, icon, label, labelColor,
        labelPosition, labelStyle, primary, rippleStyle, secondary, style,
      };
    }
    
    if (document) {
      label = <span>
        {document?document.ref():null}
      </span>;
      badge = (
        <Drag
          ref="drag"
          document={document}
          onDrag={() => {
            this.setState({ dragging: true });
            this.refs.dragBadge.setState({ zDepth: 5 });
          }}
          onDragStop={() => this.setState({ dragging: false })}
          component={
            <RaisedButton
              ref="dragBadge"
              label={document.ref()}
              labelStyle={{ textTransform: 'none' }}
              {...buttonProps}
            >{this.props.children}</RaisedButton>
          }
        >
          <RaisedButton
            onTouchTap={() => browserHistory.push('/'+document.ref())}
            ref="originBadge"
            label={document.ref()}
            disabled={this.props.disabled||this.state.dragging}
            labelStyle={{ textTransform: 'none' }}
            {...buttonProps}
          >{this.props.children}</RaisedButton>
        </Drag>
      );
    } else {
      return null;
    }
    
    return badge;
  }
}

Badge.propTypes = {
  onDragStart: React.PropTypes.func,
  onDragStart: React.PropTypes.func,
  onDrag: React.PropTypes.func,
  document: React.PropTypes.any,
  disabled: React.PropTypes.bool
};

export { Badge };