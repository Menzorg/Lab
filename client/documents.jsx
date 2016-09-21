import React from 'react';
import lodash from 'lodash';
import { createContainer } from 'meteor/react-meteor-data';
import colors from 'material-ui/styles/colors';

import { Rights } from './rights';
import { Drag, Drop } from './dnd';
import { getCollection } from '../imports/getCollection';

class Recursion extends React.Component {
  render() {
    return <i style={{ fontSize: '0.75em' }}>recursion</i>
  }
}

class _Documents extends React.Component {
  render() {
    return (<div>
      <div>{this.props.children}</div>
      {this.props.documents.map((document) => {
        return (<Document
          collection={this.props.collection}
          key={document._id}
          document={document}
          recursion={this.props.recursion}
          before={this.props.before}
        />);
      })}
    </div>);
  }
}

var Documents = createContainer(({ collection, query, recursion }) => {
  return {
    documents: collection.find(query).fetch(),
    collection, recursion
  };
}, _Documents);

class Document extends React.Component {
  getChildContext() {
    var recursionProtection;
    if (this.context.recursionProtection) {
      recursionProtection = lodash.cloneDeep(this.context.recursionProtection);
    } else {
      recursionProtection = [];
    }
    recursionProtection.push(this.props.document._id);
    return {
      recursionProtection: recursionProtection
    };
  }
  render() {
    var { collection, document } = this.props;
    var color, children, buttons, rights, title, content, style, recursion;
    
    color = this.props.collection.color;
    
    children = (<div>
      <Documents
        collection={Nesting}
        query={{ source: document._id }}
      />
      {collection == Allower?
        (<span>
          <Field
            collection={collection}
            document={document}
            field='source'
          >(source)</Field>
          <Field
            collection={collection}
            document={document}
            field='target'
          >(target)</Field>
          <Field
            collection={collection}
            document={document}
            field='guarantor'
          >(guarantor)</Field>
        </span>)
        :
        (document.target?
          (<Documents
            collection={getCollection(document.target)}
            query={{ _id: document.target }}
          ></Documents>)
          :
          undefined
        )
      }
    </div>);
    
    buttons = (<span
        style={{
          color: colors.red700,
          marginLeft: 0, cursor: 'pointer'
        }}
        onClick={() => {
          if (document.removed) collection.remove(document._id);
          else collection.update(document._id, { $set: { removed: true } });
        }}
      >✗</span>);
    
    rights = <Rights target={document._id}/>;
    
    style = { color: color };
    if (document.removed) style.textDecoration = 'line-through';
    title = <span style={style}>{document._id}</span>;
    
    recursion = this.props.recursion || lodash.includes(this.context.recursionProtection, document._id);
    
    if (recursion) {
      children = buttons = rights = undefined;
      content = <span>{title}</span>;
    } else {
      content = (<Drag action='nest' collection={collection} document={document}>
        <Drop collection={collection} document={document}>
          {title}
        </Drop>
      </Drag>);
    }
    
    return (<div>
      <div>
        {this.props.before}
        {content}
        {buttons}
        {rights}
      </div>
      <div style={{ paddingLeft: 25 }}>{children}</div>
    </div>);
  }
}

Document.contextTypes = {
  recursionProtection: React.PropTypes.array
};

Document.childContextTypes = {
  recursionProtection: React.PropTypes.array
};

class Field extends React.Component {
  render() {
    var { collection, document, field } = this.props;
    var children;
    
    children = (<div>
      {document[field]?
        (<Documents
          collection={getCollection(document[field])}
          query={{ _id: document[field] }}
          recursion={true}
        ></Documents>)
        :undefined
      }
    </div>);
    
    return (<div>
      <Drop
        collection={collection}
        document={document}
        field={field}
      >
        <span style={{ fontSize: '0.75em' }}>
          {this.props.children}
          <span
            style={{
              color: colors.red700,
              cursor: 'pointer'
            }}
            onClick={() => {
              collection.graph.update(document._id, { [field]: undefined });
            }}
          > ✗ </span>
        </span>
      </Drop>
      <div style={{ paddingLeft: 25 }}>{children}</div>
    </div>);
  }
}

export { Documents, Document, Field };