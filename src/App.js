import React, { Component } from 'react';
import {Router, Switch, Route} from 'react-router-dom'
import './App.css';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

import history from './history'
import {SplashServer, SplashServerReconnect, SplashBundle} from './splash';
// import {Server} from './server``'
import {Bundle} from './bundle';
import {NotFound} from './errors';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      serverHost: null,
      serverIsConnected: false,
      serverPhoebeVersion: null,
      settingsTheme: "default"
    };
  }
  setServer = () => {
    console.log("App.setServer");
    this.setState({serverHost: "localhost:3000", serverIsConnected: true, serverPhoebeVersion: "2.1.0"});
  }
  disconnectServer = () => {
    console.log("App.disconnectServer");
    this.setState({serverHost: null, serverIsConnected: false, serverPhoebeVersion: null})

  }
  render() {
    if (this.state.serverHost && this.state.serverIsConnected) {
      return (
        // we're connected, so let's pass through the child, but allow access
        // to this server via the child's this.props.server.
        <Router history={history}>
          <Switch>
            <Route exact path={process.env.PUBLIC_URL + '/'} render={(props) => <SplashBundle {...props} app={this}/>}/>
            <Route path={process.env.PUBLIC_URL + '/:bundleid/:modal'} render={(props) => <Bundle {...props} app={this}/>}/>
            <Route path={process.env.PUBLIC_URL + '/:bundleid'} render={(props) => <Bundle {...props} app={this}/>}/>
            <Route path="*" component={NotFound} />
          </Switch>
        </Router>
      )
    } else if (this.state.serverHost) {
      return (
        // then we're probably trying to reconnect, but let's block all interaction
        <SplashServerReconnect disconnectServer={this.disconnectServer} app={this}/>
      )
    } else {
      // then we need to select the server
      return (
        <SplashServer setServer={this.setServer}/>
      )
    }
  }
}


export default App;
