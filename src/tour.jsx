import React, { Component } from 'react';
// import {Redirect} from 'react-router-dom';

import {Link, generatePath} from './common';


class Tip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: null,
    };
  }
  dismiss = (e) => {
    const title = this.props.title || true
    e.preventDefault();
    e.stopPropagation();
    this.setState({dismissed: title});
    this.props.onDismiss(this.props.title, true);
  }

  componentDidUpdate() {
    if (this.state.isVisible === null) {
      if (this.props.isVisibleStart()) {
        this.setState({isVisible: true})
      }
    }

    if (this.state.isVisible !== false) {
    // if (this.state.isVisible) {
      if (this.props.isVisibleEnd()) {
        this.setState({isVisible: false})
        this.props.onDismiss(this.props.title, false);
      }
    }

  }
  render() {
    if (this.state.isVisible !== true || this.props.alreadyDismissed.indexOf(this.props.title)!==-1) {
      return null
    } else if (this.props.to) {
      return (
        <Link className='phoebe-tip' to={this.props.to}>
          <span className="fa-fw fas fa-times" style={{float: "right", cursor: "pointer"}} title="don't show again" onClick={this.dismiss}/>

          {this.props.children}
        </Link>
      )
    } else {
      return (
        <span className='phoebe-tip'>
          <span className="fa-fw fas fa-times" style={{float: "right", cursor: "pointer"}} title="don't show again" onClick={this.dismiss}/>
          {this.props.children}
        </span>
      )
    }
  }
}

class TipTips extends Component {
  isVisibleStart = () => {
    return true
  }
  isVisibleEnd = () => {
    return this.props.alreadyDismissed.length > 0
  }
  render() {
    return(
      <Tip title="Tips" onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
        This right panel will eventually show all your figures.  Until then you can find some tips here to help find your way around PHOEBE.
      </Tip>
    )
  }
}

class TipFilter extends Component {
  isVisibleStart = () => {
    return this.props.bundle.state.paramsfilteredids.length > 0
  }
  isVisibleEnd = () => {
     return this.props.bundle.state.paramsfilteredids.length > 0 && this.props.bundle.state.paramsfilteredids.length + this.props.bundle.state.nAdvancedHiddenTotal < this.props.bundle.state.nparams
  }
  render() {
    return(
      <Tip title="Filter" onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
        The middle panel contains a list of all the parameters in the system/bundle.  Click the tags under the various headers in the left panel to filter this list and find specific parameters.
      </Tip>
    )
  }
}

class TipPinning extends Component {
  isVisibleStart = () => {
    return this.props.alreadyDismissed.indexOf("Filter") !== -1
  }
  isVisibleEnd = () => {
    var queryParams = this.props.app.queryParams || {}
    var pinned = queryParams.pinned || []

    return pinned.length > 0;
  }
  render() {
    return(
      <Tip title="Pinning" onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
        If you find a parameter that you want to keep in the panel even as you change the filter, you can click the <span className="fa-fw far fa-square"></span> icon on the left of the parameter to "pin"/"unpin" that parameter.  You can then toggle showing only pinned parameters by clicking on the button in the box in the top-left called "show only pinned parameters".
      </Tip>
    )
  }
}


class TipFilterAdvanced extends Component {
  isVisibleStart = () => {
    return this.props.alreadyDismissed.indexOf("Pinning") !== -1
  }
  isVisibleEnd = () => {
    var queryParams = this.props.app.queryParams || {}
    var advanced = queryParams.advanced || []

    return advanced.length > 0;
  }
  render() {
    return(
      <Tip title="FilterAdvanced" onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
        Some parameters are always excluded from the filtered list - some because they're advanced or they only have a single option.  These can be included by toggling the options after clicking the "show options" button near the upper-left.
      </Tip>
    )
  }
}


class TipParameterDetails extends Component {
  isVisibleStart = () => {
    return this.props.bundle.state.paramsfilteredids.length > 0 && this.props.alreadyDismissed.indexOf("FilterAdvanced") !== -1
  }
  isVisibleEnd = () => {
    // could dismiss this if we add an expanded=uniqueid to the queryParams.  For now it will have to be manually dismissed.
   return false;
  }
  render() {
    return(
      <Tip title="ParameterDetails" onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
        You can view more details about a parameter, including its description and related parameters, by clicking on the Parameter item in the middle panel.
      </Tip>
    )
  }
}


class TipAddDataset extends Component {
  isVisibleStart = () => {
    return this.props.alreadyDismissed.indexOf("Filter") !== -1
  }
  isVisibleEnd = () => {
    var tags = this.props.bundle.state.tags || {}
    var tagsDatasets = tags.datasets || []

    return tagsDatasets.length > 0;
  }
  render() {
    return(
      <Tip title="AddDataset" to={generatePath(this.props.app.state.serverHost, this.props.bundleid, "add_dataset")} onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
         There are no datasets attached.  Click here or the <span className="fa-fw fas fa-plus"></span> icon on the left in the "Dataset" section to add a dataset to your system.
      </Tip>
    )
  }
}

class TipRunCompute extends Component {
  isVisibleStart = () => {
    var tags = this.props.bundle.state.tags || {}
    var tagsDatasets = tags.datasets || []

    return this.props.alreadyDismissed.indexOf("Filter") !== -1 && tagsDatasets.length > 0
  }
  isVisibleEnd = () => {
    var tags = this.props.bundle.state.tags || {}
    var tagsModels = tags.models || []

    return tagsModels.length > 0;
  }
  render() {
    return(
      <Tip title="RunCompute" to={generatePath(this.props.app.state.serverHost, this.props.bundleid, "run_compute")} onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
        Now that you have a dataset added and defined, you can call run_compute.  Click here or on the <span className="fa-fw fas fa-play"></span> icon on the left in the "Compute" section to create your first model.
      </Tip>
    )
  }
}

class TipAddFigure extends Component {
  isVisibleStart = () => {
    var tags = this.props.bundle.state.tags || {}
    var tagsModels = tags.models || []

    // TODO: also show if OBSERVATIONS are included in any datasets

    return this.props.alreadyDismissed.indexOf("Filter") !== -1 && tagsModels.length > 0
  }
  isVisibleEnd = () => {
    var tags = this.props.bundle.state.tags || {}
    var tagsFigures = tags.figures || []

    return tagsFigures.length > 0;
  }
  render() {
    return(
      <Tip title="AddFigure" to={generatePath(this.props.app.state.serverHost, this.props.bundleid, "add_figure")} onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
        It's finally time to make some plots.  Click here or the <span className="fa-fw fas fa-plus"></span> icon on the left in the "Figure" section to add a figure which will then be displayed in this panel.
      </Tip>
    )
  }
}

class TipTemplate extends Component {
  isVisibleStart = () => {
    // set this to be True when you want the tip to FIRST show (unless permanently dismissed)
    return this.props.alreadyDismissed.indexOf("Filter") !== -1
  }
  isVisibleEnd = () => {
    // set this to be True when the tip should automatically be dismissed (i.e.
    // when the user accomplishes the task)

    // or set to always return false to force to be manually dismissed
    return false;
  }
  render() {
    return(
      <Tip title="title gets passed to props.alreadyDismissed" onDismiss={this.props.onDismiss} alreadyDismissed={this.props.alreadyDismissed} isVisibleStart={this.isVisibleStart} isVisibleEnd={this.isVisibleEnd}>
        Content here
        Don't forget to add to the tour render to be included!
      </Tip>
    )
  }
}

export class Tour extends Component {
  constructor(props) {
    super(props);
    this.state = {
      alreadyDismissed: []
    };
  }
  onDismissTip = (title, byUser) => {
    var alreadyDismissed = this.state.alreadyDismissed

    if (alreadyDismissed.indexOf(title) === -1) {
      alreadyDismissed = alreadyDismissed.concat(title)
      this.setState({alreadyDismissed: alreadyDismissed})
    }

    if (byUser) {
      var settingsDismissedTips = this.props.app.state.settingsDismissedTips
      if (settingsDismissedTips.indexOf(title)===-1) {
        settingsDismissedTips.push(title)
        this.props.app.updateSetting('settingsDismissedTips', settingsDismissedTips)
      }
    }
  }
  clearSettingsDismissed = () => {
    console.log("Tour.clearSettingsDismissed")
    this.setState({alreadyDismissed: []})
    this.props.app.updateSetting('settingsDismissedTips': "")
  }
  componentDidMount() {
    var settingsDismissedTips = this.props.app.state.settingsDismissedTips
    if (settingsDismissedTips.length > 0) {
      this.setState({alreadyDismissed: settingsDismissedTips})
    }
  }
  render() {
    return (
      <React.Fragment>
        <span onClick={this.clearSettingsDismissed} className="btn btn-tag btn-tag-clear" style={{maxWidth: "100%"}}>reset dismissed tips</span>

        <TipTips onDismiss={this.onDismissTip} alreadyDismissed={this.state.alreadyDismissed} app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>

        <TipFilter onDismiss={this.onDismissTip} alreadyDismissed={this.state.alreadyDismissed} app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>
        <TipPinning onDismiss={this.onDismissTip} alreadyDismissed={this.state.alreadyDismissed} app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>
        <TipFilterAdvanced onDismiss={this.onDismissTip} alreadyDismissed={this.state.alreadyDismissed} app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>
        <TipParameterDetails onDismiss={this.onDismissTip} alreadyDismissed={this.state.alreadyDismissed} app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>

        <TipAddDataset onDismiss={this.onDismissTip} alreadyDismissed={this.state.alreadyDismissed} app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>
        <TipRunCompute onDismiss={this.onDismissTip} alreadyDismissed={this.state.alreadyDismissed} app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>
        <TipAddFigure onDismiss={this.onDismissTip} alreadyDismissed={this.state.alreadyDismissed} app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>
      </React.Fragment>
    )
  }
}
