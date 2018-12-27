import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {Link, generatePath, abortableFetch} from './common';

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
  // componentDidMount = () => {
  //   if (this.props.match.params.bundleid) {
  //     this.disableAllInput();
  //   }
  // }
  render() {
    var bundleid = this.props.match.params.bundleid

    let autoconnect
    if (this.props.app.state.isElectron) {
      autoconnect = this.props.app.state.settingsServerHosts.length === 0
    } else {
      autoconnect = this.props.app.state.settingsServerHosts.length === 1
    }

    autoconnect = autoconnect && this.props.app.state.serverAllowAutoconnect && !bundleid

    return(
      <div className="App content-dark">
        <LogoSplash animationEffect="animateShimmer"/>

        <div className="splash-scrollable-header">
          {/* <p>Desktop application id: {remote.getGlobal('appid')}</p> */}
          {/* <p>Current connection: {this.props.app.state.serverHost} ({this.props.app.state.serverStatus})</p> */}

          <p style={{textAlign: "center", marginBottom: "0px", paddingLeft: "10px", paddingRight: "10px"}}>
            {bundleid ?
              <b>Switch to Server</b>
              :
              <b>Connect to Server</b>
            }

            {/* <Link style={{float: "right"}} title="configure server settings" to="/settings/servers"><span className="fas fa-fw fa-cog"/></Link> */}
          </p>

          <div ref={this.splashScrollable} className="splash-scrollable">
            { this.props.app.state.isElectron ?
              <ServerButton key={location} location={"localhost:"+window.require('electron').remote.getGlobal('pyPort')} autoconnect={autoconnect} switchServer={this.props.switchServer} isSpawned={true} app={this.props.app} splash={this} match={this.props.match}/>
              :
              null
            }
            {this.props.app.state.settingsServerHosts.map(location => <ServerButton key={location} location={location} autoconnect={autoconnect} switchServer={this.props.switchServer} app={this.props.app} splash={this} match={this.props.match}/>)}
            <ServerAddButton app={this.props.app}/>

          </div>
        </div>
      </div>
    );
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
    // this.props.status ('connecting', 'connected', null)
    let title
    var classes = "fas fa-fw"
    var style = {display: "inline-block", float: "left", marginTop: "4px", textAlign: "center", textDecoration: "none"}
    var to = null;
    var onClick = null;

    if (this.props.status) {
      if (this.props.status === 'connecting') {
        title = "cancel connection"
      } else {
        title = "cancel connection and close bundle"
      }
      style.pointerEvents = "all"
      to = generatePath();
      onClick = this.props.serverButton.cancelConnect;
      if (this.state.hover) {
        classes += " fa-times"
      } else if (this.props.status === 'connecting'){
        classes += " fa-circle-notch fa-spin"
      } else {
        classes += " fa-check"
      }
    } else if (this.props.autoconnect) {
      title = "waiting, will autoconnect"
      classes += " fa-circle-notch fa-spin"
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

class ServerVersionSpan extends Component {
  render() {
    let text, title
    var style = {display: "inline-block", float: "left", width: "60px", marginLeft: "5px", marginRight: "15px", textAlign: "center"}
    if (this.props.phoebeVersion) {
      style.border = "1px dotted #a1a1a1"
      text = this.props.phoebeVersion
      title = "this server is running PHOEBE "+this.props.phoebeVersion
    } else if (this.props.autoconnect) {
      style.opacity = "0.5"
      text = "autoconnect"
      title = "waiting for server... will autoconnect once available"
    } else {
      style.opacity = "0.5"
      if (this.props.status === 'connecting') {
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
      removeConfirmed: false,
      status: null,
    };
  }
  getInfo = (scanTimeout, cancelConnectIfFail) => {
    var location = this.props.location;
    if (!location.startsWith("http://")) {
      location = "http://" + location
    }

    scanTimeout = scanTimeout || 0;
    if (scanTimeout > 5000) {
      scanTimeout = 5000
    }
    if (this.props.isSpawned && !this.state.phoebeVersion) {
      // then we're probably waiting, so let's keep this at 1 s
      scanTimeout = 1000
    }

    this._infoloop = setTimeout( () => {
      console.log("Server.getInfo "+location+" with timeout: "+scanTimeout);

      // now we want to ping the server and retrieve the phoebe-version, etc
      // if any of this fails, we'll enter the catch section and ignore this matching
      // if the test succeeds, update the entry in component.state
      // this will then automatically queue a re-render of the underlying component
      abortableFetch(location+"/info")
        .then(res => res.json())
        .then(json => {
          this.setState({phoebeVersion: json.data.phoebe_version, parentId: json.data.parentid})
          this.getInfo(5000)
        })
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
    // this.componentDidUpdate();
  }
  componentDidUpdate() {
    var status = null
    if (this.props.app.state.serverHost===this.props.location) {
      if (this.props.switchServer) {
        status = 'connected'
      } else {
        status = 'connecting'
      }
    }
    if (status !== this.state.status) {
      this.setState({status: status});
    }
  }
  componentWillUnmount() {
    // cancel the server getInfo loop if still running
    console.log("ServerButton.componentWillUnmount "+this.props.location)
    clearTimeout(this._infoloop);
  }
  hoverOn = () => {
    this.setState({hover: true});
  }
  hoverOff = () => {
    this.setState({hover: false});
  }
  cancelConnect = (e) => {
    console.log("ServerButton.cancelConnect "+this.props.location)
    if (e) {e.stopPropagation();}

    if (this.state.status) {
      var doDisconnect = true
      if (this.state.status==='connected') {
        doDisconnect = confirm("Disconnecting will close the bundle and any unsaved changes will be lost.  Continue?")
      }

      if (doDisconnect) {
        // if (this.props.match.params.bundleid) {
        //   alert("TODO: add a confirmation before disconnecting if bundleid is present in URL")
        // }
        this.props.splash.enableAllInput();
        this.props.app.serverDisconnect();
      } else {
        e.preventDefault();
      }
    }
  }
  // serverConnect = () => {
  //   console.log("ServerButton.serverConnect "+this.props.location);
  //   this.getInfo(0, true);
  //   this.props.splash.disableAllInput();
  //   this.props.app.serverConnect(this.props.location);
  // }
  removeServer = (e) => {
    if (this.state.removeConfirmed) {
      this.props.app.setState({serverAllowAutoconnect: false})
      this.props.app.updateSetting('settingsServerHosts', this.props.app.state.settingsServerHosts.filter(item => item !== this.props.location))
    } else {
      this.setState({removeConfirmed: true})
    }
    if (e) {e.stopPropagation(); e.preventDefault(); return false;}
  }
  render() {
    if (this.props.autoconnect && this.state.phoebeVersion && this.props.app.state.serverAllowAutoconnect && !this.state.status) {
      this.props.app.setState({serverAllowAutoconnect: false})
      return <Redirect to={generatePath(this.props.location)}/>
    }

    var btnClassName = "btn btn-transparent"
    if (!this.state.phoebeVersion) {
      btnClassName += " btn-transparent-disabled"
    }

    let locationText

    if (this.props.isSpawned) {
      if (this.state.phoebeVersion || !this.props.app.state.serverStartingChildProcess) {
        locationText = this.props.location + " (child process)"
      } else {
        locationText = "starting server as child process..."
      }
    } else {
      locationText = this.props.location
    }

    var style={}
    if (this.state.status==='connecting' || this.state.removeConfirmed) {
      style = {pointerEvents: "none"}
    }


    var removeStyle = {pointerEvents: "all"}
    if (this.state.removeConfirmed) {
      btnClassName += " btn-transparent-remove"
      removeStyle.color = "red"
      locationText = "click again to confirm removal"
    } else if (!this.state.hover) {
      removeStyle.color = "transparent"
    }

    var locationSpan = <span style={{display: "inline-block", float: "left", textAlign: "center", width: "calc(100% - 200px)"}}>{locationText}</span>

    var to = generatePath(this.props.location);
    if (this.props.match.params.bundleid) {
      // TODO: will need to send messages to new/old server and copy the bundle over - possibly getting a new ID
      to = generatePath(this.props.location, this.props.match.params.bundleid);
    }

    return (
      // NOTE: we use onMouseOver instead of onMouseEnter here so that it is triggered when a server above is removed
      <div onMouseOver={this.hoverOn} onMouseLeave={this.hoverOff} className="splash-scrollable-btn-div" style={style}>
        <Link className={btnClassName} to={to} title={"connect to server at "+this.props.location+" running PHOEBE "+this.state.phoebeVersion}>
          <ServerStatusIcon phoebeVersion={this.state.phoebeVersion} status={this.state.status} autoconnect={this.props.autoconnect} serverButton={this}/>
          <ServerVersionSpan phoebeVersion={this.state.phoebeVersion} status={this.state.status} autoconnect={this.props.autoconnect}/>
          {locationSpan}
          {this.props.isSpawned || this.state.status ?
            null
            :
            <span className="d-none d-sm-block" style={{marginLeft: "calc(100px - 20px)", display: "inline-block", width: "20px", float: "left"}} to="#" onClick={this.removeServer} onMouseLeave={()=>{this.setState({removeConfirmed:false})}}>
              <span className="far fa-fw fa-trash-alt" style={removeStyle} title="remove server from list"/>
            </span>
          }

        </Link>
      </div>
    )

  }
}

class ServerAddButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      enterInfo: false,
    };
    this.serverLocationInput = React.createRef()
  }
  addServer = (e) => {
    var newServer = this.serverLocationInput.current.value
    var servers = this.props.app.state.settingsServerHosts
    // TODO: more validation that this is an acceptable value... otherwise we're just asking for failures in the entry
    if (servers.indexOf(newServer)===-1) {
      servers.push(newServer)
      this.props.app.updateSetting('settingsServerHosts', servers)
    } else {
      alert(newServer+" was already in the list of servers")
    }
    this.setState({enterInfo: false})
    if (e) {e.stopPropagation();}
  }
  componentDidUpdate() {
    if (this.state.enterInfo) {
      this.serverLocationInput.current.focus();
    }
  }
  render() {
    return (
      <div onClick={()=>{this.setState({enterInfo: true}); this.props.app.setState({serverAllowAutoconnect: false})}} className="splash-scrollable-btn-div">
        {this.state.enterInfo ?
          <div>
            <button className="btn btn-transparent" title="cancel" onClick={(e)=>{this.setState({enterInfo: false}); e.stopPropagation()}} style={{width: "40px", marginBottom: "2px", marginRight: "2px"}}><span className="fa fa-times"/></button>
            <input ref={this.serverLocationInput} type="text" name="Server Location" className="form-control" placeholder="localhost:5555" style={{backgroundColor: "#2b71b1", color: "white", display: "inline-block", height: "40px", width: "calc(100% - 84px)"}} />
            <button className="btn btn-transparent" title="add server" onClick={this.addServer} style={{width: "40px", marginBottom: "2px", marginLeft: "2px"}}><span className="fa fa-check"/></button>
          </div>
          :
          <span className="btn btn-transparent" title="add new server">
            <span className="fas fa-plus"/>
          </span>
        }

      </div>
    )

  }
}
