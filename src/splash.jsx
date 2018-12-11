import React, { Component } from 'react';

import {Link, generatePath} from './common';

import {Servers} from './servers';

export class SplashAuto extends Component {
  render() {
    if (this.props.app.state.serverHost && this.props.app.state.serverStatus==='connected') {
      return (<SplashBundle {...this.props}/>)
    } else if (this.props.app.state.serverStatus==='reconnecting') {
      return (<SplashServerReconnect {...this.props}/>)
    } else {
      return (<SplashServer {...this.props}/>)
    }
  }
}

export class SplashBundle extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Welcome to PHOEBE2-UI</h2>
        </div>
        <p className="App-intro">
          Welcome to PHOEBE User Interface!
        </p>
        { this.props.app.state.isElectron ?
          <p>Running from within Electron</p>
          :
          <p>Running as a web-app</p>
        }
        <Link to={generatePath(this.props.app.state.serverHost,"mybundleid")}>create new bundle</Link>
        <br/>
        <br/>
        <br/>
        <Link to="/">Disconnect Server</Link>
      </div>
    );
  }
}

export class SplashServer extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h2>Welcome to PHOEBE2-UI</h2>
        </div>
        <p className="App-intro">
          Welcome to PHOEBE User Interface!
        </p>
        { this.props.app.state.isElectron ?
          <p>Running from within Electron</p>
          :
          <p>Running as a web-app</p>
        }
        <Link to="/settings/servers">Configure Servers</Link>
        {this.props.app.state.serverStatus==="disconnected" ?
          <Servers app={this.props.app}/>
          :
          <div>
            <p>waiting for server to connect</p>
            <Link to={generatePath()}>Choose new Server</Link>
          </div>
        }
      </div>
    )
  }
}

export class SplashServerReconnect extends Component {
  render() {
    return (
      <div>
        <h1>Server connection to {this.props.app.state.serverHost} lost... reconnecting</h1>
        <Link to={generatePath()}>Disconnect from Server</Link>
      </div>
    )
  }
}
