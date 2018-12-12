import React, { Component } from 'react';
import {Router, Switch, Route} from 'react-router-dom'
import './App.css';

import isElectron from 'is-electron'; // https://github.com/cheton/is-electron
import SocketIO from 'socket.io-client'; // https://www.npmjs.com/package/socket.io-client


import history from './history'
import {SplashBundle, SplashServer} from './splash';
import {SplashBundle} from './splash-bundle';
import {SplashServer} from './splash-server';
import {SettingsServers, SettingsBundles} from './settings';
import {Bundle} from './bundle';
import {NotFound} from './errors';

const socketOptions = {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1 * 1000,
      reconnectionDelayMax: 10 * 1000,
      autoConnect: true,
      transports: ['websocket'],
      rejectUnauthorized: true
    };

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isElectron: null,
      serverHost: null,
      serverStatus: "disconnected",
      serverPhoebeVersion: null,
      settingsTheme: "default"
    };

    this.socket = null;
  }
  componentDidMount() {
    this.setState({isElectron: isElectron()})
  }
  serverConnect = (server) => {
    var serverHost = server || this.props.match.params.server

    console.log("App.serverConnect to "+serverHost);

    if (this.socket) {
      // then we're actually changing servers, let's disconnect the old one first
      // TODO: note that this will clear the current bundle!!
      this.serverDisconnect();
    }

    this.socket = SocketIO("http://"+serverHost, socketOptions);
    this.setState({serverHost: serverHost, serverStatus: "connecting"});

    this.socket.on('connect', (data) => {
      this.setState({serverStatus: "connected"});
      // this.socket.emit('register client', {'clientid': self.appid});
    });

    this.socket.on('reconnect', (data) => {
      this.setState({serverStatus: "reconnecting"})
    })

    this.socket.on('disconnect', (data) => {
      this.setState({serverStatus: "disconnected", serverHost: null, serverPhoebeVersion: null});
      history.push("/")
    });
  }
  serverDisconnect = () => {
    if (this.socket) {
      console.log("App.serverDisconnect");
      this.socket.close();
      this.socket = null;
    }
    this.setState({serverStatus: "disconnected", serverHost: null, serverPhoebeVersion: null})
  }
  render() {
    return (
      <Router history={history}>
        <Switch>
          {/* NOTE: all Route components should be wrapped by a Server component to handle parsing the /:server (or lack there-of) and handing connecting/disconnecting to the websocket */}
          <Route exact path={process.env.PUBLIC_URL + '/'} render={(props) => <Server {...props} app={this}><SplashServer {...props} app={this}/></Server>}/>
          <Route exact path={process.env.PUBLIC_URL + '/settings/servers'} render={(props) => <Server {...props} app={this}><SettingsServers {...props} app={this}/></Server>}/>
          <Route exact path={process.env.PUBLIC_URL + '/:server/settings/servers'} render={(props) => <Server {...props} app={this}><SettingsServers {...props} app={this}/></Server>}/>
          <Route exact path={process.env.PUBLIC_URL + '/:server/settings/bundles'} render={(props) => <Server {...props} app={this}><SettingsBundles {...props} app={this}/></Server>}/>
          <Route path={process.env.PUBLIC_URL + '/:server/:bundleid/:modal'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this}/></Server>}/>
          <Route path={process.env.PUBLIC_URL + '/:server/:bundleid/:modal'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this}/></Server>}/>
          <Route path={process.env.PUBLIC_URL + '/:server/:bundleid'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this}/></Server>}/>
          <Route path={process.env.PUBLIC_URL + '/:server'} render={(props) => <Server {...props} app={this}><SplashBundle {...props} app={this}/></Server>}/>
          <Route path="*" component={NotFound} />
        </Switch>
      </Router>
    )
  }
}

class Server extends Component {
  // This component is simply in charge of passing the value of "server" from
  // the URL parameters to the parent App.  The App itself will keep all state
  // and handle the connection so that it is then automatically passed down
  // via the app property to all children components.
  // Alternatively, we could hack this by cloning the children in the render
  // and passing along this component as a server property, but that seems
  // like unnecessary overhead at this point.  If at some point the App component
  // becomes bloated, it may be nice to have that code separation by moving
  // all server-related logic here.
  componentDidUpdate() {
    var server = this.props.match.params.server;
    if (server != this.props.app.state.serverHost) {
      // NOTE must be !=, not !==
      if (server) {
        // this.props.app.setState({serverHost: server})
        this.props.app.serverConnect(server)
        // will in turn set this.props.app.state.serverHost if successful
      } else if (!server) {
        this.props.app.serverDisconnect();
        // will reset this.props.app.state.serverHost to null
      }
    }

  }
  componentDidMount() {
    this.componentDidUpdate()
  }
  render() {
    return (
      this.props.children
    )
  }
}


export default App;
