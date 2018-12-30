import React, { Component } from 'react';
import {Switch, Route} from 'react-router-dom'
import './App.css';

import isElectron from 'is-electron'; // https://github.com/cheton/is-electron
import SocketIO from 'socket.io-client'; // https://www.npmjs.com/package/socket.io-client

import {history} from './history'
import {Router, isStaticFile} from './common'
import {SplashBundle} from './splash-bundle';
import {SplashServer} from './splash-server';
// import {SettingsServers, SettingsBundles} from './settings';
import {Bundle} from './bundle';
// import {PSPanel} from './panel-ps';
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
      electronChildProcessPort: null,
      serverHost: null,
      serverStatus: "disconnected",
      serverPhoebeVersion: null,
      serverAllowAutoconnect: true,
      serverStartingChildProcess: isElectron(),
      settingsServerHosts: [],
      settingsDismissedTips: []
    };
    this.router = React.createRef();
    this.socket = null;
  }
  getSettingFromStorage = (k) => {
    return window.localStorage.getItem(k, null)
  }
  updateSetting = (k,v) => {
    console.log("App.updateSetting "+k+"="+v)
    window.localStorage.setItem(k,v)
    // square bracket forces the value of k to be used instead of setting "k"
    this.setState({[k]: v});
  }
  getElectronChildProcessPort = () => {
    this.setState({electronChildProcessPort: window.require('electron').remote.getGlobal('pyPort')})
  }
  componentDidMount() {
    var stateisElectron = isElectron();
    this.setState({isElectron: stateisElectron})
    let defaultServerHosts
    if (stateisElectron) {
      defaultServerHosts = null;
      this.getElectronChildProcessPort();
    } else {
      defaultServerHosts = "localhost"
    }
    var settingsServerHosts = this.getSettingFromStorage('settingsServerHosts') || defaultServerHosts
    if (settingsServerHosts) {
      this.setState({settingsServerHosts: settingsServerHosts.split(',')});
    }
    var settingsDismissedTips = this.getSettingFromStorage('settingsDismissedTips') || null
    if (settingsDismissedTips) {
      this.setState({settingsDismissedTips: settingsDismissedTips.split(',')});
    }
  }
  getServerPhoebeVersion = (serverHost) => {
    fetch("http://"+serverHost+"/info")
      .then(res => res.json())
      .then(json => {
        this.setState({serverPhoebeVersion: json.data.phoebe_version})
      })
      .catch(err => {
        alert("server may no longer be available.  Cancel connetion to rescan.")
        this.setState({phoebeVersion: null});
      });
  }
  serverConnect = (server) => {
    var serverHost = server || this.props.match.params.server

    console.log("App.serverConnect to "+serverHost);

    if (this.socket) {
      // then we're actually changing servers, let's disconnect the old one first
      // TODO: note that this will clear the current bundle!!
      this.serverDisconnect();
    }

    this.setState({serverHost: serverHost, serverStatus: "connecting"});

    this.getServerPhoebeVersion(serverHost);

    this.socket = SocketIO("http://"+serverHost, socketOptions);

    this.socket.on('connect', (data) => {
      this.setState({serverStatus: "connected", serverStartingChildProcess: false, serverAllowAutoconnect: false});
    });

    this.socket.on('reconnect', (data) => {
      this.getServerPhoebeVersion(serverHost);
      this.setState({serverStatus: "reconnecting", serverAllowAutoconnect: true});
    })

    this.socket.on('disconnect', (data) => {
      this.serverDisconnect();
    });
  }
  serverDisconnect = () => {
    if (this.socket) {
      console.log("App.serverDisconnect");
      this.socket.close();
      this.socket = null;
    }

    this.setState({serverStatus: "disconnected", serverHost: null, serverPhoebeVersion: null});
  }
  render() {
    let public_url
    if (isStaticFile()) {
      public_url = ""
    } else {
      public_url = process.env.PUBLIC_URL
    }
    return (
      <Router history={history} ref={this.router}>
        <Switch>
          {/* NOTE: all Route components should be wrapped by a Server component to handle parsing the /:server (or lack there-of) and handing connecting/disconnecting to the websocket */}
          <Route exact path={public_url + '/'} render={(props) => <Server {...props} app={this}><SplashServer {...props} app={this}/></Server>}/>
          {/* <Route exact path={public_url + '/settings/servers'} render={(props) => <Server {...props} serverNotRequired={true} app={this}><SettingsServers {...props} app={this}/></Server>}/> */}
          {/* <Route exact path={public_url + '/:server/settings/servers'} render={(props) => <Server {...props} serverNotRequired={true} app={this}><SettingsServers {...props} app={this}/></Server>}/> */}
          {/* <Route exact path={public_url + '/:server/settings/bundles'} render={(props) => <Server {...props} serverNotRequired={true} app={this}><SettingsBundles {...props} app={this}/></Server>}/> */}
          <Route path={public_url + '/:server/open'} render={(props) => <Server {...props} app={this}><SplashBundle {...props} app={this} openDialog={true}/></Server>}/>
          <Route path={public_url + '/:server/transfer/:oldserver/:bundleid'} render={(props) => <Server {...props} app={this}><SplashBundle {...props} app={this} transfer={true}/></Server>}/>
          <Route path={public_url + '/:server/:bundleid/servers'} render={(props) => <Server {...props} app={this}><SplashServer {...props} app={this} switchServer={true}/></Server>}/>
          <Route path={public_url + '/:server/:bundleid/ps'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this} PSPanelOnly={true}/></Server>}/>
          <Route path={public_url + '/:server/:bundleid/:modal'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this}/></Server>}/>
          <Route path={public_url + '/:server/:bundleid'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this}/></Server>}/>
          <Route path={public_url + '/:server'} render={(props) => <Server {...props} app={this}><SplashBundle {...props} app={this}/></Server>}/>
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
        console.log("connecting to server because of URL")
        this.props.app.serverConnect(server)
        // will in turn set this.props.app.state.serverHost if successful
      } else if (!server) {
        console.log("disconnecting from server because of URL.  server="+server)
        this.props.app.serverDisconnect();
        // will reset this.props.app.state.serverHost to null
      }
    }
  }
  componentDidMount() {
    this.componentDidUpdate()
  }
  render() {
    if (this.props.app.state.serverStatus==='connected' || this.props.serverNotRequired) {
      return (
        this.props.children
      )
    } else {
      return (
        // then we'll display there server splash.  If a server is connecting/reconnecting
        // then the splash server will show that state.
        <SplashServer {...this.props}/>
      )
    }
  }
}


export default App;
