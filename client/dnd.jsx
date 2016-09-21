import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';

var Drag = DragSource('dnd', {
  beginDrag(props) {
    return props;
  },
  endDrag(props, monitor, component) {
    var drag = props;
    var drop =  monitor.getDropResult();
    if (drop) {
      if (drop.action == 'authorization') {
        if (drag.collection == Users) {
          Users.update({ login: { $exists: true } }, { $unset: { login: "" }}, () => {
            Users.update({ _id: drag.document._id }, { $set: { login: true }});
          });
        }
      } else if (drop.collection && drop.document) {
        if (drop.field) {
          switch (drag.action) {
            case 'nest':
              drop.collection.graph.update(drop.document._id, {
                [drop.field]: drag.document._id
              });
              break;
          }
        } else {
          switch (drag.action) {
            case 'nest':
              Nesting.graph.insert({ source: drop.document._id, target: drag.document._id });
              break;
            case 'insert':
              switch (drag.collection) {
                case Items:
                  Nesting.graph.insert({ source: drop.document._id, target: Items.insert({}) });
                  break;
                case Allower:
                  Nesting.graph.insert({ source: drop.document._id, target: Allower.insert({}) });
                  break;
              }
              break;
          }
        }
      }
    }
  }
}, function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
})(class extends React.Component {
  render() {
    const { connectDragSource } = this.props;
    return (
      connectDragSource(
        <span style={{
          cursor: 'move'
        }}>
          {this.props.children}
        </span>
      )
    );
  }
});

var Drop = DropTarget('dnd', {
  drop(props) {
    return props;
  }
}, function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  };
})(class extends React.Component {
  render() {
    const { canDrop, isOver, connectDropTarget } = this.props;
    const isActive = canDrop && isOver;
    
    return (
      connectDropTarget(
        <span style={{
          border: isActive?'dotted 1px black':'solid 1px transparent'
        }}>
          {this.props.children}
        </span>
      )
    );
  }
});

export { Drag, Drop };