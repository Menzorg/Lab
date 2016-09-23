import { Meteor } from 'meteor/meteor';
import React from 'react';
import { render } from 'react-dom';

import { createContainer } from 'meteor/react-meteor-data';
import injectTapEventPlugin from 'react-tap-event-plugin';
import colors from 'material-ui/styles/colors';

import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { DragSource, DropTarget } from 'react-dnd';

import { GraphSpreading, QueueSpreading as AncientQueueSpreading } from 'ancient-graph-spreading';
import { factoryExistedGraph, factoryNonExistedGraph } from 'ancient-graph-removed';

import { Documents, Document } from './documents';
import { Drag, Drop } from './dnd';

removeAncientItem = function(item) {
  if (!item.launched || !item.launched.length) {
    Nesting.graph.remove({ target: item.id });
    Nesting.graph.remove({ source: item.id });
  }
};

import '../imports/users';
import '../imports/items';
import '../imports/nesting';
import '../imports/allow';
import '../imports/allower';

var u0 = Users.insert({});
var u1 = Users.insert({});
var u2 = Users.insert({});

var i0 = Items.insert({});
var i1 = Items.insert({});

var n0 = Nesting.insert({ source: u0, target: i0 });
var n1 = Nesting.insert({ source: u0, target: i1 });

injectTapEventPlugin();

// var Authorization = createContainer(() => {
//   return {
//     user: Users.findOne({ login: { $exists: true }}),
//   };
// }, class extends React.Component {
//   render() {
//     return (<Drop action="authorization">
//       <span>{!this.props.user?
//         <span>users/
//           <span style={{ color: colors.red700 }}>?</span>
//         </span>:
//         <span>
//           {this.props.user._id}
//           <span
//             style={{
//               color: colors.red700,
//               cursor: 'pointer'
//             }}
//             onClick={() => {
//               Users.update({ login: { $exists: true } }, { $unset: { login: "" }});
//             }}
//           > ✗ </span>
//         </span>
//       }
//       </span>
//     </Drop>);
//   }
// });

class Page extends React.Component {
  render() {
    return (
      <div>
        <div>
          <Drag action="insert" collection={Items}>
            <button
              style={{
                backgroundColor: Items.color, color: 'white',
                marginLeft: 0
              }}
            >+item</button>
          </Drag>
          <Drag action="insert" collection={Allower}>
            <button
              style={{
                backgroundColor: Allower.color, color: 'white',
                marginLeft: 0
              }}
            >+allower</button>
          </Drag>
        </div>
        <div>
          <br/>
          <span style={{ fontSize: '0.75em' }}>(Users)</span>
          <Documents collection={Users} query={{}}/>
          <br/><br/>
          <span style={{ fontSize: '0.75em' }}>(Nesting)</span>
          <Documents collection={Nesting} query={{}} recursion={true}/>
          <br/><br/>
          <span style={{ fontSize: '0.75em' }}>(Items)</span>
          <Documents collection={Items} query={{}} recursion={true}/>
        </div>
      </div>
    );
  }
}

var _Page = DragDropContext(HTML5Backend)(Page);

Meteor.startup(() => {
  render(<_Page/>, document.getElementById('react'));
});