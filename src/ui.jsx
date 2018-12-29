import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {Link, generatePath} from './common';

export class Panel extends Component {
  render() {
    return (
      <div style={{padding: "10px", paddingTop: "20px", width: "100%", minHeight: "100%", overflowY: "auto", backgroundColor: this.props.backgroundColor}}>
        {this.props.children}
      </div>
    )
  }
}


class ToolbarButton extends Component {
  render() {
    return (
      <a className="btn btn-phoebe-toolbar" style={{height: "50px", minWidth: "50px", paddingLeft: 0, paddingRight: 0, marginLeft: "3px", marginRight: "3px"}} href={this.props.to} download={this.props.download} title={this.props.title} onClick={this.props.onClick}>
        <span className={"fa-fw fa-lg "+this.props.iconClassNames} style={{minWidth: "50px", textAlign: "center", marginTop: "10px"}}>
          {this.props.children}
        </span>
      </a>
    )
  }
}

export class Toolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirectTo: null,
    }

  }
  notImplementedAlert = () => {
    alert('not yet implemented')
  }
  newBundle = () => {
    // TODO: only ask for confirmation if this is the only client attached to this bundle AND there are no unsaved changed
    var result = confirm('You may lose any unsaved changes by closing the bundle.  Continue?')
    if (result) {
      this.setState({redirectTo: generatePath(this.props.app.state.serverHost)})
      // TODO: need to tell server that we're disconnecting from the bundle.
    }
  }
  openBundle = () => {
    // TODO: only ask for confirmation if this is the only client attached to this bundle AND there are no unsaved changed
    var result = confirm('You may lose any unsaved changes by closing the bundle.  Continue?')
    if (result) {
      this.setState({redirectTo: generatePath(this.props.app.state.serverHost, "open")})
      // TODO: need to tell server that we're disconnecting from the bundle.
    }
  }
  saveBundle = () => {
    // alert("downloading bundleid "+this.props.bundleid)
    var saveURL = "http://" + this.props.app.state.serverHost + "/save_bundle/" + this.props.bundleid
    window.location.href = saveURL
  }
  launchPythonClient = () => {
    console.log("Bundle.launchPythonClient")
    if (this.props.app.state.isElectron) {
      window.require('electron').remote.getGlobal('launchPythonClient')('import phoebe');
    } else {
      alert("cannot launch from webapp... eventually this will raise a modal with a script you can copy and paste into a terminal")
    }
  }
  render() {
    if (this.state.redirectTo) {
      return <Redirect to={this.state.redirectTo}/>
    }

    var divStyle = {position: "absolute", left: 0, top: 0, width: "100%", height: "50px"}

    if (!this.props.dark) {
      divStyle.backgroundColor = "#2B71B1"
      // divStyle.borderBottom = "2px solid #456583"
      divStyle.color = "#D6D6D6"
    }


    return (
      <div style={divStyle} className="toolbar">
        <div style={{float: "left", marginLeft: "0px"}}>
          <ToolbarButton iconClassNames="fas fa-file" title="new bundle" onClick={this.newBundle}/>
          <ToolbarButton iconClassNames="fas fa-folder-open" title="load/import bundle from file" onClick={this.openBundle}/>
          <ToolbarButton iconClassNames="fas fa-save" title="save bundle" to={"http://" + this.props.app.state.serverHost + "/bundle_save/" + this.props.bundleid} download={this.props.bundleid+".bundle"}/>
          <ToolbarButton iconClassNames="fas fa-undo" title="undo" onClick={this.notImplementedAlert}/>
          <ToolbarButton iconClassNames="fas fa-redo" title="redo" onClick={this.notImplementedAlert}/>
        </div>
        <div className="d-none d-lg-inline-block" style={{position: "absolute", width: "250px", left: "calc(50% - 125px)"}}>
          {/* <span className="btn btn-transparent" title="rerun model" style={{marginTop: "6px"}} onClick={this.notImplementedAlert}>
            <span className="fa-fw fa-lg fas fa-play" style={{marginRight: "4px"}}/>
            rerun latest model
          </span> */}
        </div>
        <div style={{float: "right", marginRight: "10px"}}>
          <ToolbarButton iconClassNames="fas fa-question" title="help" onClick={this.notImplementedAlert}/>
          <ToolbarButton iconClassNames="fas fa-terminal" title="open bundle in terminal client" onClick={this.launchPythonClient}/>
        </div>
      </div>

    )
  }
}


export class Statusbar extends Component {
  render() {
    var divStyle = {position: "absolute", left: 0, bottom: 0, width: "100%", height: "28px", fontWeight: "400", fontSize: "0.93m"}
    if (!this.props.dark) {
      divStyle.backgroundColor = "#2B71B1"
      // divStyle.borderTop = "2px solid #456583"
      divStyle.color = "#D6D6D6"
    } else {
      divStyle.color = "#D6D6D6"
    }

    let serverPath
    if (this.props.bundleid) {
      serverPath = generatePath(this.props.app.state.serverHost, this.props.bundleid, 'servers')
    } else {
      serverPath = generatePath()
    }


    return (
      <div style={divStyle} className="statusbar">
        <Link style={{fontWeight: "inherit", fontSize: "inherit"}} title="choose different server" to={serverPath}>
          <span className="fa-md fas fa-fw fa-broadcast-tower" style={{margin: "4px"}}/>
          <span style={{margin: "4px", border: "1px dotted #a1a1a1", paddingLeft: "2px", paddingRight: "2px"}}>{this.props.app.state.serverPhoebeVersion}</span>
          <span style={{margin: "4px"}}>{this.props.app.state.serverHost}</span>
        </Link>

        {this.props.bundleid ?
          <div className="d-none d-lg-inline">
            <span style={{marginLeft: "50px"}}>bundleid: {this.props.bundleid}</span>
            <span style={{marginLeft: "50px"}}>status: idle/waiting for confirmation/etc</span>
          </div>
          :
          null
        }

      </div>
    )
  }
}
