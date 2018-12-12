import React, { Component } from 'react';
import fetch from 'node-fetch'; // https://github.com/bitinn/node-fetch

import {Link, Image, generatePath} from './common';

import history from './history';
import {LogoSplash} from './logo';


export class SplashServer extends Component {
  constructor(props) {
    super(props);
    this.splashScrollable = React.createRef();

  }
  disableAllInput = () => {
    HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    for (var element of this.splashScrollable.current.children) {
      element.classList.add('disabled');
    }
  }
  enableAllInput = () => {
    HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    for (var element of this.splashScrollable.current.children) {
      element.classList.remove('disabled');
    }
  }
  render() {
    return(
      <div className="App content-dark">
        <LogoSplash animationEffect="animateShimmer"/>

        <div className="splash-scrollable-header">
          {/* <p>Desktop application id: {remote.getGlobal('appid')}</p> */}
          {/* <p>Current connection: {this.props.app.state.serverHost} ({this.props.app.state.serverStatus})</p> */}

          <p style={{textAlign: "center", marginBottom: "0px", paddingLeft: "10px", paddingRight: "10px"}}>
            <b>Connect to Server</b>
            <Link style={{float: "right"}} title="configure server settings" to="/settings/servers"><span className="fas fa-fw fa-cog"/></Link></p>

          <div ref={this.splashScrollable} className="splash-scrollable">
            { this.props.app.state.isElectron ?
              <ServerButton location={"127.0.0.1:"+window.require('electron').remote.getGlobal('pyPort')} isSpawned={true} app={this.props.app} splash={this}/>
              :
              null
            }
            <ServerButton location="127.0.0.1:5555" app={this.props.app} splash={this}/>
            <ServerButton location="127.0.0.1:9999" app={this.props.app} splash={this}/>
          </div>
        </div>
      </div>
    );
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

class ServerStatusIcon extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false
    }
  }
  render() {
    // this.props.phoebeVersion
    // this.props.connecting
    let title
    var classes = "fas fa-fw"
    var style = {display: "inline-block", float: "left", marginTop: "4px", textAlign: "center"}
    var onClick = null;

    if (this.props.connecting) {
      title = "cancel connection"
      style.pointerEvents = "all"
      onClick = this.props.server.cancelConnection
      if (this.state.hover) {
        classes += " fa-times"
      } else {
        classes += " fa-circle-notch fa-spin"
      }
    } else {
      classes += " fa-broadcast-tower"
      if (this.props.phoebeVersion) {
        title = "server available"
        style.opacity = "1.0"
      } else {
        title = "searching for server"
        style.opacity = "0.5"
      }
    }

    return (
      <span style={style} className={classes} title={title} onClick={onClick} onMouseEnter={()=>{this.setState({hover:true})}} onMouseLeave={()=>{this.setState({hover:false})}}></span>
    )
  }
}

class ServerRemoveButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false
    }
  }
  render() {
    // this.props.phoebeVersion
    // this.props.connecting
    let title
    var classes = "fas fa-fw"
    var style = {display: "inline-block", float: "left", marginTop: "4px", textAlign: "center"}
    var onClick = null;

    if (this.props.connecting) {
      title = "cancel connection"
      style.pointerEvents = "all"
      onClick = this.props.server.cancelConnection
      if (this.state.hover) {
        classes += " fa-times"
      } else {
        classes += " fa-circle-notch fa-spin"
      }
    } else {
      classes += " fa-broadcast-tower"
      if (this.props.phoebeVersion) {
        title = "server available"
        style.opacity = "1.0"
      } else {
        title = "searching for server"
        style.opacity = "0.5"
      }
    }

    return (
      <span style={style} className={classes} title={title} onClick={onClick} onMouseEnter={()=>{this.setState({hover:true})}} onMouseLeave={()=>{this.setState({hover:false})}}></span>
    )
  }
}

class ServerVersionSpan extends Component {
  render() {
    let text, title
    var style = {display: "inline-block", float: "left", width: "60px", marginLeft: "5px", marginRight: "15px", textAlign: "center"}
    if (this.props.phoebeVersion) {
      style.border = "1px dotted #a1a1a1"
      text = this.props.phoebeVersion
      title = "this servers is running PHOEBE "+this.props.phoebeVersion
    } else {
      style.opacity = "0.5"
      text = "scanning"
      title = "scanning for PHOEBE server"
    }

    return (
      <span style={style} title={title}>{text}</span>
    )
  }
}

class ServerButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phoebeVersion: null,
      parentId: null,
      hover: false,
      connecting: false,
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
    if (this.props.isSpawned) {
      // then we're probably waiting, so let's keep this at 1 s
      scanTimeout = 1000
    }

    this._infoloop = setTimeout( () => {
      console.log("Server.getInfo "+location+" with timeout: "+scanTimeout);

      // now we want to ping the server and retrieve the phoebe-version, etc
      // if any of this fails, we'll enter the catch section and ignore this matching
      // if the test succeeds, update the entry in component.state
      // this will then automatically queue a re-render of the underlying component
      fetch(location+"/test")
        .then(res => res.json())
        .then(json => this.setState({phoebeVersion: json.data.phoebe_version, parentId: json.data.parentid}))
        .catch(err => {this.cancelConnect(); this.setState({phoebeVersion: null, parentId: null}); this.getInfo(scanTimeout + 500)});
    }, scanTimeout);

  }
  componentDidMount() {
    this.getInfo();
  }
  componentWillUnmount() {
    // cancel the server getInfo loop if still running
    clearTimeout(this._infoloop);
  }
  hoverOn = () => {
    this.setState({hover: true});
  }
  hoverOff = () => {
    this.setState({hover: false});
  }
  cancelConnect = (e) => {
    if (this.state.connecting) {
      console.log("ServerButton.cancelConnect "+this.props.location)
      this.setState({connecting: false});
      this.props.splash.enableAllInput();
      this.props.app.serverDisconnect();
      if (e) {e.stopPropagation();}
    }
  }
  serverConnect = () => {
    if (this.state.connecting) {
      this.cancelConnect();
    } else {
      console.log("ServerButton.serverConnect "+this.props.location);
      this.getInfo();
      this.props.splash.disableAllInput();
      this.setState({connecting: true});
      this.props.app.serverConnect(this.props.location);
    }
  }
  removeServer = (e) => {
    alert("this will eventually allow removing the entry from your list of scanned servers")
    if (e) {e.stopPropagation();}
  }
  render() {
    var btnClassName = "btn btn-transparent"
    if (!this.state.phoebeVersion) {
      btnClassName += " btn-transparent-disabled"
    }

    let locationText

    if (this.props.isSpawned) {
      if (this.state.phoebeVersion) {
        locationText = this.props.location + " (child process)"
      } else {
        locationText = "starting server as child process..."
      }
    } else {
      locationText = this.props.location
    }

    var locationSpan = <span style={{display: "inline-block", float: "left", textAlign: "center", width: "calc(100% - 200px)"}}>{locationText}</span>

    var style={}
    if (this.state.connecting) {
      style = {pointerEvents: "none"}
    }

    return (
      <div onMouseEnter={this.hoverOn} onMouseLeave={this.hoverOff} className="splash-scrollable-btn-div" style={style}>
        <span className={btnClassName} onClick={this.serverConnect} title={"connect to server at "+this.props.location+" running PHOEBE "+this.state.phoebeVersion}>
          <ServerStatusIcon phoebeVersion={this.state.phoebeVersion} connecting={this.state.connecting} server={this}/>
          <ServerVersionSpan phoebeVersion={this.state.phoebeVersion}/>
          {locationSpan}
          {this.props.isSpawned ?
            null
            :
            <span className="d-none d-sm-block" style={{marginLeft: "calc(100px - 20px)", display: "inline-block", height: "40px", width: "20px", float: "left"}} to="#" onClick={this.removeServer}>
              <span className="far fa-fw fa-trash-alt" style={{pointerEvents: "all", color: this.state.hover ? "inherit" : "transparent"}} title="remove server from list"/>
            </span>
          }

        </span>
      </div>
    )

  }
}
