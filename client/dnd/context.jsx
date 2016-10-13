import React from 'react';
import lodash from 'lodash';

/**
 * It manages one dragging element.
 */
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
  unsubscribeDragStart(handler) {
    if (typeof(handler) == 'function') {
      var handlersDragStart = this.state.handlersDragStart;
      lodash.remove(handlersDragStart, (_handler) => { return _handler == handler; });
      this.setState({ handlersDragStart });
    }
  }
  unsubscribeDragStop(handler) {
    if (typeof(handler) == 'function') {
      var handlersDragStop = this.state.handlersDragStop;
      lodash.remove(handlersDragStop, (_handler) => { return _handler == handler; });
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

export default Context;