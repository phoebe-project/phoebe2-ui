import React, {Component} from 'react';

import {history} from './history';


// class SettingsItem extends Component {
//   render() {
//     return (
//       this.props.children
//     )
//   }
// }

export class SettingsPage extends Component {
  close = () => {
    history.goBack();
  }
  render() {
    var title = this.props.title || "Settings"
    return (
      <div className="App content-dark">
        <span onClick={this.close} title="close settings" className="fa-2x fas fa-chevron-left" style={{cursor: "pointer", padding: "10px"}}/>
        <h1 style={{textAlign: 'center'}}>{title}</h1>
        {this.props.children}
      </div>
    )
  }
}

export class SettingsServers extends Component {

  render() {
    // var settingsServerHosts = this.props.app.state.settingsServerHosts

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
