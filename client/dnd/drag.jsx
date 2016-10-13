import React from 'react';
import { findDOMNode } from 'react-dom';

import { DraggableCore } from 'react-draggable';

class Drag extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      dragging: false,
      startPosition: null,
      startDiff: null
    };
  }
  onDragStart(event, coreData) {
    var element, rects, startRect;
    
    this.context.dnd.setDrag(this);
    element = findDOMNode(this);
    rects = element.getClientRects();
    if (rects.length) {
      startRect = rects[0];
      this.setState({
        startPosition: startRect,
        startDiff: {
          left: event.clientX - startRect.left,
          top: event.clientY - startRect.top
        }
      });
    }
  }
  onDrag(event, coreData) {
    var position = {
      left: event.clientX - this.state.startDiff.left,
      top: event.clientY - this.state.startDiff.top
    };
    
    if (
      this.state.dragging ||
      (
        position.top > this.state.startPosition.top + this.props.startDistance ||
        position.top < this.state.startPosition.top - this.props.startDistance ||
        position.right > this.state.startPosition.right + this.props.startDistance ||
        position.right < this.state.startPosition.right - this.props.startDistance
      )
    ) {
      this.context.dnd.setPosition(position);
      
      if (!this.state.dragging) {
        this.setState({
          dragging: true
        });
        
        this.props.onDragStart(...arguments);
      }
      this.props.onDrag(...arguments);
    }
  }
  onDragStop(event, coreData) {
    this.setState({
      dragging: false
    });
    
    if (!this.props.onDragStop(...arguments)) {
      this.unset();
    }
  }
  unset() {
    this.context.dnd.setDropped();
    this.context.dnd.setDrag();
    this.context.dnd.setPosition();
  }
  render() {
    return (
      <DraggableCore
        ref="draggable"
        {...this.props}
        onStart={(...args) => this.onDragStart(...args)}
        onDrag={(...args) => this.onDrag(...args)}
        onStop={() => this.onDragStop()}
      >
        {this.props.children}
      </DraggableCore>
    );
  }
}

Drag.defaultProps = {
  onDragStart: () => {},
  onDrag: () => {},
  onDragStop: () => {},
  startDistance: 3
};

Drag.propTypes = {
  onDragStart: React.PropTypes.func,
  onDrag: React.PropTypes.func,
  onDragStop: React.PropTypes.func,
  document: React.PropTypes.object.isRequired,
  component: React.PropTypes.element,
  startDistance: React.PropTypes.number
};

Drag.contextTypes = {
  dnd: React.PropTypes.any
};

export default Drag;