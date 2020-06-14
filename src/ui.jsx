import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {Link, generatePath, getServerWarning} from './common';

var versionCompare = require('semver-compare');  // function that returns -1, 0, 1

export class Panel extends Component {
  render() {
    return (
      <React.Fragment>
        {this.props.inactive ?
          <div style={{position: 'absolute', width: "100%", height: "100%", backgroundColor: "rgba(128,128,128,0.6)"}}/>
          :
          null
        }
        <div style={{padding: "10px", paddingTop: "20px", width: "100%", minHeight: this.props.minHeight || "100%", overflowY: "auto", backgroundColor: this.props.backgroundColor}}>
          {this.props.children}
        </div>
      </React.Fragment>
    )
  }
}


class ToolbarButton extends Component {
  render() {
    return (
      <a className="btn btn-phoebe-toolbar" style={{height: "50px", minWidth: "50px", paddingLeft: 0, paddingRight: 0, marginLeft: "3px", marginRight: "3px"}} href={this.props.to} download={this.props.download} title={this.props.title} onClick={this.props.onClick} target={this.props.target}>
        <span className="fa-layers">
          <i className={"fas fa-fw fa-lg "+this.props.iconClassNames} style={{minWidth: "50px", textAlign: "center", marginTop: "10px"}}></i>
          {/* {this.props.counter ?
            <span class="fa-layers-counter" style={{backgroundColor: 'blue', color: 'white'}}>{this.props.counter}</span>
            :
            null
          } */}
        </span>
      </a>
    )
  }
}

export class Toolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null,
    }

  }
  notImplementedAlert = () => {
    alert('not yet implemented')
  }
  newBundle = () => {
    // TODO: only ask for confirmation if this is the only client attached to this bundle AND there are no unsaved changed
    var text = ""
    // TODO: if unsaved changes only
    text += "You may lose any unsaved changed by closing the bundle.  "
    if (this.props.bundle && this.props.bundle.childrenWindows.length) {
      text += "All pop-out windows will be closed.  "
    }
    text += "Continue?"

    var result = confirm(text)
    if (result) {
      this.props.bundle.closePopUps();
      this.props.bundle.clearQueryParams();
      this.props.bundle.deregisterBundle();
      this.setState({redirect: generatePath(this.props.app.state.serverHost)})
      // TODO: need to tell server that we're disconnecting from the bundle.
    }
  }
  openBundle = () => {
    // TODO: only ask for confirmation if this is the only client attached to this bundle AND there are no unsaved changed
    var text = ""
    // TODO: if unsaved changes only
    text += "You may lose any unsaved changed by closing the bundle.  "
    if (this.props.bundle && this.props.bundle.childrenWindows.length) {
      text += "All pop-out windows will be closed.  "
    }
    text += "Continue?"

    var result = confirm(text)
    if (result) {
      this.props.bundle.closePopUps();
      this.props.bundle.clearQueryParams();
      this.props.bundle.deregisterBundle();
      this.setState({redirect: generatePath(this.props.app.state.serverHost, "open")})
      // TODO: need to tell server that we're disconnecting from the bundle.
    }
  }
  redirect = (path) => {
    this.setState({redirect: path})
  }
  redirectJobs = () => {
    this.props.bundle.setQueryParams({tmp: '"qualifier:detached_job"'})
    this.redirect(generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, "jobs", this.props.bundle.getSearchString()))
  }
  redirectSettings = () => {
    this.redirect(generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, "settings", this.props.bundle.getSearchString()))
  }
  launchPythonClient = () => {
    console.log("Bundle.launchPythonClient")

    var code = 'import phoebe;'

    const loglevel = this.props.app.getSettingFromStorage('python_loglevel') || 'warning'
    if (loglevel !== 'none') {
      code += ' logger=phoebe.logger(\''+loglevel+'\');'
    }
    code += ' b=phoebe.Bundle.from_server(\''+this.props.bundleid+'\', \''+this.props.app.state.serverHost+'\');'
    console.log("python_cmd: "+python_cmd)
    console.log("code: "+code)
    var terminal_cmd = this.props.app.getSettingFromStorage('terminal_cmd') || 'xterm -e'
    if (this.props.app.state.isElectron) {
      if (terminal_cmd === 'alert') {
        window.require('electron').remote.getGlobal('electronPrompt')('Manually launch Python client', 'Paste the following into your favorite Python console<br/>(or go to settings to configure automatic options): ', code, 450)
      } else {
        var python_cmd = this.props.app.getSettingFromStorage('python_cmd') || null;
        if (python_cmd === null) {
          alert("must first confirm or choose the command to launch python shell from settings")
          return this.redirectSettings();
        }
        const s = terminal_cmd.indexOf(' ')
        var terminal_args = []
        if (s!==-1) {
          terminal_args = terminal_cmd.slice(s+1).split(' ')
        }
        console.log("terminal_cmd "+terminal_cmd.slice(0,s))
        console.log("terminal_args "+terminal_args)
        window.require('electron').remote.getGlobal('launchPythonClient')(terminal_cmd.slice(0, s), terminal_args, python_cmd, code+'print(\\"'+code+'\\")');
      }
    } else {
      prompt("Install the dedicated desktop application to automatically launch an interactive Python console.  From the web app, you can load this bundle in a Python console by manually pasting the following: ", code);
    }
  }
  componentDidUpdate() {
    if (this.state.redirect) {
      this.setState({redirect: null})
    }
  }
  render() {
    if (this.state.redirect) {
      return <Redirect to={this.state.redirect}/>
    }

    var divStyle = {position: "absolute", left: 0, top: 0, width: "100%", height: "50px"}

    if (!this.props.dark) {
      divStyle.backgroundColor = "#2B71B1"
      // divStyle.borderBottom = "2px solid #456583"
      divStyle.color = "#D6D6D6"
    }

    var nPollingJobs = Object.keys(this.props.bundle.state.pollingJobs).length;
    // var nPollingJobs = 2


    return (
      <div style={divStyle} className="toolbar">
        <div style={{float: "left", marginLeft: "0px"}}>
          <ToolbarButton iconClassNames="fas fa-file" title="new bundle" onClick={this.newBundle}/>
          <ToolbarButton iconClassNames="fas fa-folder-open" title="load/import bundle from file" onClick={this.openBundle}/>
          <ToolbarButton iconClassNames="fas fa-save" title="save bundle" to={"http://" + this.props.app.state.serverHost + "/save_bundle/" + this.props.bundleid} download={this.props.bundleid+".bundle"} target={this.props.app.state.isElectron ? null : "_blank"}/>
          {/* <ToolbarButton iconClassNames="fas fa-undo" title="undo" onClick={this.notImplementedAlert}/>
          <ToolbarButton iconClassNames="fas fa-redo" title="redo" onClick={this.notImplementedAlert}/> */}
          { nPollingJobs > 0 ?
            <ToolbarButton iconClassNames="fas fa-tasks" counter={nPollingJobs} title="access running tasks" onClick={this.redirectJobs}/>
            :
            null
          }

        </div>
        <div className="d-none d-lg-inline-block" style={{position: "absolute", width: "250px", left: "calc(50% - 125px)"}}>
          {/* <span className="btn btn-transparent" title="rerun model" style={{marginTop: "6px"}} onClick={this.notImplementedAlert}>
            <span className="fa-fw fa-lg fas fa-play" style={{marginRight: "4px"}}/>
            rerun latest model
          </span> */}
        </div>
        <div style={{float: "right", marginRight: "10px"}}>
          {/*<ToolbarButton iconClassNames="fas fa-question" title="help" onClick={this.notImplementedAlert}/>*/}
          <ToolbarButton iconClassNames="fas fa-sliders-h" title="open settings" onClick={this.redirectSettings}/>
          <ToolbarButton iconClassNames="fas fa-terminal" title="open bundle in python client" onClick={this.launchPythonClient}/>
        </div>
      </div>

    )
  }
}

class UpdateButton extends Component {
  render() {
    return (
      <Link href={this.props.href} target="_blank" title={this.props.title} style={{marginLeft: "5px", marginRight: "5px", paddingLeft: "5px", paddingRight: "5px", border: "2px solid white", borderRadius: "4px", fontWeight: "normal", fontVariant: "all-small-caps", paddingBottom: "4px", paddingTop: "2px"}}>{this.props.children}</Link>
    )
  }
}

class ServerUpdateButton extends Component {
  render() {
    if (this.props.latestServerVersion === null || this.props.serverVersion === null) {
      return (null)
    }
    const updateAvailable = versionCompare(this.props.serverVersion, this.props.latestServerVersion) == -1
    if (!updateAvailable) { // || this.props.serverVersion === 'devel'
      return (null)
    }

    return (
      <UpdateButton href={"http://phoebe-project.org/releases/"+this.props.latestServerVersion.slice(0, this.props.latestServerVersion.lastIndexOf("."))} title={"install instructions for PHOEBE v"+this.props.latestServerVersion}>server v{this.props.latestServerVersion} available</UpdateButton>
    )
  }
}

class ClientUpdateButton extends Component {
  render() {
    if (this.props.latestClientVersion === null || this. props.clientVersion === null) {
      return (null)
    }
    const updateAvailable = versionCompare(this.props.clientVersion, this.props.latestClientVersion) == -1
    if (!updateAvailable) {
      return (null)
    }


    return (
      <UpdateButton href="http://phoebe-project.org/clients" title={"download client v"+this.props.latestClientVersion}>client v{this.props.latestClientVersion} available</UpdateButton>
    )
  }
}


export class Statusbar extends Component {
  changeServerWarning = (e) => {
    if (this.props.bundle && this.props.bundle.childrenWindows.length) {
      var result = confirm('All popout windows will be closed when changing servers.  Continue?')
      if (result) {
        this.props.bundle.closePopUps();
      } else {
        e.preventDefault();
        e.stopPropagation();
      }
    }

  }
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

    var clientType = "web"
    if (this.props.app.state.isElectron) {
      clientType = "desktop"
    }

    var serverTitle = "The server is running PHOEBE "+this.props.app.state.serverPhoebeVersion+"."
    var serverVersionStyle = {margin: "4px", border: "1px dotted #a1a1a1", paddingLeft: "2px", paddingRight: "2px"}
    var serverWarning = getServerWarning(this.props.app.state.serverPhoebeVersion)
    if (serverWarning) {
      serverVersionStyle.color = 'orange'
      serverTitle += '  The client v'+this.props.app.state.clientVersion+' provides the following compatibility warning: '+serverWarning+". "
    }
    serverTitle += "(click to choose a different server)"


    var clientTitle = clientType+" client v"+this.props.app.state.clientVersion+" with id: "+this.props.app.state.clientid
    var clientVersionStyle = {margin: "4px", border: "1px dotted #a1a1a1", paddingLeft: "2px", paddingRight: "2px"}
    var clientWarning = this.props.app.state.clientWarning
    if (clientWarning) {
      clientVersionStyle.color = 'orange'
      clientTitle += '.  The current server provides the following compatibility warning: '+clientWarning
    }



    return (
      <div style={divStyle} className="statusbar">
        {this.props.app.state.serverHost !== null && this.props.app.state.serverHost.indexOf('phoebe-project.org') === -1 ?
          <ServerUpdateButton serverVersion={this.props.app.state.serverPhoebeVersion} latestServerVersion={this.props.app.state.latestServerVersion}/>
          :
          null
        }
        {this.props.app.state.serverHost !== null ?
          <Link style={{fontWeight: "inherit", fontSize: "inherit"}} title={serverTitle} onClick={this.changeServerWarning} to={serverPath}>
            <span className="fa-md fas fa-fw fa-broadcast-tower" style={{margin: "4px"}}/>
            <span style={serverVersionStyle}>{this.props.app.state.serverPhoebeVersion}</span>
            <span style={{margin: "4px"}}>{this.props.app.state.serverHost}</span>
          </Link>
        :
        null
      }


        <span style={{float: "right", marginRight: "10px"}} title={clientTitle}>
          <span className={this.props.app.state.isElectron ? "fa-md fas fa-fw fa-desktop" : "fa-md fas fa-fw fa-window-maximize"} style={{margin: "4px"}}/>
          <span style={clientVersionStyle}>{this.props.app.state.clientVersion}</span> {this.props.app.state.clientid}
          {this.props.app.state.isElectron ?
            <ClientUpdateButton clientVersion={this.props.app.state.clientVersion} latestClientVersion={this.props.app.state.latestClientVersion} />
            :
            null
            // <ClientUpdateButton clientVersion={this.props.app.state.clientVersion} latestClientVersion={this.props.app.state.latestClientVersion} />
          }
        </span>


      </div>
    )
  }
}
