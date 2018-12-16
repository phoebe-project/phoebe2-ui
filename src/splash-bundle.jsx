import React, { Component } from 'react';

import {Link, generatePath} from './common';

// import {history} from './history';
import {LogoSplash} from './logo';

export class SplashBundle extends Component {
  constructor(props) {
    super(props);
    this.logoSplash = React.createRef();
  }
  render() {
    return(
      <div className="App content-dark">
        <Link style={{float: "left"}} title="choose different server" to={generatePath()}><span className="fa-lg fas fa-fw fa-broadcast-tower" style={{margin: "8px"}}/> {this.props.app.state.serverHost} [{this.props.app.state.serverPhoebeVersion}]</Link>
        <LogoSplash ref={this.logoSplash} transitionIn="transitionInNone"/>

        <div className="splash-scrollable-header">
          {/* <p>Desktop application id: {remote.getGlobal('appid')}</p> */}
          {/* <p>Current connection: {this.props.app.state.serverHost} ({this.props.app.state.serverStatus})</p> */}



          <p style={{textAlign: "center", marginBottom: "0px", paddingLeft: "10px", paddingRight: "10px"}}>
            {/* <Link style={{float: "left"}} title="choose different server" to={generatePath()}><span className="fas fa-fw fa-broadcast-tower"/></Link> */}
            {/* <Link style={{float: "left"}} title="choose different server" to={generatePath()}><span className="fas fa-fw fa-broadcast-tower"/>{this.props.app.state.serverHost}</Link> */}
            <b>Load Bundle</b>
            {/* <Link style={{float: "right"}} title="configure new bundle options" to={generatePath(this.props.app.state.serverHost, "settings", "bundles")}><span className="fas fa-fw fa-cog"/></Link> */}
          </p>

          <div className="splash-scrollable" style={{display: "inline-block", textAlign: "center"}}>
            <NewBundleButton title="From File" app={this.props.app} logoSplash={this.logoSplash}>
              <NewBundleButton type='load:open' title="Open Bundle File" style={{width: "calc(50% - 2px)", marginRight: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
              <NewBundleButton type='load:import' title="Import Legacy File" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
            </NewBundleButton>

            <NewBundleButton type='single' title="Default Single Star" app={this.props.app} logoSplash={this.logoSplash}/>

            <NewBundleButton type='binary' title="Default Binary" app={this.props.app} logoSplash={this.logoSplash}>
              <NewBundleButton type='binary:detached' title="Detached" style={{width: "calc(33.33% - 2px)", marginRight: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
              <NewBundleButton type='binary:semidetached' title="Semidetached" style={{width: "calc(33.33% - 4px)", marginLeft: "2px", marginRight: "2px"}} app={this.props.app} logoSplash={this.logoSplash}>
                <NewBundleButton type='binary:semidetached:primary' title="Primary" style={{width: "calc(50% - 2px)", marginRight: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
                <NewBundleButton type='binary:semidetached:secondary' title="Secondary" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
              </NewBundleButton>
              <NewBundleButton type='binary:contact' title="Contact" style={{width: "calc(33.33% - 2px)", marginLeft: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
            </NewBundleButton>

            <NewBundleButton type='triple' title="Default Triple" app={this.props.app} logoSplash={this.logoSplash}>
              <NewBundleButton type='triple:12' title="Third Component as Primary" style={{width: "calc(50% - 2px)", marginRight: "2px"}} app={this.props.app} logoSplash={this.logoSplash}>
                <NewBundleButton type='triple:12:detached' title="Detached" style={{width: "calc(50% - 2px)", marginRight: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
                <NewBundleButton type='triple:12:contact' title="Contact" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
              </NewBundleButton>
              <NewBundleButton type='triple:21' title="Third Component as Secondary" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} logoSplash={this.logoSplash}>
                <NewBundleButton type='triple:21:detached' title="Detached" style={{width: "calc(50% - 2px)",  marginRight: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
                <NewBundleButton type='triple:21:contact' title="Contact" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} logoSplash={this.logoSplash}/>
              </NewBundleButton>
            </NewBundleButton>

            <NewBundleButton type='other' title="Custom Hierarchy" app={this.props.app} logoSplash={this.logoSplash}/>
          </div>
        </div>
      </div>
    );
  }
}

class NewBundleButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      exposeChildren: false,
    };
  }
  exposeChildren = (event) => {
    event.preventDefault();
    this.setState({exposeChildren: true})
  }
  onMouseEnter = () => {
    if (this.props.type === 'single') {
      return this.props.logoSplash.current.showSingle();
    } else if (this.props.type === 'binary:detached' || this.props.type === 'binary') {
      return this.props.logoSplash.current.showDetached();
    } else if (this.props.type === 'binary:semidetached:primary' || this.props.type === 'binary:semidetached') {
      return this.props.logoSplash.current.showSemidetachedPrimary();
    } else if (this.props.type === 'binary:semidetached:secondary') {
      return this.props.logoSplash.current.showSemidetachedSecondary();
    } else if (this.props.type === 'binary:contact') {
      return this.props.logoSplash.current.showContact();
    } else if (this.props.type === 'triple:12:detached' || this.props.type === 'triple:12') {
      return this.props.logoSplash.current.showTriple12Detached();
    } else if (this.props.type === 'triple:12:contact') {
      return this.props.logoSplash.current.showTriple12Contact();
    } else if (this.props.type === 'triple:21:detached' || this.props.type === 'triple' || this.props.type === 'triple:21') {
      return this.props.logoSplash.current.showTriple21Detached();
    } else if (this.props.type === 'triple:21:contact') {
      return this.props.logoSplash.current.showTriple21Contact();
    }
  }
  onMouseLeave = () => {
    this.setState({exposeChildren: false})
    this.props.logoSplash.current.clearTemporary();
  }
  render () {
    if (this.state.exposeChildren) {
      return (
        <div onMouseLeave={this.onMouseLeave} className="splash-scrollable-btn-div" style={this.props.style}>
          {this.props.children}
        </div>
      )
    } else if (this.props.children) {
      return (
        <div className="splash-scrollable-btn-div" style={this.props.style}>
          <span className="btn btn-transparent" onClick={this.exposeChildren} onMouseOver={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>{this.props.title}</span>
          {/* NOTE: the following would allow exposing on hover... but then touch events somehow immediately get passed down to the exposed child */}
          {/* <a className="btn btn-transparent" onClick={this.exposeChildren} onMouseOver={this.exposeChildren} onMouseLeave={this.onMouseLeave}>{this.props.title}</a> */}
        </div>
      )
    } else {
      return (
        <div className="splash-scrollable-btn-div" style={this.props.style}>
          <span className="btn btn-transparent" to={generatePath(this.props.app.state.serverHost, "bundleid-"+this.props.type)} onMouseOver={this.onMouseEnter} onMouseOut={this.onMouseLeave}>{this.props.title}</span>
        </div>
      )
    }
  }
}
