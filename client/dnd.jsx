import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';

import { refs } from '../imports/refs';

class _Drag extends React.Component {
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
}

_Drag.contextTypes = {
  ancientGraphForLinking: React.PropTypes.any
};

var Drag = DragSource('dnd', {
  beginDrag(props) {
    return props;
  },
  endDrag(props, monitor, component) {
    var drag = props;
    var drop =  monitor.getDropResult();
    var GraphForLinking = Shuttler.collection(component.context.ancientGraphForLinking);
    if (GraphForLinking) {
      if (drop) {
        if (drop.action == 'authorization') {
          if (drag.collection == Users) {
            Meteor.loginWithPassword(drag.document.username, drag.document.username);
          }
        } else if (drop.action == 'addToSet') {
          drop.collection.update(drop.document._id, {
            $addToSet: { [drop.field]: refs.generate(drag.collection._ref, drag.document._id) }
          });
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
                GraphForLinking.insert({ source: drop.document.ref(), target: drag.document.ref() });
                break;
              case 'insert':
                switch (drag.collection) {
                  case Items:
                    GraphForLinking.insert({ source: drop.document.ref(), target: refs.generate(Items._ref, Items.insert({})) });
                    break;
                  case Rules:
                    GraphForLinking.insert({ source: drop.document.ref(), target: refs.generate(Rules._ref, Rules.insert({
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
  }
}, function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
})(_Drag);

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