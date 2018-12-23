import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import FlipMove from 'react-flip-move'; // https://github.com/joshwcomeau/react-flip-move

import {Link, generatePath, isStaticFile, mapObject, filterObjectByKeys} from './common';
import {LogoSpinner} from './logo';
import {Panel} from './ui';

import isElectron from 'is-electron'; // https://github.com/cheton/is-electron


let BrowserWindow;
if (isElectron()) {
  BrowserWindow = window.require('electron').remote.BrowserWindow
} else {
  BrowserWindow = null;
}

class Checkbox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false
    }
  }
  onClick = (e) => {
    e.preventDefault();
    e.stopPropagation()
    this.props.onClick();
  }
  render() {
    var classNames = "fa-fw fa-square"
    if ((this.props.checked && !this.state.hover) || (!this.props.checked && this.state.hover)) {
      classNames += " fas"
    } else {
      classNames += " far"
    }

    var title = this.props.title || null;
    if (this.props.checked && this.props.checkedTitle) {
      title = this.props.checkedTitle
    } else if (!this.props.checked && this.props.uncheckedTitle) {
      title = this.props.uncheckedTitle
    }

    return (<span style={{color: "#2B71B1"}} className={classNames} title={title} onMouseEnter={()=>{this.setState({hover: true})}} onMouseLeave={()=>{this.setState({hover: false})}} onClick={this.onClick}/>)
  }

}

class Parameter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: this.props.expanded,
      pinned: false,
    };
  }
  toggleExpanded = () => {
    this.setState({expanded: !this.state.expanded})
  }
  addToPinned = () => {
    var pinned = this.props.bundle.queryParams.pinned || []
    var newPinned = pinned.concat(this.props.uniqueid)
    this.props.bundle.setQueryParams({pinned: newPinned})
  }
  removeFromPinned = () => {
    var pinned = this.props.bundle.queryParams.pinned || []
    let newPinned;
    if (pinned.length===1) {
      newPinned = [ ];
    } else {
      newPinned = pinned.filter(uniqueid => uniqueid !== this.props.uniqueid)
    }
    this.props.bundle.setQueryParams({pinned: newPinned})
  }
  togglePinned = () => {
    if (this.state.pinned) {
      this.setState({pinned: false})
      this.removeFromPinned();
    } else {
      this.setState({pinned: true})
      this.addToPinned();
    }
  }
  componentDidMount() {
    this.componentDidUpdate();
  }
  componentDidUpdate() {
    var pinned = this.props.bundle.queryParams.pinned || []
    var ispinned = pinned.indexOf(this.props.uniqueid) !== -1
    if (ispinned != this.state.pinned) {
      this.setState({pinned: ispinned})
    }
  }
  // shouldComponentUpdate(nextProps, nextState) {
  //   if (nextState !== this.state) {
  //     return true
  //   }
  //   if (nextProps.value !== this.props.value) {
  //     return true
  //   }
  //   if (nextProps.adjust !== this.props.adjust) {
  //     return true
  //   }
  //   // adjustable, description, or changes to bundle should not cause updates
  //   return false;
  // }
  render() {
    var sliceIndex = this.props.twig.indexOf("@")
    var qualifier = this.props.twig.slice(0, sliceIndex);
    var twigRemainder = this.props.twig.slice(sliceIndex)

    return (
      <div className='phoebe-parameter'>
        <div className='phoebe-parameter-header' onClick={this.toggleExpanded}>
          <span style={{float: "right"}}>
            {this.props.value}
          </span>

          {this.props.pinnable ?
            <Checkbox checked={this.state.pinned} onClick={this.togglePinned} checkedTitle="unpin parameter" uncheckedTitle="pin parameter" />
            :
            null
          }
          <span style={{marginLeft: "10px", fontWeight: "bold"}}>
            {qualifier}
            <span style={{color: "slategray", fontWeight: "normal"}}>
              {twigRemainder}
            </span>
          </span>

        </div>

        {this.state.expanded ?
          <div className='phoebe-parameter-content'>
            Description: {this.props.description}
          </div>
          :
          null
        }
      </div>
    )
  }
}

export class PSPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this.prevNParams = 0;
  }
  popPS = () => {
    var bundleid = this.props.bundleid || this.props.match.params.bundleid

    var url = generatePath(this.props.app.state.serverHost, bundleid, 'ps');
    let win;
    if (this.props.app.state.isElectron) {
      // set frame: false?
      if (isStaticFile()) {
        url = window.location.origin + window.location.pathname + "#" + url + window.location.search
      } else {
        url = window.location.origin + url + window.location.search;
      }
      win = new BrowserWindow({width: 600, height: 400, minWidth: 600, minHeight: 400});
      win.on('close', () => {win = null});
      win.loadURL(url);
      win.show();
    } else {
      if (isStaticFile()) {
        url = window.location.origin + window.location.pathname + "#" + url + window.location.search
      } else {
        url = url + window.location.search
      }

      var windowName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5);
      win = window.open(url,
                        windowName,
                        'height=400,width=600,left=50,top=20,resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no,directories=no,status=no');
      win.focus();
    }
  }

  render() {
    var bundleid = this.props.bundleid || this.props.match.params.bundleid
    var params = this.props.bundle.state.params || {}

    var paramsFiltered = filterObjectByKeys(params, this.props.bundle.state.paramsfilteredids)
    // animations can be laggy, and not even that effective, when there are a lot of items
    var enablePSAnimation = Math.abs(this.props.bundle.state.paramsfilteredids.length - this.prevNParams) <= 20;
    this.prevNParams = this.props.bundle.state.paramsfilteredids.length

    return (
      <Panel backgroundColor="#e4e4e4">
        {this.props.showPopoutButton ?
          <div style={{float: "right", marginTop: "6px", paddingRight: "10px"}}>
            <span className="btn btn-blue" onClick={this.popPS} style={{height: "34px", width: "34px"}} title="popout into external window"><span className="fas fa-fw fa-external-link-alt"/></span>
          </div>
          :
          null
        }

        <div style={{paddingTop: "10px", paddingLeft: "10px"}}>
          Order by: [Context]
        </div>

        <div style={{paddingTop: "10px"}}>
          {this.props.bundle.state.paramsfilteredids.length || Object.keys(this.props.bundle.queryParams).length ?
            <FlipMove appearAnimation={false} enterAnimation="fade" leaveAnimation="fade" disableAllAnimations={!enablePSAnimation}>
              {mapObject(paramsFiltered, (uniqueid, param) => {
                return (<Parameter key={uniqueid} bundle={this.props.bundle} uniqueid={uniqueid} pinnable={!this.props.PSPanelOnly} twig={param.twig} value={param.valuestr} description={param.description}/>)
              })}
            </FlipMove>
            :
            <LogoSpinner pltStyle={{backgroundColor: "rgb(43, 113, 177)"}}/>
          }
        </div>

      </Panel>
    )
  }
}
