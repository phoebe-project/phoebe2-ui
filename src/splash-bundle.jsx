import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {Statusbar} from './ui';
import {CancelSpinnerIcon, generatePath, abortableFetch} from './common';

import {LogoSplash} from './logo';



export class SplashBundle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bundleLoading: false,
    }
    this.logoSplash = React.createRef();
  }
  render() {
    var splashScrollableStyle = {display: "inline-block", textAlign: "center"}
    var animationEffect = null;

    if (this.state.bundleLoading) {
      splashScrollableStyle.pointerEvents = 'none'
      animationEffect = "animateSpinner"
    }

    return(
      <div className="App content-dark">
        <Statusbar app={this.props.app} bundleid={this.props.match.params.bundleid} dark={true}/>

        <LogoSplash ref={this.logoSplash} transitionIn="transitionInNone" animationEffect={animationEffect}/>

        <div className="splash-scrollable-header">
          {/* <p>Desktop application id: {remote.getGlobal('appid')}</p> */}
          {/* <p>Current connection: {this.props.app.state.serverHost} ({this.props.app.state.serverStatus})</p> */}



          <p style={{textAlign: "center", marginBottom: "0px", paddingLeft: "10px", paddingRight: "10px"}}>
            {/* <Link style={{float: "left"}} title="choose different server" to={generatePath()}><span className="fas fa-fw fa-broadcast-tower"/></Link> */}
            {/* <Link style={{float: "left"}} title="choose different server" to={generatePath()}><span className="fas fa-fw fa-broadcast-tower"/>{this.props.app.state.serverHost}</Link> */}
            <b>Load Bundle</b>
            {/* <Link style={{float: "right"}} title="configure new bundle options" to={generatePath(this.props.app.state.serverHost, "settings", "bundles")}><span className="fas fa-fw fa-cog"/></Link> */}
          </p>


          <div className="splash-scrollable" style={splashScrollableStyle}>
            {this.props.transfer ?
              <NewBundleButton type='transfer' title={'transfer from '+this.props.match.params.oldserver} app={this.props.app} match={this.props.match} activeOnMount={true} splashBundle={this} logoSplash={this.logoSplash}/>
              :
              null
            }

            <NewBundleButton type='load:open' title="From File" app={this.props.app} openDialog={this.props.openDialog} splashBundle={this} logoSplash={this.logoSplash}>
              {/* <NewBundleButton type='load:open' title="Open Bundle File" style={{width: "calc(50% - 2px)", marginRight: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/> */}
              {/* <NewBundleButton type='load:import' title="Import Legacy File" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/> */}
            </NewBundleButton>

            <NewBundleButton type='single' title="Default Single Star" app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>

            <NewBundleButton type='binary:detached' title="Default Binary" app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}>
              <NewBundleButton type='binary:detached' title="Detached" style={{width: "calc(33.33% - 2px)", marginRight: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>
              <NewBundleButton type='binary:semidetached:primary' title="Semidetached" style={{width: "calc(33.33% - 4px)", marginLeft: "2px", marginRight: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}>
                <NewBundleButton type='binary:semidetached:primary' title="Primary" style={{width: "calc(50% - 2px)", marginRight: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>
                <NewBundleButton type='binary:semidetached:secondary' title="Secondary" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>
              </NewBundleButton>
              <NewBundleButton type='binary:contact' title="Contact" style={{width: "calc(33.33% - 2px)", marginLeft: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>
            </NewBundleButton>

            <NewBundleButton type='triple:21:detached' title="Default Triple" app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}>
              <NewBundleButton type='triple:12:detached' title="Third Comp. as Primary" style={{width: "calc(50% - 2px)", marginRight: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}>
                <NewBundleButton type='triple:12:detached' title="Detached" style={{width: "calc(50% - 2px)", marginRight: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>
                <NewBundleButton type='triple:12:contact' title="Contact" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>
              </NewBundleButton>
              <NewBundleButton type='triple:21:detached' title="Third Comp. as Secondary" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}>
                <NewBundleButton type='triple:21:detached' title="Detached" style={{width: "calc(50% - 2px)",  marginRight: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>
                <NewBundleButton type='triple:21:contact' title="Contact" style={{width: "calc(50% - 2px)", marginLeft: "2px"}} app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/>
              </NewBundleButton>
            </NewBundleButton>

            {/* <NewBundleButton type='other' title="Custom Hierarchy" app={this.props.app} splashBundle={this} logoSplash={this.logoSplash}/> */}
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
      hover: false,
      bundleLoading: false,
      bundleLoadingCancel: false,
      redirectBundleid: null,
      exposeChildren: false,
    };
    this.abortLoadBundleController = null;
    this.fileInput = React.createRef();

  }
  exposeChildren = (event) => {
    event.preventDefault();
    event.stopPropagation();
    this.setState({exposeChildren: true})
  }
  loadBundle = (event) => {
    console.log("NewBundleButton.loadBundle");

    var doFetch = true
    let fetchURL, fetchMethod, fetchBody

    if (['load:open', 'load:import'].indexOf(this.props.type)!==-1) {
      if (this.fileInput.current.files.length===0) {
        // then coming from clicking on the button.  We need to open the dialog first,
        // once its value is changed the else will be triggered.
        this.fileInput.current.click();
        doFetch = false
      } else {
        // then coming from the onChange of the input
        fetchURL = "http://"+this.props.app.state.serverHost+"/open_bundle"
        fetchMethod = 'POST'

        var data = new FormData()
        data.append('file', this.fileInput.current.files[0])
        fetchBody = data
      }
    } else if (this.props.type === 'transfer') {
      fetchURL = "http://"+this.props.match.params.server+"/transfer_bundle/"+this.props.match.params.oldserver+"/"+this.props.match.params.bundleid
      fetchMethod = 'GET'
      fetchBody = null
    } else {
      fetchURL = "http://"+this.props.app.state.serverHost+"/new_bundle/"+this.props.type
      fetchMethod = 'GET'
      fetchBody = null
    }

    if (doFetch) {
      this.setState({bundleLoading: true});
      this.props.splashBundle.setState({bundleLoading: true});

      this.abortLoadBundleController = new window.AbortController();
      abortableFetch(fetchURL, {method: fetchMethod, body: fetchBody, signal: this.abortLoadBundleController.signal})
        .then(res => res.json())
        .then(json => {
          if (json.data.success) {
            this.setState({redirectBundleid: json.data.bundleid})
          } else {
            alert("server error: "+json.data.error);
            this.cancelLoadBundleSpinners();
          }
        }, err=> {
          // then we canceled the request
          console.log("received abort signal")
          this.cancelLoadBundleSpinners();
        })
        .catch(err => {
          if (err.name === 'AbortError') {
            // then we canceled the request
            console.log("received abort signal")
            this.cancelLoadBundleSpinners();
          } else {
            alert("server error, try again")
            this.cancelLoadBundleSpinners();
          }

        });
    }


  }
  abortLoadBundle = (event) => {
    console.log("NewBundleButton.abortLoadBundle")
    // TODO: will need to cancel or ignore server response
    // NOTE: event.stopPropogation and preventDefault handled by CancelSpinnerIcon Component
    if (this.abortLoadBundleController) {
      console.log("NewBundleButton.abortLoadBundle calling abort on controller")
      this.abortLoadBundleController.abort();
    } else {
      this.cancelLoadBundleSpinners();
    }
  }
  cancelLoadBundleSpinners = () => {
    this.props.splashBundle.setState({bundleLoading: false});
    this.setState({bundleLoading: false});
  }
  onMouseEnter = () => {
    // set hover for showing the ... button
    this.setState({hover: true})

    if (!this.props.splashBundle.state.bundleLoading) {
      // now handle showing the appropriate animation
      if (this.props.type === 'single') {
        this.props.logoSplash.current.showSingle();
      } else if (this.props.type === 'binary:detached') {
        this.props.logoSplash.current.showDetached();
      } else if (this.props.type === 'binary:semidetached:primary') {
        this.props.logoSplash.current.showSemidetachedPrimary();
      } else if (this.props.type === 'binary:semidetached:secondary') {
        this.props.logoSplash.current.showSemidetachedSecondary();
      } else if (this.props.type === 'binary:contact') {
        this.props.logoSplash.current.showContact();
      } else if (this.props.type === 'triple:12:detached') {
        this.props.logoSplash.current.showTriple12Detached();
      } else if (this.props.type === 'triple:12:contact') {
        this.props.logoSplash.current.showTriple12Contact();
      } else if (this.props.type === 'triple:21:detached') {
        this.props.logoSplash.current.showTriple21Detached();
      } else if (this.props.type === 'triple:21:contact') {
        this.props.logoSplash.current.showTriple21Contact();
      }
    }

  }
  onMouseLeave = () => {
    // set hover for showing the ... button
    this.setState({hover: false})

    if (!this.props.splashBundle.state.bundleLoading) {

      // reset the state of showChildren
      this.setState({exposeChildren: false})

      // now handle clearing any existing animation
      this.props.logoSplash.current.clearTemporary();
    }

  }
  componentDidMount() {
    if (this.props.openDialog) {
      // NOTE: most browsers will prevent this unless they detect its coming from a user-event.
      // in most cases, since this did come from clicking a button in the Bundle component, this
      // should fire fine, but reloading the page, even with this property set, will fail to fire
      // the click event.
      console.log("opening file dialog because of URL")
      if (this.props.app.state.isElectron) {
        console.log("calling electron executeJSwithUserGesture")
        window.require('electron').remote.getGlobal('executeJSwithUserGesture')(`document.getElementById("fileinput-${this.props.type}").click()`);

      } else {
        this.fileInput.current.click();
      }
    }

    if (this.props.activeOnMount) {
      this.loadBundle();
    }
  }
  render () {
    if (this.state.redirectBundleid) {
      return (<Redirect to={generatePath(this.props.app.state.serverHost, this.state.redirectBundleid)}/>)
    }

    var fileInput = null;
    if (['load:open', 'load:import'].indexOf(this.props.type)!==-1) {
      fileInput = <input id={"fileinput-"+this.props.type} type="file" ref={this.fileInput} style={{ display: 'none' }} onFocus={this.loadBundle} onChange={this.loadBundle}/>
    }

    var loadingSpan = null;
    if (this.state.bundleLoading) {
      loadingSpan = <CancelSpinnerIcon onCancel={this.abortLoadBundle} title="bundle loading (this can take some time... click to cancel)"/>
    }


    if (this.state.exposeChildren) {
      return (
        <div onMouseLeave={this.onMouseLeave} className="splash-scrollable-btn-div" style={this.props.style}>
          {fileInput}
          {this.props.children}
        </div>
      )
    } else if (this.props.children) {
      return (
        <div className="splash-scrollable-btn-div" style={this.props.style}>
          <span className="btn btn-transparent" onClick={this.loadBundle} onMouseOver={this.onMouseEnter} onMouseLeave={this.onMouseLeave}>
            {fileInput}
            {loadingSpan}
            {this.props.title}
            {this.state.hover ?
              <span className="btn-sub fas fa-fw fa-chevron-right" onClick={this.exposeChildren} title="show options" style={{float: 'right', width: "20px", marginLeft: "-20px"}}/>
              :
              null
            }
          </span>
        </div>
      )
    } else {
      return (
        <div className="splash-scrollable-btn-div" style={this.props.style}>
          <span className="btn btn-transparent" onClick={this.loadBundle} onMouseOver={this.onMouseEnter} onMouseOut={this.onMouseLeave}>
            {fileInput}
            {loadingSpan}
            {this.props.title}
          </span>
        </div>
      )
    }
  }
}
