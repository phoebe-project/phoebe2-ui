import React, {Component} from 'react';
import fetch from 'node-fetch'; // https://github.com/bitinn/node-fetch

import {Link} from './common';
// import history from './history';

class Server extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phoebeVersion: null,
      parentId: null,
    };
  }
  getInfo = (scanTimeout) => {
    var location = this.props.location;
    if (!location.startsWith("http://")) {
      location = "http://" + location
    }

    var scanTimeout = scanTimeout || 0;
    if (scanTimeout > 5000) {
      scanTimeout = 5000
    }

    setTimeout( () => {
      console.log("Server.getInfo "+location+" with timeout: "+scanTimeout);

      // now we want to ping the server and retrieve the phoebe-version, etc
      // if any of this fails, we'll enter the catch section and ignore this matching
      // if the test succeeds, update the entry in component.state
      // this will then automatically queue a re-render of the underlying component
      // NOTE: square brackets around [location] forces the variable to be evaluated (in ES6)
      fetch(location+"/test")
        .then(res => res.json())
        .then(json => this.setState({phoebeVersion: json.data.phoebe_version, parentId: json.data.parentid}))
        .catch(err => this.getInfo(scanTimeout + 500));
    }, scanTimeout);

  }
  componentDidMount() {
    this.getInfo();
  }
  render() {
    var waitingText = "looking for PHOEBE server at "+this.props.location
    if (this.props.isSpawned) {
      waitingText = "waiting for spawned server at "+this.props.location
    }
    if (this.state.phoebeVersion) {
      return (<Link to={"/"+this.props.location}>Server: {this.props.location} Running: phoebe-{this.state.phoebeVersion} Parent: {this.state.parentId}</Link>)
    } else {
      return (
        <p>{waitingText}</p>
      )
    }
  }
}

export class Servers extends Component {
  constructor (props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return(
      <div className="ReactServers">
        {/* <p>Desktop application id: {remote.getGlobal('appid')}</p> */}
        <p>Current connection: {this.props.app.state.serverHost} ({this.props.app.state.serverStatus})</p>

        <b>localhost</b>
        { this.props.app.state.isElectron ?
          <Server app={this.props.app} location={"127.0.0.1:"+window.require('electron').remote.getGlobal('pyPort')} isSpawned={true}/>
          :
          null
        }
        <br/>
        <Server app={this.props.app} location="127.0.0.1:5555"/>
        <br/>
        <Server app={this.props.app} location="127.0.0.1:9999"/>
      </div>
    );
  }
}
