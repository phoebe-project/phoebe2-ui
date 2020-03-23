import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';
import 'babel-polyfill';
import cloneDeep from 'lodash/cloneDeep';


import {toast} from 'react-toastify';
import ToggleButton from 'react-toggle-button'; // https://www.npmjs.com/package/react-toggle-button
import Select from 'react-select'; // https://react-select.com/home
import CreatableSelect from 'react-select/creatable'; // https://react-select.com/creatable
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

import {FigurePanelWidth} from './panel-figures';
import {PSPanel} from './panel-ps';
import {LogoSpinner} from './logo';

// import FlipMove from 'react-flip-move'; // https://github.com/joshwcomeau/react-flip-move

import {Link, Twig, generatePath, abortableFetch, mapObject, filterObjectByKeys, popUpWindow, FileReader} from './common';
// import {LogoSpinner} from './logo';
import {Panel} from './ui';
import {Tag} from './panel-tags';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

class ActionContentNewParameters extends Component {
  render() {
    return (
      <PSPanel app={this.props.app} bundleid={this.props.bundle.state.bundleid} bundle={this.props.bundle} orderBy={this.props.orderBy} PSPanelOnly={true} disableFiltering={true} showPopoutButton={false}/>
    )
  }
}


class ActionContentImport extends Component {
  constructor(props) {
    super(props);
    this.state = {
      file: null
    }
  }
  onChangeFile = (event) => {
    const file = event.target.files[0];
    this.setState({file: file});
    // console.log(file)
    var reader = new window.FileReader();
    reader.onload = this.onLoadFileHandler;
    reader.readAsText(file, "UTF-8");

  }
  onLoadFileHandler = (event) => {
    // console.log(event.target.result)
    this.props.onUpdatePacket({fname: event.target.result})

  }

  onChangeLabel = (inputValue, actionMeta) => {
    var value = null
    if (inputValue !== null) {
      value = inputValue.value
    }
    console.log("onChangeLabel: "+value)
    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: value})
  }
  render() {
    var addType = this.props.context;

    var labelChoices = this.props.bundle.state.tags.models || [];
    var labelChoicesList = labelChoices.map((choice) => ({value: choice, label: choice +' (overwrite)'}))

    return (
      <div>
        <div className="form-group">
          <label id={"file"} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>import from file</label>

          <input
            className="model-input"
            type="file"
            ref={input => {
              this.filesInput = input;
            }}
            name="file"
            placeholder={null}
            onChange={this.onChangeFile}
          />

          <label id={addType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{addType}</label>

          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <CreatableSelect isClearable={true} onChange={this.onChangeLabel} options={labelChoicesList} placeholder={"(automatically generate)"}/>
          </span>
        </div>
      </div>
    )
  }
}

class ActionContentAdd extends Component {
  constructor(props) {
    super(props);
    this.state = {
      kind: null,
      component: null,
      dataset: null,
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
  onChangeDataset = (e) => {
    this.setState({dataset: e.value});
    this.props.onUpdatePacket({dataset: e.value})
  }
  // onChangeLabel = (e) => {
  //   this.props.onUpdatePacket({[this.props.action.split('_')[1]]: e.target.value})
  // }
  onChangeLabel = (inputValue, actionMeta) => {
    var value = null
    if (inputValue !== null) {
      value = inputValue.value
    }
    console.log("onChangeLabel: "+value)
    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: value})
  }
  render() {
    var addType = this.props.action.split('_')[1]
    var availableKinds = this.props.app.state.serverAvailableKinds[addType]
    var availableKindsList = availableKinds.map((choice) => ({value: choice, label: choice}))

    if (addType=='feature'){
      var availableComponents = this.props.bundle.state.tags['components'] || ['']
      var availableComponentsList = availableComponents.map((choice) => ({value: choice, label: choice}))

      var availableDatasets = this.props.bundle.state.tags['datasets'] || ['']
      var availableDatasetsList = availableDatasets.map((choice) => ({value: choice, label: choice}))

      const contextsForFeatureKind = {'spot': ['component'], 'pulsation': ['component'], 'gaussian_process': ['dataset']}
      var contextsForFeature = contextsForFeatureKind[this.state.kind] || ['component']
    }

    if (this.state.kind===null) {
      // then defaults based on kind
      var kind = {'dataset': 'lc', 'compute': 'phoebe', 'component': 'star', 'figure': 'dataset.lc'}[addType] || availableKinds[0]
      this.setState({kind: kind})
      this.props.onUpdatePacket({kind: kind})
    }

    if (addType=='feature') {
      // alert(contextsForFeature)
      if (contextsForFeature.indexOf('component') === -1) {
        if (this.state.component !== null) {
          this.props.onUpdatePacket({component: null})
          this.setState({component: null})
        }
      } else if (this.state.component === null) {
        this.setState({component: availableComponents[0]})
        this.props.onUpdatePacket({component: availableComponents[0]})
      }

      if (contextsForFeature.indexOf('dataset') === -1) {
        if (this.state.dataset !== null) {
          this.props.onUpdatePacket({dataset: null})
          this.setState({dataset: null})
        }
      } else if (this.state.dataset === null) {
        this.setState({dataset: availableDatasets[0]})
        this.props.onUpdatePacket({dataset: availableDatasets[0]})
      }
    }


    var labelChoices = this.props.bundle.state.tags[addType+'s'] || [];
    var labelChoicesList = labelChoices.map((choice) => ({value: choice, label: choice +' (overwrite)'}))

    return (
      <div>
        <div className="form-group">

          <label id="kind" style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>kind</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select options={availableKindsList}  value={{value: this.state.kind, label: this.state.kind}} onChange={this.onChangeKind}/>
          </span>
        </div>

        {addType==='feature' && contextsForFeature.indexOf('component') !== -1 ?
          <div className="form-group">
            <label id="component" style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>component</label>
            <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
              <Select options={availableComponentsList} value={{value: this.state.component, label: this.state.component}} onChange={this.onChangeComponent}/>
            </span>
          </div>
        :
          null
        }

        {addType==='feature' && contextsForFeature.indexOf('dataset') !== -1 ?
          <div className="form-group">
            <label id="dataset" style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>dataset</label>
            <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
              <Select options={availableDatasetsList} value={{value: this.state.dataset, label: this.state.dataset}} onChange={this.onChangeDataset}/>
            </span>
          </div>
        :
          null
        }

        <div className="form-group">
          <label id={addType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{addType}</label>
          {/* <input type="text" id={addType} placeholder="automatically generated if empty" onChange={this.onChangeLabel} style={{width: "50%"}}></input> */}
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <CreatableSelect isClearable={true} onChange={this.onChangeLabel} options={labelChoicesList} placeholder={"(automatically generate)"}/>
          </span>
        </div>

      </div>
    )
  }
}

class ActionContentAddDistribution extends Component {
  constructor(props) {
    super(props);
    this.state = {
      parameters: [],
      alreadyLoadedLastActive: false
    }
  }
  onChangeLabel = (inputValue, actionMeta) => {
    var value = null
    if (inputValue !== null) {
      value = inputValue.value
    }
    // console.log("onChangeLabel: "+value)
    this.props.onUpdatePacket({distribution: value})
  }
  onChangeParameters = (e) => {
    if (e) {
      this.props.onUpdatePacket({uniqueid: e.map(item => item.value)})
      this.setState({parameters: e})

    } else {
      this.props.onUpdatePacket({uniqueid: ""})
      this.setState({parameters: []})
    }
  }

  render() {
    var addType = this.props.action.split('_')[1]

    var labelChoices = this.props.bundle.state.tags[addType+'s'] || [];
    var labelChoicesList = labelChoices.map((choice) => ({value: choice, label: choice +' (add to existing)'}))

    var availableParamsList = []
    if (this.props.bundle.state.paramsAllowDist) {
      mapObject(this.props.bundle.state.paramsAllowDist, (uniqueid, twig) => {
          availableParamsList.push({value: uniqueid, label: twig})
        })
    }

    var valueParamsList = this.state.parameters
    if (valueParamsList.length === 0 && !this.state.alreadyLoadedLastActive && this.props.bundle.queryParams['lastActive']) {
      var uniqueid = this.props.bundle.queryParams['lastActive']
      this.onChangeParameters([{value: uniqueid, label: this.props.bundle.state.paramsAllowDist[uniqueid]}])
      this.setState({alreadyLoadedLastActive: true})
    }
    return (
      <div>
        <div className="form-group">
          <label id={"twig"} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>parameter(s)</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select isMulti={true} isClearable={true} closeMenuOnSelect={false} onChange={this.onChangeParameters} options={availableParamsList} value={valueParamsList}/>
          </span>
        </div>

        <div className="form-group">
          <label id={addType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{addType}</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <CreatableSelect isClearable={true} onChange={this.onChangeLabel} options={labelChoicesList} placeholder={"(automatically generate)"}/>
          </span>
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
            <Select options={availableLabelsList} value={{value: this.state.labelOld, label: this.state.labelOld}} onChange={this.onChangeLabelOld}/>
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
            <Select options={availableLabelsList} value={{value: this.state.label, label: this.state.label}} onChange={this.onChangeLabel}/>
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
      labelNew: null
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
    } else if (runType == 'solver') {
      return 'solution'
    }
    return null
  }

  // onChangeLabelNew = (e) => {
  //   this.props.onUpdatePacket({[this.getNewType()]: e.target.value})
  // }
  onChangeLabelNew = (inputValue, actionMeta) => {
    var value = null
    if (inputValue !== null) {
      value = inputValue.value
    }
    this.setState({labelNew: value})
    this.props.onUpdatePacket({[this.getNewType()]: value})
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

    if (this.state.labelNew===null) {
      this.setState({labelNew: 'latest'})
      this.props.onUpdatePacket({[newType]: 'latest'})
    }

    var labelNewChoices = cloneDeep(this.props.bundle.state.tags[newType+'s']) || [];

    var labelNewValue = {value: this.state.labelNew, label: this.state.labelNew}
    // if (labelNewChoices.indexOf(this.state.labelNew) !== -1) {
      // TODO: don't incdlue (overwrite) if latest and doesn't yet exist
      // labelNewValue.label = this.state.labelNew + ' (overwrite)'
    // }

    if (labelNewChoices.indexOf('latest') === -1) {
      labelNewChoices.push('latest')
    }
    var labelNewChoicesList = labelNewChoices.map((choice) => ({value: choice, label: choice +' (overwrite)'}))

    // console.log(availableLabelsList)

    return (
      <div>
        <div className="form-group">
          <label id={runType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{runType}</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select options={availableLabelsList} value={{value: this.state.label, label: this.state.label}} onChange={this.onChangeLabel}/>
          </span>

        </div>

        <div className="form-group">
          <label id={newType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{newType}</label>
          {/* <input type="text" id={newType} placeholder="automatically generated if empty" onChange={this.onChangeLabelNew} style={{width: "50%"}}></input> */}
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <CreatableSelect isClearable={false} onChange={this.onChangeLabelNew} options={labelNewChoicesList} value={labelNewValue}/>
          </span>
        </div>

      </div>
    )
  }
}

class ActionContentAdopt extends Component {
  constructor(props) {
    super(props);
    this.state = {
      label: null,
      remove: false,
    }
  }

  onChangeLabel = (e) => {
    this.setState({label: e.value});

    this.props.onUpdatePacket({[this.props.action.split('_')[1]]: e.value})
  }
  onChangeRemove = (value) => {
    this.setState({remove: !value})
    this.props.onUpdatePacket({['remove_'+this.props.action.split('_')[1]]: !value})
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

    return (
      <div>
        <div className="form-group">
          <label id={runType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{runType}</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select options={availableLabelsList} value={{value: this.state.label, label: this.state.label}} onChange={this.onChangeLabel}/>
          </span>
          <label id={'remove_'+runType} style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>{'remove_'+runType}</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block"}}>
            <ToggleButton
              inactiveLabel={<span className="fas fa-fw fa-times"></span>}
              activeLabel={<span className="fas fa-fw fa-check"></span>}
              trackStyle = {{width: '600px'}}
              value={this.state.remove}
              onToggle={this.onChangeRemove} />
          </span>

        </div>
      </div>
    )
  }
}

class ActionContentExportArrays extends Component {
  constructor(props) {
    super(props);
    this.state = {
      params: [],
    }
  }
  onChangeParams = (e) => {
    if (e) {
      // make sure all have the same length
      if (!e.map(item => item.len).every(len => len === e[0].len)) {
        alert("all selected arrays must have same length")
        return
      }


      this.props.onUpdatePacket({uniqueids: e.map(item => item.value).join()})
      this.setState({params: e})

    } else {
      this.props.onUpdatePacket({uniqueids: ""})
      this.setState({params: []})

    }
  }

  render() {
    var availableParamsList = []
    if (this.props.bundle.state.params) {
      mapObject(this.props.bundle.state.params, (uniqueid, param) => {
        if (param.class === 'FloatArrayParameter' && ['dataset', 'model'].indexOf(param.context)!== -1 && param.len > 0 && param.qualifier.indexOf('ld_') === -1) {
          availableParamsList.push({value: uniqueid, label: param.uniquetwig+' ('+param.len+')', len: param.len})
        }
      })
    }

    var valueParamsList = this.state.params


    return (
      <div>
        <div className="form-group">
          <label style={{width: "50%", textAlign: "right", paddingRight: "10px"}}>Export Arrays from Parameters:</label>
          <span style={{width: "50%", lineHeight: "1.0", display: "inline-block", verticalAlign: "sub"}}>
            <Select options={availableParamsList} value={valueParamsList} onChange={this.onChangeParams} isMulti={true} isClearable={true} closeMenuOnSelect={false} components={animatedComponents} />
          </span>

        </div>
      </div>
    )
  }
}

class ActionContentJobs extends Component {
  constructor(props) {
    super(props);
    this.state = {
    }
  }

  render() {
    // this.props.bundle.state.pollingJobs {uniqueid: intervaleObject}
    // this.props.bundle.state.params {uniqueid: parameter}

    return (
      <div>
        <span>{Object.keys(this.props.bundle.state.pollingJobs).length} running jobs currently being polled</span>
        {/* {Object.keys(this.props.bundle.state.pollingJobs).map( (uniqueid) => <p>{uniqueid}</p>)} */}
        <ActionContentNewParameters app={this.props.app} bundle={this.props.bundle} orderBy={'context'}/>
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
      packet: {}, // used for most action panels with a single command
      packets: [], // used for import_data
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
  onUpdatePackets = (packets) => {
    // used for import_data only
    packets.forEach( (packet, i) => {
      packets[i].bundleid = this.props.bundle.state.bundleid
    })

    this.setState({packets: packets})
  }
  closePanel = () => {
    this.props.bundle.setQueryParams({tmp: []})
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, null, this.props.bundle.getSearchString())})
  }
  submitAction = () => {
    console.log("submitAction: ");
    console.log(this.state.packet);

    if (this.props.action === 'import_data') {
      this.state.packets.forEach( packet => {
        this.props.app.socket.emit('set_value', packet);
      })
    } else {
      this.props.app.socket.emit('bundle_method', this.state.packet);
    }



    if (['add', 'run'].indexOf(this.props.action.split('_')[0]) !== -1 || ['import_model'].indexOf(this.props.action) !== -1) {
      // then we go to another screen once we receive tmpFilter
      var toastID = toast.info(this.props.action+" submitted... waiting for response", { autoClose: false, closeButton: false });
      this.props.bundle.setState({pendingBundleMethod: toastID});
      this.setState({waiting: true});
    } else {
      this.closePanel();
    }

  }
  removeAction = () => {
    var packet = {bundleid: this.props.bundle.state.bundleid}
    var context = this.props.bundle.queryParams.tmp.split(',').slice(-1)[0].split(':')[0].replace('%22', '')
    packet.method = 'remove_'+context
    // NOTE: this makes very specific assumptions about the format of URL
    var label = this.props.bundle.queryParams.tmp.split(':').slice(-1)[0].split('|').slice(-1)[0].replace('%22', '')
    packet[context] = label.replace('%22', '')
    console.log("removeAction: ")
    console.log(packet)
    this.props.app.socket.emit('bundle_method', packet);

    this.closePanel();
  }
  gotoAction = (newAction) => {
    this.props.bundle.setQueryParams({tmp: []})
    var url = generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, newAction, this.props.bundle.getSearchString())
    this.setState({redirect: url})
  }
  componentDidUpdate() {
    if (this.state.redirect) {
      this.setState({redirect: null})
    }
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }

    var action = this.props.action.split("_")[0];
    var context = this.props.action.split("_")[1];
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
      } else if (this.props.action === 'add_distribution'){
        actionContent = <ActionContentAddDistribution app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>

      } else {
        actionContent = <ActionContentAdd app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
      }
    } else if (['import_model', 'import_solution'].indexOf(this.props.action)!==-1) {
      actionIcon += 'fa-plus'
      if (tmpFilter) {
        actionContent = <ActionContentNewParameters app={this.props.app} bundle={this.props.bundle}/>
      } else {
        actionContent = <ActionContentImport app={this.props.app} bundle={this.props.bundle} action={this.props.action} context={context} onUpdatePacket={this.onUpdatePacket}/>
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
    } else if (action == 'adopt') {
      actionIcon += 'fa-check-double'
      if (tmpFilter) {
        actionContent = <ActionContentNewParameters app={this.props.app} bundle={this.props.bundle}/>
      } else {
        actionContent = <ActionContentAdopt app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
      }
    } else if (this.props.action == 'edit_figure') {
      // no actionIcon because we have a tmpFilter to show parameters
      if (tmpFilter) {
        // NOTE: this makes very specific assumptions about the format of URL
        var figure = this.props.bundle.queryParams.tmp.split('|').slice(-1)[0].replace('%22', '')
        // console.log(figure)
        actionContent = <React.Fragment>
                          <FigurePanelWidth app={this.props.app} bundle={this.props.bundle} figure={figure}/>
                          <ActionContentNewParameters app={this.props.app} bundle={this.props.bundle} orderBy={'figure'}/>
                        </React.Fragment>
      }
    } else if (this.props.action == 'view_figure') {
      // no actionIcon because we have a tmpFilter to show parameters
      if (tmpFilter) {
        // NOTE: this makes very specific assumptions about the format of URL
        var figure = this.props.bundle.queryParams.tmp.split('|').slice(-1)[0].replace('%22', '')
        // console.log(figure)
        actionContent = <React.Fragment>
                          <FigurePanelWidth app={this.props.app} bundle={this.props.bundle} figure={figure}/>
                        </React.Fragment>
      }
    } else if (this.props.action == 'edit_figure_times') {
      // no actionIcon because we have a tmpFilter to show parameters
      if (tmpFilter) {
        actionContent = <React.Fragment>
                          <ActionContentNewParameters app={this.props.app} bundle={this.props.bundle} orderBy={'figure'}/>
                        </React.Fragment>
      }
    } else if (this.props.action == 'import_data') {
      actionIcon = null;
      actionContent = <FileReader app={this.props.app} bundle={this.props.bundle} onUpdatePackets={this.onUpdatePackets}/>
    } else if (this.props.action == 'export_data') {
      actionIcon = null;
      actionContent = <ActionContentExportArrays app={this.props.app} bundle={this.props.bundle} action={this.props.action} onUpdatePacket={this.onUpdatePacket}/>
    } else if (action == 'jobs') {
      actionContent = <ActionContentJobs app={this.props.app} bundle={this.props.bundle}/>
    }

    var actionStyle = {margin: '5px'}
    if (!this.state.actionActive) {
      actionStyle.pointerEvents = 'none'
      actionStyle.color = 'gray'
      actionStyle.borderColor = 'gray'
    }

    var buttons = null
    if (this.props.action === 'import_data') {
      buttons = <div style={{float: "right"}}>
                  <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}} title={"cancel "+this.props.action+" and return to filtered parameters"}><span className="fas fa-fw fa-times"></span> cancel</span>
                  <span onClick={this.submitAction} className="btn btn-primary" style={{margin: "5px"}} title="set selected parameters from columns"><span className="fas fa-fw fa-chevron-right"></span> continue</span>
              </div>
    } else if (this.props.action === 'export_data') {
      buttons = <div style={{float: "right"}}>
                  <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}} title={"cancel "+this.props.action+" and return to filtered parameters"}><span className="fas fa-fw fa-times"></span> cancel</span>
                  <Link onClick={this.closePanel} href={"http://"+this.props.app.state.serverHost+'/export_arrays/'+this.props.bundle.state.bundleid+'/'+this.state.packet.uniqueids} target="_blank" className="btn btn-primary" style={{actionStyle}} title="Download file containing exported arrays"><span className="fas fa-fw fa-download"></span> export arrays</Link>
              </div>
    } else if (['edit_figure', 'edit_figure_times', 'jobs'].indexOf(this.props.action) !== -1) {
      buttons = <div style={{float: "right"}}>
                  <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}} title={"close and return to filtered parameters"}><span className="fas fa-fw fa-times"></span> close</span>
              </div>
    } else if (['view_figure'].indexOf(this.props.action) !== -1) {
      buttons = <div style={{float: "right"}}>
                  <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}} title={"close and return to filtered parameters"}><span className="fas fa-fw fa-times"></span> close</span>
              </div>
    } else if (!this.state.waiting) {
      if (tmpFilter) {
        buttons = <div style={{float: "right"}}>
                    <span onClick={this.removeAction} className="btn btn-primary" style={{margin: "5px"}} title="remove any added parameters and cancel"><span className="fas fa-fw fa-minus"></span> remove</span>
                    {this.props.action == 'add_compute' ?
                      <span onClick={()=>this.gotoAction('run_compute')} className="btn btn-primary" style={{margin: "5px"}} title="accept changes and go to run_compute"><span className="fas fa-fw fa-play"></span> run</span>
                      :
                      null
                    }
                    {this.props.action == 'add_dataset' ?
                      <span onClick={()=>this.gotoAction('import_data')} className="btn btn-primary" style={{margin: "5px"}} title="accept changes and import data from a file"><span className="fas fa-fw fa-upload"></span> import data</span>
                      :
                      null
                    }
                    {this.props.action == 'add_solver' ?
                      <span onClick={()=>this.gotoAction('run_solver')} className="btn btn-primary" style={{margin: "5px"}} title="accept changes and go to run_solver"><span className="fas fa-fw fa-play"></span> run</span>
                      :
                      null
                    }
                    {this.props.action == 'run_solver' ?
                      <span onClick={()=>this.gotoAction('adopt_solution')} className="btn btn-primary" style={{margin: "5px"}} title="accept changes and go to adopt_solution"><span className="fas fa-fw fa-check-double"></span> adopt</span>
                      :
                      null
                    }
                    <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}} title="accept changes and return to filtered parameters"><span className="fas fa-fw fa-chevron-right"></span> continue</span>
                </div>
      } else {
        buttons = <div style={{float: "right"}}>
                    <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}} title={"cancel "+this.props.action+" and return to filtered parameters"}><span className="fas fa-fw fa-times"></span> cancel</span>
                    { this.props.action === 'run_compute' ?
                      <Link onClick={this.closePanel} href={"http://"+this.props.app.state.serverHost+'/export_compute/'+this.props.bundle.state.bundleid+'/'+this.state.packet.compute+'/'+this.state.packet.model} target="_blank" className="btn btn-primary" style={{actionStyle}} title="Download script to run on an external machine.  Once executed, use 'import_model' to import the results."><span className="fas fa-fw fa-download"></span> download script</Link>
                      :
                      null
                    }
                    { this.props.action === 'run_solver' ?
                      <Link onClick={this.closePanel} href={"http://"+this.props.app.state.serverHost+'/export_solver/'+this.props.bundle.state.bundleid+'/'+this.state.packet.solver+'/'+this.state.packet.solution} target="_blank" className="btn btn-primary" style={{actionStyle}} title="Download script to run on an external machine.  Once executed, use 'import_solution' to import the results."><span className="fas fa-fw fa-download"></span> download script</Link>
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
