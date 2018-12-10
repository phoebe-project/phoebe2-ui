import React, { Component } from 'react';

import {Link, DisconnectServerButton} from './common';

import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

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
        { isElectron() ?
          <p>Running from within Electron</p>
          :
          <p>Running as a web-app</p>
        }
        <Link to={"/"+"mybundleid"}>create new bundle</Link>
        <br/>
        <br/>
        <br/>
        <DisconnectServerButton app={this.props.app}/>
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
        { isElectron() ?
          <p>Running from within Electron</p>
          :
          <p>Running as a web-app</p>
        }
        <button onClick={this.props.setServer}>Select Server</button>
      </div>
    )
  }
}

export class SplashServerReconnect extends Component {
  render() {
    return (
      <div>
        <h1>Server connection to {this.props.app.state.serverHost} lost... reconnecting</h1>
        <DisconnectServerButton app={this.props.app}/>
      </div>
    )
  }
}
