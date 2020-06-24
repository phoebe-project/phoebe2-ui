import React, { Component } from 'react';
import {Switch, Route} from 'react-router-dom'
import './App.css';

import isElectron from 'is-electron'; // https://github.com/cheton/is-electron
import SocketIO from 'socket.io-client'; // https://www.npmjs.com/package/socket.io-client

// NOTE: currently use a local version until PR is accepted, in which case we can lose the ./ and update the version requirements in package.json
// local version now also includes a getSearchString() which we'd have to rewrite if using the dependency
import ReactQueryParams from './react-query-params'; // https://github.com/jeff3dx/react-query-params

import {history} from './history'
import {Router, isStaticFile, randomstr, generatePath} from './common'
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


class App extends ReactQueryParams {
  constructor(props) {
    super(props);
    this.state = {
      clientid: null,
      isElectron: null,
      electronChildProcessPort: null,
      bundleTransferJson: null,
      serverHost: null,
      serverStatus: "disconnected",
      serverPhoebeVersion: null,
      serverInfo: null,
      serverAvailableKinds: null,
      serverAllowAutoconnect: true,
      serverStartingChildProcess: isElectron(),
      settingsServerHosts: [],
      settingsDismissedTips: [],
      allowDisconnectReadonly: false,
      clientVersion: '0.1.0', // UPDATE ON NEW RELEASE, also update package.json.version to match
      serverMinVersion: '2.3.0',  // UPDATE ON NEW RELEASE - any warnings need to go in common.getServerWarning
      latestClientVersion: null, // leave at null, updated by getLatestClientVersion
      latestServerVersion: null, // leave at null, updated by getLatestServerVersion
      clientWarning: null, // leave at null, will be set when connected to a server, serverWarning can be checked on the fly via common.getServerWarning(serverPhoebeVersion)
    };
    this.router = React.createRef();
    this.socket = null;
  }
  clearQueryParams = () => {
    var newQueryParams = {}
    Object.keys(this.queryParams).forEach( k => {
        newQueryParams[k] = [];
    })
    this.setQueryParams(newQueryParams)

    // window.location.search = "";
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
  redirectFromArgs = (server, bundleid, action, filter) => {
    // alert("redirectFromArgs "+server+" "+bundleid+" "+action+" "+filter)
    if (server !== null) {
      // then we need to do a redirect based on command line arguments
      // NOTE: we can assume a static file in electron at this point
      const url = window.location.origin + window.location.pathname + "?" + filter + "#" + generatePath(server, bundleid, action, null)
      // alert("redirecting to "+url)
      window.location.href = url
    }
  }
  componentDidMount() {
    var stateisElectron = isElectron();
    this.setState({isElectron: stateisElectron})
    let defaultServerHosts;
    if (stateisElectron) {
      defaultServerHosts = null;
      this.getElectronChildProcessPort();
    } else {
      defaultServerHosts = "server.phoebe-project.org"
    }

    var settingsServerHosts = this.getSettingFromStorage('settingsServerHosts') || defaultServerHosts
    if (settingsServerHosts) {
      this.setState({settingsServerHosts: settingsServerHosts.split(',')});
    }
    var settingsDismissedTips = this.getSettingFromStorage('settingsDismissedTips') || null
    if (settingsDismissedTips) {
      this.setState({settingsDismissedTips: settingsDismissedTips.split(',')});
    }

    window.addEventListener("beforeunload", (event) => {this.serverDisconnect();});

    this.getLatestServerVersion();
    this.getLatestClientVersion();

    if (stateisElectron) {
      // TODO: allow passing json for bundle (and server defaulting to subprocess if not provided)
      if (!window.require('electron').remote.getGlobal('ignoreArgs')) {
        // this will set ignoreArgs to true so that we don't try processing again (on a reload, redirect, new window, etc)
        window.require('electron').remote.getGlobal('setIgnoreArgs')(true);
        const args = window.require('electron').remote.getGlobal('args');
        var server = args['s'] || null;
        var bundleid = args['b'] || null;
        var jfile = args['j'] || null;
        var filter = args['f'] || '';
        var action = args['a'] || null;
        var port = args['p'] || 5000

        if (server === null) {
          server = 'localhost:'+port
        }

        if (jfile !== null) {

          var json = window.require('fs').readFileSync(jfile, "utf8")
          fetch("http://"+server+"/open_bundle/load:phoebe2", {method: 'POST', body: JSON.stringify({json: json, bundleid: bundleid})})
            .then(res => res.json())
            .then(json => {
              if (json.data.success) {
                this.redirectFromArgs(server, json.data.bundleid, action, filter)
              } else {
                alert("error from server: "+json.data.error)}
              })
            .catch(err => {
              alert("failed to open bundle from json with error: "+err)
            })

        } else if (args['s'] || args['p']) {
          this.redirectFromArgs(server, bundleid, action, filter)
        }
      }
    }
  }
  componentWillUnmount() {
    this.serverDisconnect();
  }
  getLatestServerVersion = () => {
    console.log('attempting to get latest server version from github releases')
    fetch("https://api.github.com/repos/phoebe-project/phoebe2/releases")
      .then(res => res.json())
      .then(json => this.setState({latestServerVersion: json[0]['tag_name'] || null}))
      .catch(err => {
        console.log("failed to fetch latestServerVersion")
        this.setState({latestServerVersion: null})
      })
  }
  getLatestClientVersion = () => {
    console.log('attempting to get latest client version from github releases')
    fetch("https://api.github.com/repos/phoebe-project/phoebe2-ui/releases")
      .then(res => res.json())
      .then(json => this.setState({latestClientVersion: json[0]['tag_name'] || null}))
      .catch(err => {
        console.log("failed to fetch latestClientVersion")
        this.setState({latestClientVersion: null})
      })
  }
  getServerPhoebeVersion = (serverHost) => {
    fetch("http://"+serverHost+"/info", {method: 'POST', body: JSON.stringify({client_version: this.state.clientVersion, clientid: this.state.clientid})})
      .then(res => res.json())
      .then(json => {
        this.setState({serverPhoebeVersion: json.data.phoebe_version, serverInfo: json.data.info || '', serverAvailableKinds: json.data.available_kinds, clientWarning: json.data.client_warning || null})
      })
      .catch(err => {
        if (!this.queryParams.disconnectButton && (!this.state.isElectron || !window.require('electron').remote.getGlobal('args').w)) {
          alert("server may no longer be available.  Cancel connection to rescan.")
        }
        this.setState({serverPhoebeVersion: null, serverInfo: null, serverAvailableKinds: null});
      });
    }
  serverConnect = (server) => {
    var serverHost = server || this.props.match.params.server

    if (this.queryParams.disconnect) {
      return
    }


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
      this.emit('register client', {});
    });

    this.socket.on('reconnect', (data) => {
      this.getServerPhoebeVersion(serverHost);
      this.setState({serverStatus: "reconnecting", serverAllowAutoconnect: true});
      this.emit('register client', {});
    })

    this.socket.on('disconnect', (data) => {
      this.serverDisconnect();
    });
  }
  serverDisconnect = () => {
    console.log("App.serverDisconnect");

    if (this.socket) {
      console.log("deregistering client")
      this.emit('deregister client', {})
      console.log("closing socket")
      this.socket.close();
      this.socket = null;
    }

    this.setState({serverStatus: "disconnected", serverHost: null, serverPhoebeVersion: null, clientWarning: null});
  }
  emit = (channel, packet) => {
    if (this.socket) {
      packet['clientid'] = this.state.clientid;
      packet['client_version'] = this.state.clientVersion;

      this.socket.emit(channel, packet);
    } else {
      console.log("App.emit requested to emit packet but no socket available "+packet)
    }
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
          {/* <Route exact path={public_url + '/:clientid'} render={(props) => <Server {...props} app={this}><SplashServer {...props} app={this}/></Server>}/> */}
          {/* <Route exact path={public_url + '/settings/servers'} render={(props) => <Server {...props} serverNotRequired={true} app={this}><SettingsServers {...props} app={this}/></Server>}/> */}
          {/* <Route exact path={public_url + '/:server/settings/servers'} render={(props) => <Server {...props} serverNotRequired={true} app={this}><SettingsServers {...props} app={this}/></Server>}/> */}
          {/* <Route exact path={public_url + '/:server/settings/bundles'} render={(props) => <Server {...props} serverNotRequired={true} app={this}><SettingsBundles {...props} app={this}/></Server>}/> */}
          <Route path={public_url + '/:server/open'} render={(props) => <Server {...props} app={this}><SplashBundle {...props} app={this} openDialog={true}/></Server>}/>
          <Route path={public_url + '/:server/transfer/:bundleid'} render={(props) => <Server {...props} app={this}><SplashBundle {...props} app={this} transfer={true}/></Server>}/>
          <Route path={public_url + '/:server/:bundleid/servers'} render={(props) => <Server {...props} app={this}><SplashServer {...props} app={this} switchServer={true}/></Server>}/>
          <Route path={public_url + '/:server/:bundleid/ps'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this} PSPanelOnly={true}/></Server>}/>
          <Route path={public_url + '/:server/:bundleid/figures'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this} FigurePanelOnly={true}/></Server>}/>
          <Route path={public_url + '/:server/:bundleid/:action'} render={(props) => <Server {...props} app={this}><Bundle {...props} app={this}/></Server>}/>
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

    if (server != this.props.app.state.serverHost && !this.props.app.state.allowDisconnectReadonly) {
      // NOTE must be !=, not !==
      if (server) {
        // this.props.app.setState({serverHost: server})
        console.log("connecting to server because of URL")
        this.props.app.serverConnect(server)
        // will in turn set this.props.app.state.serverHost if successful
      } else if (!server) {
        console.log("disconnecting from server because of URL.  server="+server)
        // alert("disconnecting from server because of URL")
        this.props.app.serverDisconnect();
        // will reset this.props.app.state.serverHost to null
      }
    }
  }
  componentDidMount() {
    this.componentDidUpdate()

    let clientid
    if (isElectron()) {
      clientid = window.require('electron').remote.getGlobal('clientid');
    } else {
      clientid = "web-"+randomstr(5);
    }
    this.props.app.setState({clientid: clientid})

  }
  render() {
    if (this.props.app.state.serverStatus==='connected' || this.props.serverNotRequired || this.props.app.state.allowDisconnectReadonly) {
      return (
        this.props.children
      )
    } else if (this.props.app.queryParams.disconnectButton) {
      return (
        <div style={{width: "100%", height: "100%", backgroundColor: '#e4e4e4'}}>
          <div style={{position: 'fixed', bottom: '0px', right: '70px', padding: '20px', width: '100px'}}>
            <span title="client was disconnected and in read-only mode" style={{padding: '10px', backgroundColor: "#6d6969", color: "white", borderRadius: "4px"}}>disconnected</span>
          </div>
        </div>
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
