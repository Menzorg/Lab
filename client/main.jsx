import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import lodash from 'lodash';
import React from 'react';
import { render } from 'react-dom';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Router, Route, Link, browserHistory } from 'react-router'

import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card';
import RaisedButton from 'material-ui/RaisedButton';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import Bar from './bar';
import SidebarProfile from './sidebars/profile';
import SidebarNavigation from './sidebars/navigation';
import Documents from './documents';
import Document from './document';
import { refs } from '../imports/refs';
import { Drop, Context as DNDContext } from './dnd';
import { Badge } from  './badge';
import muiTheme from './theme';

class MainComponent extends React.Component {
  getChildContext() {
    return {
      user: this.props.user,
      userId: this.props.userId
    };
  }
  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(muiTheme)}>
        <DNDContext>
          <SidebarProfile ref="sidebarProfile">
            <SidebarNavigation ref="sidebarNavigation">
              <span onTouchTap={() => {
                this.refs.sidebarProfile.handleOuterClick();
                this.refs.sidebarNavigation.handleOuterClick();
              }}>
                <div>
                  <Bar
                    ref="bar"
                    onTouchLeft={() => {
                      this.refs.sidebarNavigation.toggleOpen();
                    }}
                    onTouchRight={() => {
                      this.refs.sidebarProfile.toggleOpen();
                    }}
                  />
                  <Document
                    collection={this.props.collection}
                    query={{ _id: this.props.id }}
                    component={({
                      _subscription, collection, document
                    }) => {
                      if (_subscription && document) {
                        if (collection == Users) {
                          return <Card>
                            <CardHeader
                              title={document.username}
                              subtitle="User"
                            />
                          </Card>;
                        } else if (collection == Owning){
                          return <Card>
                            <CardHeader
                              title={document.ref()}
                              subtitle="Owning"
                            />
                            <CardText>
                              <RaisedButton label="source" disabled={true} style={{ width: '50%' }}/>
                              <RaisedButton label="target" disabled={true} style={{ width: '50%' }}/>
                            </CardText>
                          </Card>;
                        } else if (collection == Joining){
                          return <Card>
                            <CardHeader
                              title={document.ref()}
                              subtitle="Joining"
                            />
                            <CardText>
                              <RaisedButton label="source" disabled={true} style={{ width: '50%' }}/>
                              <RaisedButton label="target" disabled={true} style={{ width: '50%' }}/>
                            </CardText>
                          </Card>;
                        } else if (collection == Rules){
                          return <Card>
                            <CardHeader
                              title={document.ref()}
                              subtitle="Rules"
                            />
                            <CardText>
                              <Card>
                                <CardHeader
                                  textStyle={{ width: '100%' }}
                                  title={
                                    <span>
                                      Subject
                                      <div style={{ float: 'right' }}>
                                        <Badge document={refs.get(document.source)}/>
                                      </div>
                                    </span>
                                  }
                                  subtitle="Those for whom this rule?"
                                />
                              </Card>
                              <Card>
                                <CardHeader
                                  textStyle={{ width: '100%' }}
                                  title={
                                    <span>
                                      Object
                                      <div style={{ float: 'right' }}>
                                        <Badge document={refs.get(document.target)}/>
                                      </div>
                                    </span>
                                  }
                                  subtitle="At what was issued this rule?"
                                />
                              </Card>
                              <Card>
                                <CardHeader
                                  textStyle={{ width: '100%' }}
                                  title={
                                    <span>
                                      Guarantor
                                      <div style={{ float: 'right' }}>
                                        <Badge document={refs.get(document.guarantor)}/>
                                      </div>
                                    </span>
                                  }
                                  subtitle="Who guarantees the rule of their rights?"
                                />
                              </Card>
                            </CardText>
                          </Card>;
                        } else if (collection == Items){
                          return <Card>
                            <CardHeader
                              title={document.ref()}
                              subtitle="Items"
                            />
                          </Card>;
                        }
                      } else {
                        return null;
                      }
                    }}
                  />
                </div>
              </span>
            </SidebarNavigation>
          </SidebarProfile>
        </DNDContext>
      </MuiThemeProvider>
    );
  }
}

MainComponent.childContextTypes = {
  user: React.PropTypes.any,
  userId: React.PropTypes.any
};

var MainContainer = createContainer(({}) => {
  var subscription = Meteor.subscribe('users', { _id: Meteor.userId() });
  return {
    __userReady: subscription.ready(),
    userId: Meteor.userId(),
    user: Meteor.user()
  };
}, MainComponent);

class Main extends React.Component {
  render() {
    return <MainContainer collection={Shuttler.collection(this.props.params.collection)} id={this.props.params.id}/>;
  }
}

class Ref extends React.Component {
  render() {
    return <MainContainer collection={Shuttler.collection(this.props.params.collection)} id={this.props.params.id}/>;
  }
}

class Routes extends React.Component {
  render() {
    return (
      <Router history={browserHistory}>
        <Route path="/" component={Main}>
          <Route path="/:collection/:id" component={Main}/>
        </Route>
      </Router>
    );
  }
}

Meteor.startup(() => {
  render(<Routes/>, document.getElementById('react'));
});