import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {Link, generatePath, isStaticFile} from './common';
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
      classNames += " far"
    } else {
      classNames += " fas"
    }

    return (<span style={{color: "#2B71B1"}} className={classNames} onMouseEnter={()=>{this.setState({hover: true})}} onMouseLeave={()=>{this.setState({hover: false})}} onClick={this.onClick}/>)
  }

}

class Parameter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: this.props.expanded,
    };
  }
  toggleExpanded = () => {
    this.setState({expanded: !this.state.expanded})
  }
  toggleAdjust = (e) => {
    // propogation stopped by Checkbox component
    alert("toggling adjust not implemented")
  }
  render() {
    return (
      <div className='phoebe-parameter'>
        <div className='phoebe-parameter-header' onClick={this.toggleExpanded}>
          <span style={{float: "right"}}>
            {this.props.value}
          </span>

          {this.props.adjustable ?
            <Checkbox checked={this.props.adjust} onClick={this.toggleAdjust} />

            :
            <div style={{display: "inline-block", width: "20px"}}>&nbsp;</div>
          }
          <span style={{marginLeft: "10px"}}>
            {this.props.twig}
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
  popPS = () => {
    var bundleid = this.props.bundleid || this.props.match.params.bundleid


    var url = generatePath(this.props.app.state.serverHost, bundleid, 'ps');
    let win;
    if (this.props.app.state.isElectron) {
      // set frame: false?
      if (isStaticFile()) {
        url = window.location.origin + window.location.pathname + "#" + url
      } else {
        url = window.location.origin + url
      }
      win = new BrowserWindow({width: 600, height: 400, minWidth: 600, minHeight: 400});
      win.on('close', () => {win = null});
      win.loadURL(url);
      win.show();
    } else {
      if (isStaticFile()) {
        url = window.location.origin + window.location.pathname + "#" + url
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
          <Parameter twig='teff@primary@component' value="6000 K" description='effective temperature' adjustable={true} adjust={false}/>
          <Parameter twig='teff@secondary@component' value="6000 K" description='effective temperature' adjustable={true} adjust={true}/>
          <Parameter twig='atm@primary@compute' value="ck2004" description='atmosphere model'/>
          <Parameter twig='ltte@phoebe01@compute' value="True" description='atmosphere model'/>
        </div>

      </Panel>
    )
  }
}
