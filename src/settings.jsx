import React, {Component} from 'react';

import history from './history';


export class SettingsPage extends Component {
  close = () => {
    history.goBack();
  }
  render() {
    var title = this.props.title || "Settings"
    return (
      <div className="App content-dark">
        <h1>{title}</h1>
        <p>Either saved in browser cache or ~/.phoebe</p>
        {this.props.children}
        <button onClick={this.close}>close</button>
      </div>
    )
  }
}

export class SettingsServers extends Component {

  render() {
    return(
      <SettingsPage title="Configure Servers">
        <ul>
          <li>configure which ports to scan on startup</li>
          <li>username/password?</li>
        </ul>
      </SettingsPage>
    )
  }
}

export class SettingsBundles extends Component {

  render() {
    return(
      <SettingsPage title="Configure New Bundle Options">
        <ul>
          <li>configure which default bundles to expose on start page</li>
        </ul>
      </SettingsPage>
    )
  }
}
