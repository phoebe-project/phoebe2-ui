import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {toast} from 'react-toastify';


// import FlipMove from 'react-flip-move'; // https://github.com/joshwcomeau/react-flip-move

import {Link, Twig, generatePath, abortableFetch, mapObject, filterObjectByKeys, popUpWindow} from './common';
// import {LogoSpinner} from './logo';
import {Panel} from './ui';
import {Tag} from './panel-tags';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron


class ActionContentAdd extends Component {
  constructor(props) {
    super(props);
    this.state = {
      kind: null,
    }
  }

  onChangeKind = (e) => {
    e.stopPropagation();
    e.preventDefault();

    this.setState({kind: e.target.value});
    this.props.onUpdatePacket({kind: e.target.value})
  }
  onChangeLabel = (e) => {
    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: e.target.value})
  }
  render() {
    var addType = this.props.action.split('_')[1]
    var availableKinds = this.props.app.state.serverAvailableKinds[addType]

    if (this.state.kind===null) {
      // then defaults based on kind
      var kind = {'dataset': 'lc', 'compute': 'phoebe', 'component': 'star', 'figure': 'lc'}[addType] || availableKinds[0]
      this.setState({kind: kind})
      this.props.onUpdatePacket({kind: kind})

    }

    return (
      <div>
        <div className="form-group">

          <label id="kind">kind</label>
          <select id="kind" value={this.state.kind} onChange={this.onChangeKind}>
            {availableKinds.map(choice => <option value={choice}>{choice}</option>)}
          </select>


          <label id={addType}>{addType}</label>
          <input type="text" id={addType} placeholder="automatically generated if empty" onChange={this.onChangeLabel}></input>
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
    e.stopPropagation();
    e.preventDefault();

    this.setState({labelOld: e.target.value});

    this.props.onUpdatePacket({['old_'+this.props.action.split('_')[1]]: e.target.value})
  }

  onChangeLabelNew = (e) => {
    this.props.onUpdatePacket({['new_'+this.props.action.split('_')[1]]: e.target.value})
  }
  render() {
    var renameType = this.props.action.split('_')[1]
    var availableLabels = this.props.bundle.state.tags[renameType+'s'] || [];

    if (this.state.labelOld===null) {
      // then defaults based on kind
      this.setState({labelOld: availableLabels[0]})
      this.props.onUpdatePacket({['old_'+renameType]: availableLabels[0]})
    }


    return (
      <div>
        <div className="form-group">

          <label id={"old_"+renameType}>old {renameType}</label>
          <select id={"old_"+renameType} value={this.state.labelOld} onChange={this.onChangeLabelOld}>
            {availableLabels.map(choice => <option value={choice}>{choice}</option>)}
          </select>


          <label id={"new_"+renameType}>new {renameType}</label>
          <input type="text" id={"new_"+renameType} onChange={this.onChangeLabelNew}></input>
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
    e.stopPropagation();
    e.preventDefault();

    this.setState({label: e.target.value});

    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: e.target.value})
  }

  render() {
    var removeType = this.props.action.split('_')[1]
    var availableLabels = this.props.bundle.state.tags[removeType+'s'] || [];

    if (this.state.label===null) {
      // then defaults based on kind
      this.setState({label: availableLabels[0]})
      this.props.onUpdatePacket({[removeType]: availableLabels[0]})
    }


    return (
      <div>
        <div className="form-group">

          <label id={removeType}>{removeType}</label>
          <select id={removeType} value={this.state.label} onChange={this.onChangeLabel}>
            {availableLabels.map(choice => <option value={choice}>{choice}</option>)}
          </select>
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
    e.stopPropagation();
    e.preventDefault();

    this.setState({label: e.target.value});

    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: e.target.value})
  }

  render() {
    var removeType = this.props.action.split('_')[1]
    var availableLabels = this.props.bundle.state.tags[removeType+'s'] || [];

    if (this.state.label===null) {
      // then defaults based on kind
      this.setState({label: availableLabels[0]})
      this.props.onUpdatePacket({[removeType]: availableLabels[0]})
    }


    return (
      <div>
        <div className="form-group">

          <label id={removeType}>{removeType}</label>
          <select id={removeType} value={this.state.label} onChange={this.onChangeLabel}>
            {availableLabels.map(choice => <option value={choice}>{choice}</option>)}
          </select>
        </div>

      </div>
    )
  }
}



export class ActionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, null, this.props.bundle.getSearchString())})
  }
  submitAction = () => {
    if (['run', 'remove'].indexOf(this.props.action.split('_')[0]) != -1) {
      alert("not yet impelemented")
      return
    }

    console.log("submitAction "+this.state.packet);
    var toastID = toast.info(this.props.action+" submitted... waiting for response", { autoClose: false, closeButton: false });
    this.props.bundle.setState({pendingBundleMethod: toastID});


    this.props.app.socket.emit('bundle_method', this.state.packet);
    this.closePanel();
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }

    var action = this.props.action.split("_")[0];
    var actionIcon = "fas fa-fw "
    var actionContent = null
    if (action == 'add') {
      actionIcon += 'fa-plus'
      actionContent = <ActionContentAdd app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
    } else if (action == 'rename') {
      actionIcon += 'fa-pen'
      actionContent = <ActionContentRename app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
    } else if (action == 'remove') {
      actionIcon += 'fa-minus'
      actionContent = <ActionContentRemove app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
    } else if (action == 'run') {
      actionIcon += 'fa-play'
      actionContent = <ActionContentRun app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
    }

    var actionStyle = {margin: '5px'}
    if (!this.state.actionActive) {
      actionStyle.pointerEvents = 'none'
      actionStyle.color = 'gray'
      actionStyle.borderColor = 'gray'
    }



    return (
      <Panel backgroundColor="#e4e4e4">
        <h2>{this.props.action}</h2>

        {actionContent}

        <div style={{float: "right", margin: "5px"}}>
          <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}}><span className="fas fa-fw fa-times"></span> cancel</span>
          <span onClick={this.submitAction} className="btn btn-primary" style={actionStyle}><span className={actionIcon}></span> {this.props.action}</span>
        </div>
      </Panel>
    )
  }
}
