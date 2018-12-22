import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import ReactQueryParams from 'react-query-params'; // https://github.com/jeff3dx/react-query-params
// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron
import PanelGroup from 'react-panelgroup'; // https://www.npmjs.com/package/react-panelgroup

import {TagPanel} from './panel-tags';
import {PSPanel} from './panel-ps';
import {FigurePanel} from './panel-figures';
import {Link, generatePath, abortableFetch, mapObject} from './common';
import {Toolbar, Statusbar, Panel} from './ui';

export class Bundle extends ReactQueryParams {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null,
      bundleid: props.match.params.bundleid,
      showFigurePanel: false,
      params: null,
      paramsfilteredids: [],
      tags: null,
      tagsAvailable: null,
      nparams: 0,
    };
  }
  componentDidMount() {
    this.abortGetParamsController = new window.AbortController();
    abortableFetch("http://"+this.props.app.state.serverHost+"/bundle/"+this.state.bundleid, {signal: this.abortGetParamsController.signal})
      .then(res => res.json())
      .then(json => {
        if (json.data.success) {
          this.setState({params: json.data.parameters, tags: json.data.tags, nparams: Object.keys(json.data.parameters).length})
        } else {
          alert("server error: "+json.data.error);
          this.setState({params: null, tags: null});
          this.setState({redirect: generatePath(this.props.app.state.serverHost)})
          // this.cancelLoadBundleSpinners();
        }
      }, err=> {
        // then we canceled the request
        console.log("received abort signal")
        // this.cancelLoadBundleSpinners();
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          // then we canceled the request
          console.log("received abort signal")
          // this.cancelLoadBundleSpinners();
        } else {
          alert("server error, try again")
          // this.cancelLoadBundleSpinners();
          this.setState({params: null, tags: null, nparams: 0})
        }

      });
  }
  filter = (params, filter, ignoreGroups=[]) => {
    // if (!ignoreGroups) {
    //   ignoreGroups = []
    // }
    var ignoreGroupsFilter = ignoreGroups.concat("pinned")

    var paramsfilteredids = [];
    var includeThisParam = true;
    mapObject(params, (uniqueid, param) => {
      includeThisParam = true
      mapObject(filter, (group, tags) => {
        if (ignoreGroupsFilter.indexOf(group)===-1 && tags.length && tags.indexOf(param[group])===-1){
          includeThisParam = false
        }
      })
      if (includeThisParam) {
        paramsfilteredids.push(uniqueid)
      }
    })


    if (ignoreGroups.indexOf("pinned")===-1){
      var pinned = filter.pinned || []
      pinned.forEach(uniqueid => {
        if (paramsfilteredids.indexOf(uniqueid)===-1) {
          paramsfilteredids.push(uniqueid)
        }
      })
    }


    return paramsfilteredids;

  }
  componentDidUpdate() {
    if (this.state.params && this.queryParams) {
      console.log("Bundle.componentDidUpdate recomputing paramsfilteredids")

      // determine which parameters (by a list of uniqueids) is in the filtered PS
      var paramsfilteredids = this.filter(this.state.params, this.queryParams);

      if (paramsfilteredids.length !== this.state.paramsfilteredids.length) {
        // since we're only allowing one tag to be added or removed, we can
        // hopefully rely that the length will change if the filter changes at all
        this.setState({paramsfilteredids: paramsfilteredids});

        // determine "availability" of all tags
        var tagsAvailable = {}
        var paramsfilteredids_thisgroup = null;
        mapObject(this.state.tags, (group, tags) => {
          // i.e. group='componnet', tags=['binary', 'primary', 'secondary']

          // determine filtered PS excluding this group
          paramsfilteredids_thisgroup = this.filter(this.state.params, this.queryParams, ["pinned", group.slice(0,-1)]);

          // loop through all parameters in that filter and gather the tags in THIS group - this will be available, whether selected or not
          tagsAvailable[group] = []
          paramsfilteredids_thisgroup.forEach(uniqueid => {
            if (tagsAvailable[group].indexOf(this.state.params[uniqueid][group.slice(0,-1)])===-1) {
              tagsAvailable[group].push(this.state.params[uniqueid][group.slice(0,-1)]);
            }
          })
        });

        this.setState({tagsAvailable: tagsAvailable});
      }
    }

  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }

    if (this.props.PSPanelOnly) {
      return (<PSPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} PSPanelOnly={this.props.PSPanelOnly}/>)
    }

    var modal = this.props.match.params.modal
    var modalContent = null;

    if (modal) {
      modalContent = <Modal {...this.props} title={modal}>
                        MODAL CONTENT HERE
                     </Modal>
    }

    let panelWidths
    if (this.state.showFigurePanel) {
      panelWidths = [
                      {size: 490, minSize:300, resize: "dynamic"},
                      {minSize:440, resize: "stretch"},
                      {size: 250, minSize:250, resize: "dynamic"}
                     ]
    } else {
      panelWidths = [
                      {size: 490, minSize:300, resize: "dynamic"},
                      {minSize:440, resize: "stretch"},
                      {size: 0, minSize:0, resize: "fixed"}
                     ]
    }

    return (
      <div className="App">
        {modalContent}
        <Toolbar app={this.props.app}/>
        <Statusbar app={this.props.app} bundleid={this.state.bundleid}/>

        <div className="d-none d-lg-block" style={{paddingTop: "50px", paddingBottom: "28px", height: "100%"}}>
          {/* need to support down to width of 990 for d-lg.  Tag starts at width needed for 3 columns */}
          <PanelGroup panelWidths={panelWidths}>
            <TagPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this}/>
            <PSPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} showPopoutButton={true}/>
            <FigurePanel app={this.props.app} bundleid={this.state.bundleid}/>
          </PanelGroup>
        </div>
        <div className="d-block d-lg-none" style={{paddingTop: "50px", paddingBottom: "28px", height: "100%"}}>
          <PSPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this}/>
        </div>


      </div>
    )
  }
}

class Modal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null,
    };
  }
  close = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.match.params.bundleid)})
  }
  preventPropagationClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }
    return (
      <div className="phoebe-modal-screen" onClick={this.close}>
        <div className="phoebe-modal" onClick={this.preventPropagationClose}>
          <div style={{float: "right", margin: "6px"}}>
            <Link title="close modal" to={generatePath(this.props.app.state.serverHost, this.props.match.params.bundleid)}><span className="fa-lg fa-fw fas fa-times"/></Link>
          </div>
          <div style={{textAlign: "center", fontSize: "1.3em", fontWeight: "bold"}}>
            {this.props.title}
          </div>

          <p>{this.props.children}</p>
        </div>
      </div>
    )
  }
}
