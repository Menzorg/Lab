import React from 'react';

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
  componentWillUnmount() {
    if (this.props.onDragStart) {
      this.context.dnd.unsubscribeDragStart(this.props.onDragStart);
    }
    if (this.props.onDragStop) {
      this.context.dnd.unsubscribeDragStop(this.props.onDragStop);
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

export default Drop;