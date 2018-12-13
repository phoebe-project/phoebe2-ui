import React, { Component } from 'react';
import fetch from 'node-fetch'; // https://github.com/bitinn/node-fetch

import {Link, Image, generatePath} from './common';

// import {history} from './history';
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
              <ServerButton location={"127.0.0.1:"+window.require('electron').remote.getGlobal('pyPort')} isSpawned={true} app={this.props.app} splash={this} match={this.props.match}/>
              :
              null
            }
            <ServerButton location="127.0.0.1:5555" app={this.props.app} splash={this}/>
            <ServerButton location="127.0.0.1:9999" app={this.props.app} splash={this}/>
            <ServerButton location="127.0.0.1:5000" app={this.props.app} splash={this}/>
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
    var style = {display: "inline-block", float: "left", marginTop: "4px", textAlign: "center", textDecoration: "none"}
    var to = null;
    var onClick = null;

    if (this.props.connecting) {
      title = "cancel connection"
      style.pointerEvents = "all"
      to = generatePath();
      onClick = this.props.serverButton.cancelConnect;
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
      <Link style={style} className={classes} title={title} to={to} onClick={onClick} onMouseEnter={()=>{this.setState({hover:true})}} onMouseLeave={()=>{this.setState({hover:false})}}></Link>
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
      onClick = this.props.serverButton.cancelConnection
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
      title = "this server is running PHOEBE "+this.props.phoebeVersion
    } else {
      style.opacity = "0.5"
      if (this.props.connecting) {
        text = "reconnecting"
        title = "waiting for server to reconnect"
      } else {
        text = "scanning"
        title = "scanning for PHOEBE server"
      }
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
    };
  }
  getInfo = (scanTimeout, cancelConnectIfFail) => {
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
        .catch(err => {
          // if (cancelConnectIfFail) {
          //   this.cancelConnect();
          //   history.goBack();
          // }
          this.setState({phoebeVersion: null, parentId: null});
          this.getInfo(scanTimeout + 500)
        });
    }, scanTimeout);

  }
  componentDidMount() {
    this.getInfo();
  }
  componentWillUnmount() {
    // cancel the server getInfo loop if still running
    clearTimeout(this._infoloop);
  }
  isConnecting = () => {
    // we don't need to check the serverStatus... if this was connected we shouldn't be on this page
    return this.props.app.state.serverHost===this.props.location
    // return this.props.app.state.serverStatus === 'connecting' && this.props.app.state.serverHost===this.props.location
  }
  hoverOn = () => {
    this.setState({hover: true});
  }
  hoverOff = () => {
    this.setState({hover: false});
  }
  cancelConnect = (e) => {
    if (this.isConnecting()) {
      console.log("ServerButton.cancelConnect "+this.props.location)
      // if (this.props.match.params.bundleid) {
      //   alert("TODO: add a confirmation before disconnecting if bundleid is present in URL")
      // }
      this.props.splash.enableAllInput();
      this.props.app.serverDisconnect();
      if (e) {e.stopPropagation();}
    }
  }
  serverConnect = () => {
    console.log("ServerButton.serverConnect "+this.props.location);
    this.getInfo(0, true);
    this.props.splash.disableAllInput();
    this.props.app.serverConnect(this.props.location);
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
    if (this.isConnecting()) {
      style = {pointerEvents: "none"}
    }

    return (
      <div onMouseEnter={this.hoverOn} onMouseLeave={this.hoverOff} className="splash-scrollable-btn-div" style={style}>
        <Link className={btnClassName} to={generatePath(this.props.location)} title={"connect to server at "+this.props.location+" running PHOEBE "+this.state.phoebeVersion}>
          <ServerStatusIcon phoebeVersion={this.state.phoebeVersion} connecting={this.isConnecting()} serverButton={this}/>
          <ServerVersionSpan phoebeVersion={this.state.phoebeVersion} connecting={this.isConnecting()}/>
          {locationSpan}
          {this.props.isSpawned ?
            null
            :
            <span className="d-none d-sm-block" style={{marginLeft: "calc(100px - 20px)", display: "inline-block", height: "40px", width: "20px", float: "left"}} to="#" onClick={this.removeServer}>
              <span className="far fa-fw fa-trash-alt" style={{pointerEvents: "all", color: this.state.hover ? "inherit" : "transparent"}} title="remove server from list"/>
            </span>
          }

        </Link>
      </div>
    )

  }
}
