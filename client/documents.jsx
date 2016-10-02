import React from 'react';
import lodash from 'lodash';
import { createContainer } from 'meteor/react-meteor-data';
import colors from 'material-ui/styles/colors';
import Toggle from 'material-ui/Toggle';

import { RightsComponent } from './rights';
import { Drag, Drop } from './dnd';
import { getCollection } from '../imports/getCollection';
import { isAllowed } from '../imports/isAllowed';
import { RulePopover } from './popover';

import { refs } from '../imports/refs';

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
          {...this.props}
          key={document.ref()}
          document={document}
        />);
      })}
    </div>);
  }
}

var Documents = createContainer(({
  reference, references, collection, query, recursion,
  buttons
}) => {
  if (reference) {
    collection = refs.storage(reference);
    query = { _id: refs.parse(reference)[1] };
  }
  return {
    documents: collection.find(query).fetch(),
    collection, recursion, buttons
  };
}, _Documents);

class _Document extends React.Component {
  getChildContext() {
    var recursionProtection;
    if (this.context.recursionProtection) {
      recursionProtection = lodash.cloneDeep(this.context.recursionProtection);
    } else {
      recursionProtection = [];
    }
    recursionProtection.push(this.props.document.ref());
    return {
      recursionProtection: recursionProtection
    };
  }
  setRightTypeToRule(type, value) {
    this.props.collection.update(this.props.document._id, {
      [value?'$addToSet':'$pull']: { rightsTypes: type }
    });
  }
  render() {
    var { collection, document, allowed } = this.props;
    var color, children, buttons, rights, title, content, style, recursion;
    
    color = this.props.collection.color;
    
    children = (<div>
      <Documents
        collection={Owning}
        query={{ source: document.ref() }}
      />
      <Documents
        collection={Joining}
        query={{ source: document.ref() }}
      />
      {collection == Rules?
        (<span>
          <Field
            collection={collection}
            document={document}
            field='source'
            allowed={allowed}
          >(source)</Field>
          <Field
            collection={collection}
            document={document}
            field='target'
            allowed={allowed}
          >(target)</Field>
          <Field
            collection={collection}
            document={document}
            field='guarantor'
            allowed={allowed}
          >(guarantor)</Field>
          <FieldArray
            collection={collection}
            document={document}
            field={'breakpoints'}
            allowed={allowed}
          >(breakpoints)</FieldArray>
          <span style={{ fontSize: '0.75em' }}>(rightTypes)</span>
          <div style={{ paddingLeft: 25 }}>
            <Toggle defaultToggled={lodash.includes(document.rightsTypes, 'fetching')} label="fetching" style={{ width: 200 }} onToggle={(proxy, value) => { this.setRightTypeToRule('fetching', value) }}/>
            <Toggle defaultToggled={lodash.includes(document.rightsTypes, 'editing')} label="editing" style={{ width:  200 }} onToggle={(proxy, value) => { this.setRightTypeToRule('editing', value) }}/>
            <Toggle defaultToggled={lodash.includes(document.rightsTypes, 'owning')} label="owning" style={{ width: 200 }} onToggle={(proxy, value) => { this.setRightTypeToRule('owning', value) }}/>
          </div>
        </span>)
        :
        (document.target?
          (<Documents
            reference={document.target}
            recursion={collection == Joining}
          ></Documents>)
          :
          undefined
        )
      }
      {collection == Users?
        <div>
          <div style={{ fontSize: '0.75em' }}>(shared)</div>
          {this.props.rules.map((rule) => {
            return <Documents
              key={rule._id}
              reference={rule.target}
            />;
          })}
          <div style={{ fontSize: '0.75em' }}>(joined)</div>
          {this.props.joins.map((join) => {
            return <Documents
              key={join._id}
              reference={join.source}
            />;
          })}
        </div>
      :undefined}
    </div>);
    
    if (collection != Users) {
      buttons = (<span
          style={{
            color: allowed?colors.red700:colors.grey400,
            marginLeft: 0, cursor: 'pointer'
          }}
          onClick={() => {
            collection.update(document._id, { $set: { removed: true } });
          }}
        >✗</span>);
    } else {
      buttons = (<span> </span>);
    }
    
    rights = (<span>
      <RulePopover children="&hearts;" />
      &nbsp;
      <RightsComponent target={document.ref()}/>
    </span>);
    
    style = { color: color };
    if (document.removed) style.textDecoration = 'line-through';
    
    if (!allowed) {
      style.fontStyle = 'italic';
    }
    
    title = <span style={style}>{document.ref()}</span>;
    
    recursion = 
      this.props.recursion ||
      lodash.includes(this.context.recursionProtection, document.ref())
    ;
    
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
    
    if (this.props.buttons) buttons = this.props.buttons;
    
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

_Document.contextTypes = {
  recursionProtection: React.PropTypes.array
};

_Document.childContextTypes = {
  recursionProtection: React.PropTypes.array
};

var Document = createContainer(({ before, collection, document, recursion, reference }) => {
  var rightTypes = collection == Owning? ['owning'] : ['editing'];
  return {
    before, collection, document, recursion,
    allowed: Meteor.userId()?isAllowed(rightTypes, Meteor.user().ref(), document.ref()):false,
    rules: Rights.find({ root: { $exists: false }, $or: collection==Users?document.mapJoining((join) => { return { source: join }; }):[{ source: document.ref() }] }).fetch(),
    joins: Joining.find({ target: document.ref() }).fetch(),
    reference
  };
}, _Document);

class Field extends React.Component {
  render() {
    var { collection, document, field, allowed } = this.props;
    var children;
    
    children = (<div>
      {document[field]?
        (<Documents
          reference={document[field]}
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
          {collection != Users?
            (<span
              style={{
                color: allowed?colors.red700:colors.grey400,
                cursor: 'pointer'
              }}
              onClick={() => {
                collection.update(document._id, { $unset: { [field]: '' } });
              }}
            > ✗ </span>)
          :undefined}
        </span>
      </Drop>
      <div style={{ paddingLeft: 25 }}>{children}</div>
    </div>);
  }
}

var FieldArrayQueries = ({ document, collection, field, values, allowed }) => {
  if (values) {
    return <div>
      {values.map((value) => {
        return <Documents
          key={value}
          reference={value}
          recursion={true}
          buttons={<span
            style={{
              color: allowed?colors.red700:colors.grey400,
              cursor: 'pointer'
            }}
            onClick={() => {
              collection.update(document._id, { $pull: { [field]: value } });
            }}
          > ✗ </span>}
        ></Documents>
      })}
    </div>;
  } else {
    return <div></div>;
  }
};

class FieldArray extends React.Component {
  render() {
    var { collection, document, field, allowed } = this.props;
    var children;
    
    return (<div>
      <Drop
        action='addToSet'
        collection={collection}
        document={document}
        field={field}
      >
        <span style={{ fontSize: '0.75em' }}>
          {this.props.children}
        </span>
      </Drop>
      <div style={{ paddingLeft: 25 }}>
        <FieldArrayQueries document={document} collection={collection} values={document[field]} allowed={allowed} field={field}/>
      </div>
    </div>);
  }
}

export { Documents, Document, Field };