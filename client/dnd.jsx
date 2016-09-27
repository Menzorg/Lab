import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';

import { refs } from '../imports/refs';

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
          Meteor.loginWithPassword(drag.document.username, drag.document.username);
        }
      } else if (drop.collection && drop.document) {
        if (drop.field) {
          switch (drag.action) {
            case 'nest':
              drop.collection.update(drop.document._id, {
                $set: { [drop.field]: drag.document.ref() }
              });
              break;
          }
        } else {
          switch (drag.action) {
            case 'nest':
              Nesting.insert({ source: drop.document.ref(), target: drag.document.ref() });
              break;
            case 'insert':
              switch (drag.collection) {
                case Items:
                  Nesting.insert({ source: drop.document.ref(), target: refs.generate(Items._ref, Items.insert({})) });
                  break;
                case Rules:
                  Nesting.insert({ source: drop.document.ref(), target: refs.generate(Rules._ref, Rules.insert({
                    guarantor: drop.document.ref(),
                    source: drop.document.ref(),
                    target: drop.document.ref()
                  })) });
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