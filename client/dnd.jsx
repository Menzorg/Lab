import React from 'react';
import { findDOMNode } from 'react-dom';

import { DraggableCore } from 'react-draggable';

class Context extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      drag: null,
      lastDrag: null,
      position: null,
      event: null,
      dropped: null,
      handlersDragStart: [],
      handlersDragStop: []
    }
  }
  getChildContext() {
    return {
      dnd: this
    };
  }
  setDrag(drag) {
    var state = { drag };
    if (drag) state.lastDrag = drag;
    this.setState(state);
    if (!this.state.drag&&drag) {
      this.handleDragStart(drag);
    } else {
      this.handleDragStop();
    }
  }
  handleDragStart(drag) {
    for (var s in this.state.handlersDragStart) {
      this.state.handlersDragStart[s](drag);
    }
  }
  handleDragStop() {
    for (var s in this.state.handlersDragStop) {
      this.state.handlersDragStop[s]();
    }
  }
  subscribeDragStart(handler) {
    if (typeof(handler) == 'function') {
      var handlersDragStart = this.state.handlersDragStart;
      handlersDragStart.push(handler);
      this.setState({ handlersDragStart });
    }
  }
  subscribeDragStop(handler) {
    if (typeof(handler) == 'function') {
      var handlersDragStop = this.state.handlersDragStop;
      handlersDragStop.push(handler);
      this.setState({ handlersDragStop });
    }
  }
  setPosition(position) {
    this.setState({ position });
  }
  setDropped(drag) {
    this.setState({
      dropped: drag
    });
  }
  onMouseMove() {
    this.setDropped();
  }
  render() {
    return (
      <span onMouseMove={!this.state.drag&&this.state.dropped?((...args) => this.onMouseMove(...args)):null}>
        {this.props.children}
        {this.state.position&&this.state.drag?
          <div style={{
            zIndex: 999999,
            position: 'absolute',
            left: this.state.position.left, top: this.state.position.top,
            pointerEvents: 'none'
          }}>
            {this.state.drag.props.component}
          </div>
        :null}
      </span>
    );
  }
}

Context.childContextTypes = {
  dnd: React.PropTypes.any
};

class Drag extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      draggable: false,
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
        startDiff: {
          left: event.clientX - startRect.left,
          top: event.clientY - startRect.top
        }
      });
    }
    
    this.props.onDragStart(...arguments);
  }
  onDrag(event, coreData) {
    this.setState({
      draggable: true
    });
    this.context.dnd.setPosition({
      left: event.clientX - this.state.startDiff.left,
      top: event.clientY - this.state.startDiff.top
    });
    
    this.props.onDrag(...arguments);
  }
  onDragStop(event, coreData) {
    this.setState({
      draggable: false
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
        {React.cloneElement(React.Children.only(this.props.children), {
          disabled: this.state.draggable
        })}
      </DraggableCore>
    );
  }
}

Drag.defaultProps = {
  onDragStart: () => {},
  onDrag: () => {},
  onDragStop: () => {}
};

Drag.propTypes = {
  onDragStart: React.PropTypes.func,
  onDrag: React.PropTypes.func,
  onDragStop: React.PropTypes.func,
  document: React.PropTypes.object.isRequired,
  component: React.PropTypes.element,
};

Drag.contextTypes = {
  dnd: React.PropTypes.any
};

class Drop extends React.Component {
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    if (this.props.onDragStart) {
      this.context.dnd.subscribeDragStart(this.props.onDragStart);
    }
    if (this.props.onDragStop) {
      this.context.dnd.subscribeDragStop(this.props.onDragStop);
    }
  }
  onMouseUp(event) {
    var lastDrag = this.context.dnd.state.lastDrag;
    this.context.dnd.setDropped()
    this.onDrop(event, lastDrag);
  }
  onMouseMove(event) {
    var dropped = this.context.dnd.state.dropped;
    this.context.dnd.setDropped()
    this.onDrop(event, dropped);
  }
  onDrop(event, dropped) {
    if (this.props.onDrop) {
      this.props.onDrop(event, dropped);
    }
  }
  render() {
    return <span
      onMouseUp={(...args) => this.onMouseUp(...args)}
    >
      {this.props.children}
    </span>;
  }
}

Drop.propTypes = {
  onDragStart: React.PropTypes.func,
  onDragStop: React.PropTypes.func,
  onDrop: React.PropTypes.func
};

Drop.contextTypes = {
  dnd: React.PropTypes.any
};

export { Context, Drag, Drop };