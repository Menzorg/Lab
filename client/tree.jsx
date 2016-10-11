import lodash from 'lodash';
import React from 'react';

import { List, ListItem } from 'material-ui/List';
import RaisedButton from 'material-ui/RaisedButton';
import { Link } from 'react-router'

import Documents from './documents';
import Document from './document';
import { Drag } from './dnd';
import { Badge } from  './badge';

import Recursion from './recursion';

class _TreeItem extends React.Component {
  render() {
    var { _subscription, collection, document, nestedLevel } = this.props;
    
    if (_subscription && document) {
      var recursion = lodash.includes(this.context.__recursion, document.ref());
      
      return <Recursion ref="recursion" document={document}>
        <ListItem
          primaryText={
            <Badge {...this.props}/>
          }
          disableTouchRipple={true}
          innerDivStyle={{ padding: '8px 16px' }}
          nestedLevel={nestedLevel}
          style={{ cursor: 'default' }}
        />
        {!recursion?
          <span>
            {(collection==Owning||collection==Joining)&&document.target?
              <TreeItem
                refId={document.target}
                nestedLevel={nestedLevel+1}
              />
            :undefined}
            <TreeList
              collection={Owning}
              query={{ source: document.ref() }}
              nestedLevel={nestedLevel+1}
            />
          </span>
        :undefined}
      </Recursion>;
    } else {
      return null;
    }
  }
}

_TreeItem.defaultProps = {
  nestedLevel: 0
};

_TreeItem.propTypes = {
  nestedLevel: React.PropTypes.number
};

_TreeItem.contextTypes = {
  __recursion: React.PropTypes.array
};

class TreeItem extends React.Component {
  render() {
    return <Document
      {...this.props}
      component={_TreeItem}
    />
  }
}

class TreeList extends React.Component {
  render() {
    return <Documents
      {...this.props}
      component={_TreeItem}
    />;
  }
}

class Tree extends React.Component {
  render() {
    return <List>
      <TreeList {...this.props}/>
    </List>;
  }
}

export { Tree };