import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';
import 'babel-polyfill';

import {toast} from 'react-toastify';
import Select from 'react-select'; // https://react-select.com/home

import {PSPanel} from './panel-ps';
import {LogoSpinner} from './logo';

// import FlipMove from 'react-flip-move'; // https://github.com/joshwcomeau/react-flip-move

import {Link, Twig, generatePath, abortableFetch, mapObject, filterObjectByKeys, popUpWindow} from './common';
// import {LogoSpinner} from './logo';
import {Panel} from './ui';
import {Tag} from './panel-tags';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

class ActionContentNewParameters extends Component {
  render() {
    return (
      <PSPanel app={this.props.app} bundleid={this.props.bundle.state.bundleid} bundle={this.props.bundle} PSPanelOnly={true} disableFiltering={true} showPopoutButton={false}/>
    )
  }
}


class ActionContentAdd extends Component {
  constructor(props) {
    super(props);
    this.state = {
      kind: null,
      component: null,
    }
  }

  onChangeKind = (e) => {
    this.setState({kind: e.value});
    this.props.onUpdatePacket({kind: e.value})
  }
  onChangeComponent = (e) => {
    this.setState({component: e.value});
    this.props.onUpdatePacket({component: e.value})
  }
  onChangeLabel = (e) => {
    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: e.target.value})
  }
  render() {
    var addType = this.props.action.split('_')[1]
    var availableKinds = this.props.app.state.serverAvailableKinds[addType]
    var availableKindsList = availableKinds.map((choice) => ({value: choice, label: choice}))

    var availableComponents = this.props.bundle.state.tags['components'] || ['']
    var availableComponentsList = availableComponents.map((choice) => ({value: choice, label: choice}))


    if (this.state.kind===null) {
      // then defaults based on kind
      var kind = {'dataset': 'lc', 'compute': 'phoebe', 'component': 'star', 'figure': 'lc'}[addType] || availableKinds[0]
      this.setState({kind: kind})
      this.props.onUpdatePacket({kind: kind})
    }

    if (addType=='feature' && this.state.component===null) {
      this.setState({component: availableComponents[0]})
      this.props.onUpdatePacket({component: availableComponents[0]})
    }

    return (
      <div>
        <div className="form-group">

          <label id="kind" style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>kind</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select options={availableKindsList}  value={{value: this.state.kind, label: this.state.kind}} onChange={this.onChangeKind} className="phoebe-parameter-choice" classNamePrefix="phoebe-parameter-choice"/>
          </span>
        </div>

        {addType==='feature' ?
          <div className="form-group">
            <label id="component" style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>component</label>
            <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
              <Select options={availableComponentsList} value={{value: this.state.component, label: this.state.component}} onChange={this.onChangeComponent} className="phoebe-parameter-choice" classNamePrefix="phoebe-parameter-choice"/>
            </span>
          </div>
        :
          null
        }

        <div className="form-group">
          <label id={addType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{addType}</label>
          <input type="text" id={addType} placeholder="automatically generated if empty" onChange={this.onChangeLabel} style={{width: "50%"}}></input>
        </div>

      </div>
    )
  }
}

class ActionContentRename extends Component {
  constructor(props) {
    super(props);
    this.state = {
      labelOld: null,
    }
  }

  onChangeLabelOld = (e) => {
    this.setState({labelOld: e.value});

    this.props.onUpdatePacket({['old_'+this.props.action.split('_')[1]]: e.value})
  }

  onChangeLabelNew = (e) => {
    this.props.onUpdatePacket({['new_'+this.props.action.split('_')[1]]: e.target.value})
  }
  render() {
    var renameType = this.props.action.split('_')[1]
    var availableLabels = this.props.bundle.state.tags[renameType+'s'] || [];
    var availableLabelsList = availableLabels.map((choice) => ({value: choice, label: choice}))

    if (this.state.labelOld===null) {
      // then defaults based on kind
      this.setState({labelOld: availableLabels[0]})
      this.props.onUpdatePacket({['old_'+renameType]: availableLabels[0]})
    }


    return (
      <div>
        <div className="form-group">

          <label id={"old_"+renameType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>old {renameType}</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select options={availableLabelsList} value={{value: this.state.labelOld, label: this.state.labelOld}} onChange={this.onChangeLabelOld} className="phoebe-parameter-choice" classNamePrefix="phoebe-parameter-choice"/>
          </span>
        </div>

        <div className="form-group">
          <label id={"new_"+renameType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>new {renameType}</label>
          <input type="text" id={"new_"+renameType} onChange={this.onChangeLabelNew} style={{width: "50%"}}></input>
        </div>

      </div>
    )
  }
}


class ActionContentRemove extends Component {
  constructor(props) {
    super(props);
    this.state = {
      label: null,
    }
  }

  onChangeLabel = (e) => {
    this.setState({label: e.value});

    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: e.value})
  }

  render() {
    var removeType = this.props.action.split('_')[1]
    var availableLabels = this.props.bundle.state.tags[removeType+'s'] || [];
    var availableLabelsList = availableLabels.map((choice) => ({value: choice, label: choice}))

    if (this.state.label===null) {
      // then defaults based on kind
      this.setState({label: availableLabels[0]})
      this.props.onUpdatePacket({[removeType]: availableLabels[0]})
    }


    return (
      <div>
        <div className="form-group">

          <label id={removeType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{removeType}</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select options={availableLabelsList} value={{value: this.state.label, label: this.state.label}} onChange={this.onChangeLabel} className="phoebe-parameter-choice" classNamePrefix="phoebe-parameter-choice"/>
          </span>
        </div>

      </div>
    )
  }
}

class ActionContentRun extends Component {
  constructor(props) {
    super(props);
    this.state = {
      label: null,
    }
  }

  onChangeLabel = (e) => {
    this.setState({label: e.value});

    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: e.value})
  }
  getNewType = () => {
    var runType = this.props.action.split('_')[1]
    if (runType == 'compute') {
      return 'model'
    }
    return null
  }

  onChangeLabelNew = (e) => {
    this.props.onUpdatePacket({[this.getNewType()]: e.target.value})
  }

  render() {
    var runType = this.props.action.split('_')[1]
    var availableLabels = this.props.bundle.state.tags[runType+'s'] || [];
    var availableLabelsList = availableLabels.map((choice) => ({value: choice, label: choice}))

    if (this.state.label===null) {
      // then defaults based on kind
      this.setState({label: availableLabels[0]})
      this.props.onUpdatePacket({[runType]: availableLabels[0]})
    }

    var newType = this.getNewType();


    return (
      <div>
        <div className="form-group">
          <label id={runType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{runType}</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select options={availableLabelsList} value={{value: this.state.label, label: this.state.label}} onChange={this.onChangeLabel} className="phoebe-parameter-choice" classNamePrefix="phoebe-parameter-choice"/>
          </span>

        </div>

        <div className="form-group">
          <label id={newType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{newType}</label>
          <input type="text" id={newType} placeholder="automatically generated if empty" onChange={this.onChangeLabelNew} style={{width: "50%"}}></input>

        </div>

      </div>
    )
  }
}



export class ActionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      waiting: false,
      redirect: null,
      actionActive: this.props.bundle.state.pendingBundleMethod === null,
      packet: {},
    };
  }
  onUpdatePacket = (packetChanges) => {
    var packet = this.state.packet
    packet.bundleid = this.props.bundle.state.bundleid
    packet.method = this.props.action
    for (const [key, value] of Object.entries(packetChanges)) {
      packet[key] = value
    }

    this.setState({packet: packet})
  }
  closePanel = () => {
    this.props.bundle.setQueryParams({tmp: []})
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, null, this.props.bundle.getSearchString())})
  }
  downloadRunAction = () => {
    alert("not yet implemented")
  }
  submitAction = () => {
    if (['remove'].indexOf(this.props.action.split('_')[0]) != -1) {
      alert("not yet impelemented")
      return
    }

    console.log("submitAction "+this.state.packet);
    var toastID = toast.info(this.props.action+" submitted... waiting for response", { autoClose: false, closeButton: false });

    this.props.bundle.setState({pendingBundleMethod: toastID});
    this.props.app.socket.emit('bundle_method', this.state.packet);

    if (this.props.action.split('_')[0] === 'add' || this.props.action.split('_')[0] === 'run') {
      // then we go to another screen once we receive tmpFilter
      this.setState({waiting: true});
    } else {
      this.closePanel();
    }

  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }

    var action = this.props.action.split("_")[0];
    var actionIcon = "fas fa-fw "
    var actionContent = null

    var tmpFilter = this.props.bundle.queryParams.tmp !== undefined && this.props.bundle.queryParams.tmp.length;

    if (this.state.waiting) {
      if (tmpFilter) {
        // then we need to stop waiting
        this.setState({waiting: false})
        this.props.bundle.setState({pendingBundleMethod: null})
      } else if (!this.props.bundle.state.pendingBundleMethod) {
        // then we should have received an error message, let's stop waiting
        this.closePanel();
      } else {
        actionContent =  <LogoSpinner pltStyle={{backgroundColor: "rgb(43, 113, 177)"}}/>
      }
    } else if (action == 'add') {
      actionIcon += 'fa-plus'
      if (tmpFilter) {
        actionContent = <ActionContentNewParameters app={this.props.app} bundle={this.props.bundle}/>
      } else {
        actionContent = <ActionContentAdd app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
      }

    } else if (action == 'rename') {
      actionIcon += 'fa-pen'
      actionContent = <ActionContentRename app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
    } else if (action == 'remove') {
      actionIcon += 'fa-minus'
      actionContent = <ActionContentRemove app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
    } else if (action == 'run') {
      actionIcon += 'fa-play'
      if (tmpFilter) {
        actionContent = <ActionContentNewParameters app={this.props.app} bundle={this.props.bundle}/>
      } else {
        actionContent = <ActionContentRun app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
      }
    }

    var actionStyle = {margin: '5px'}
    if (!this.state.actionActive) {
      actionStyle.pointerEvents = 'none'
      actionStyle.color = 'gray'
      actionStyle.borderColor = 'gray'
    }

    var buttons = null
    if (!this.state.waiting) {
      if (tmpFilter) {
        buttons = <div style={{float: "right"}}>
                    <span onClick={() => alert("not yet implemented")} className="btn btn-primary" style={{margin: "5px"}} title="remove any added parameters and cancel"><span className="fas fa-fw fa-minus"></span> remove</span>
                    <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}} title="accept changes and return to filtered parameters"><span className="fas fa-fw fa-chevron-right"></span> continue</span>
                </div>
      } else {
        buttons = <div style={{float: "right"}}>
                    <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}} title={"cancel "+this.props.action+" and return to filtered parameters"}><span className="fas fa-fw fa-times"></span> cancel</span>
                    { action === 'run' ?
                      <span onClick={this.downloadRunAction} className="btn btn-primary" style={{actionStyle}} title="download script to run on external machine"><span className="fas fa-fw fa-download"></span> download script</span>
                      :
                      null
                    }
                    <span onClick={this.submitAction} className="btn btn-primary" style={actionStyle} title={this.props.action}><span className={actionIcon}></span> {this.props.action}</span>
                </div>
      }
    }

    return (
      <Panel backgroundColor="#e4e4e4">
        <span>
          <h2 style={{display: "inline"}}>{this.props.action}</h2>
          {buttons}
        </span>

        <div style={{marginTop: "40px", minHeight: "calc(100% - 150px)"}}>
            {actionContent}
        </div>

        {buttons}


      </Panel>
    )
  }
}
