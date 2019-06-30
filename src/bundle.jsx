import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// minified version is also included
// import 'react-toastify/dist/ReactToastify.min.css';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron
import PanelGroup from 'react-panelgroup'; // https://www.npmjs.com/package/react-panelgroup

import {TagPanel} from './panel-tags';
import {PSPanel} from './panel-ps';
import {ActionPanel} from './panel-action';
import {FigurePanel} from './panel-figures';
import {Link, generatePath, abortableFetch, mapObject, sameLists} from './common';
import {Toolbar, Statusbar} from './ui';

// NOTE: currently use a local version until PR is accepted, in which case we can lose the ./ and update the version requirements in package.json
// local version now also includes a getSearchString() which we'd have to rewrite if using the dependency
import ReactQueryParams from './react-query-params'; // https://github.com/jeff3dx/react-query-params

export class Bundle extends ReactQueryParams {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null,
      bundleid: props.match.params.bundleid,
      params: null,
      paramsfilteredids: [],
      tags: {},
      tagsAvailable: {},
      nAdvancedHiddenEach: {},
      nAdvancedHiddenTotal: 0,
      nparams: 0,
      pendingBundleMethod: null,
    };
    this.childrenWindows = [];
  }
  clearQueryParams = () => {
    var newQueryParams = {}
    Object.keys(this.queryParams).forEach( k => {
        newQueryParams[k] = [];
    })
    this.setQueryParams(newQueryParams)

    // window.location.search = "";
  }
  registerBundle = () => {
    console.log("registerBundle")
    this.props.app.socket.emit('register client', {'clientid': this.props.app.state.clientid, 'bundleid': this.state.bundleid});

    this.props.app.socket.on(this.state.bundleid+':errors:react', (data) => {
      if (this.state.pendingBundleMethod) {
        toast.update(this.state.pendingBundleMethod, {
          render: "FAILED: "+data.error,
          type: toast.TYPE.ERROR,
          autoClose: 5000,
          closeButton: true})

        this.setState({pendingBundleMethod: null})

      } else {
        toast.error('ERROR: '+data.error, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true})

      }

    })

    this.props.app.socket.on(this.state.bundleid+':changes:react', (data) => {
      // console.log("received changes", data)
      if (data.parameters) {
        var params = this.state.params;
        Object.keys(data.parameters).forEach( uniqueid => {
          console.log("updating "+data.parameters[uniqueid].uniquetwig)
          params[uniqueid] = data.parameters[uniqueid]
        });
        this.setState({params: params});
      }


      if (data.tags) {
        this.setState({tags: data.tags});
      }

      if (data.add_filter) {

        var filterstr = ''
        for (const [key, value] of Object.entries(data.add_filter)) {
          filterstr += key+ ' = '+value
        }

        var onClick = (e) => {this.clearQueryParams(); this.setQueryParams(data.add_filter)}

        if (this.state.pendingBundleMethod) {
          toast.update(this.state.pendingBundleMethod, {
            render: 'Success!  Click to filter: '+filterstr+'.',
            type: toast.TYPE.SUCCESS,
            autoClose: 10000,
            closeButton: true,
            onClick: onClick })

          this.setState({pendingBundleMethod: null})

        } else {
          toast.info('New parameters.  Click to filter: '+filterstr+'.', {
            position: "bottom-right",
            autoClose: 10000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClick: onClick})

        }
      } else if (this.state.pendingBundleMethod) {
        toast.update(this.state.pendingBundleMethod, {
          render: 'Success!',
          type: toast.TYPE.SUCCESS,
          autoClose: 5000,
          closeButton: true})

        this.setState({pendingBundleMethod: null})


      }


    });

  }
  deregisterBundle = () => {
    console.log("deregisterBundle")
    this.props.app.socket.emit('deregister client', {'clientid': this.props.app.state.clientid, 'bundleid': this.state.bundleid});
  }
  componentDidMount() {
    window.addEventListener("beforeunload", (event) => {this.closePopUps()});

    // clear any temporary transfer bundle from the app
    this.props.app.setState({bundleTransferJson: null})

    this.abortGetParamsController = new window.AbortController();
    abortableFetch("http://"+this.props.app.state.serverHost+"/bundle/"+this.state.bundleid, {signal: this.abortGetParamsController.signal})
      .then(res => res.json())
      .then(json => {
        if (json.data.success) {
          this.registerBundle();
          this.setState({params: json.data.parameters, tags: json.data.tags, nparams: Object.keys(json.data.parameters).length})
        } else {
          alert("server error: "+json.data.error);
          this.setState({params: null, tags: null});
          this.clearQueryParams();
          this.deregisterBundle();
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
          this.setState({params: null, tags: null, nparams: 0});
          this.clearQueryParams();
        } else {
          alert("server error, try again")
          // this.cancelLoadBundleSpinners();
          this.setState({params: null, tags: null, nparams: 0});
          this.clearQueryParams();
        }

      });
  }
  componentWillUnmount() {
    this.closePopUps();
    this.deregisterBundle();
  }
  closePopUps = () => {
    this.childrenWindows.forEach(win => {
      try {
        win.close();
      } catch(error) {
        console.log("failed to close window")
      }
    })
    this.childrenWindows = [];
  }
  inAdvanced = (param, advanced) => {
    const advancedAll = ['not_visible', 'is_default', 'is_advanced', 'is_single', 'is_constraint'];
    var inAdvanced = []
    for (var i=0; i<advancedAll.length; i++) {
      if (advanced.indexOf(advancedAll[i]) === -1 && param.advanced_filter.indexOf(advancedAll[i]) !== -1) {
        inAdvanced.push(advancedAll[i])
      }
    }
    return inAdvanced
  }
  filter = (params, filter, ignoreGroups=[]) => {
    var ignoreGroupsFilter = ignoreGroups.concat(["pinned", "advanced", "orderBy"])

    var nAdvancedHiddenEach = {};
    var nAdvancedHiddenTotal = 0;
    var inAdvancedAll = null
    var paramsfilteredids = [];
    var includeThisParam = true;

    var advanced = filter.advanced || []

    if (ignoreGroups.indexOf("advanced")!==-1 || advanced.indexOf("onlyPinned")===-1) {
      mapObject(params, (uniqueid, param) => {
        inAdvancedAll = param.advanced_filter;

        // include this in counts
        inAdvancedAll.forEach(advancedItem => {
          if (Object.keys(nAdvancedHiddenEach).indexOf(advancedItem) === -1) {
            nAdvancedHiddenEach[advancedItem] = 0
          }
          nAdvancedHiddenEach[advancedItem] += 1
        })

        // determine initial visibility based on advanced filter
        includeThisParam = true;
        inAdvancedAll.forEach(advancedItem => {
          if (advanced.indexOf(advancedItem) === -1) {
            includeThisParam = false;
          }
        })

        if (!includeThisParam) {
          // then we need to add this param to the total count of excluded because of advanced filter
          nAdvancedHiddenTotal += 1;
        }

        mapObject(filter, (group, tags) => {
          if (ignoreGroupsFilter.indexOf(group)===-1 && tags.length && tags.indexOf(param[group])===-1){
            includeThisParam = false
          }
        })
        if (includeThisParam) {
          paramsfilteredids.push(uniqueid)
        }
      })
    }


    if (ignoreGroups.indexOf("pinned")===-1){
      var pinned = filter.pinned || []
      pinned.forEach(uniqueid => {
        if (paramsfilteredids.indexOf(uniqueid)===-1) {
          paramsfilteredids.push(uniqueid)
        }
      })
    }

    return [paramsfilteredids, nAdvancedHiddenEach, nAdvancedHiddenTotal];

  }
  componentDidUpdate() {
    if (this.state.params && this.queryParams) {
      console.log("Bundle.componentDidUpdate recomputing paramsfilteredids")

      // determine which parameters (by a list of uniqueids) is in the filtered PS
      var filteredInfo = this.filter(this.state.params, this.queryParams);
      var paramsfilteredids = filteredInfo[0];
      var nAdvancedHiddenEach = filteredInfo[1];
      var nAdvancedHiddenTotal = filteredInfo[2];

      if (paramsfilteredids.length !== this.state.paramsfilteredids.length || !sameLists(paramsfilteredids, this.state.paramsfilteredids)) {
        // since we're only allowing one tag to be added or removed, we can
        // hopefully rely that the length will change if the filter changes at all
        this.setState({paramsfilteredids: paramsfilteredids, nAdvancedHiddenEach: nAdvancedHiddenEach, nAdvancedHiddenTotal: nAdvancedHiddenTotal});

        // determine "availability" of all tags
        var tagsAvailable = {}
        var paramsfilteredids_thisgroup = null;
        mapObject(this.state.tags, (group, tags) => {
          // i.e. group='componnet', tags=['binary', 'primary', 'secondary']

          // determine filtered PS excluding this group
          paramsfilteredids_thisgroup = this.filter(this.state.params, this.queryParams, ["advanced", "pinned", group.slice(0,-1)])[0];

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

    var action = this.props.match.params.action

    var panelWidths = [
                      {size: 490, minSize:300, resize: "dynamic"},
                      {minSize:440, resize: "stretch"},
                      {size: 250, minSize:250, resize: "dynamic"}
                     ]

    return (
      <div className="App">
        <Toolbar app={this.props.app} bundle={this} bundleid={this.state.bundleid}/>
        <Statusbar app={this.props.app} bundle={this} bundleid={this.state.bundleid}/>

        <ToastContainer
          position="bottom-right"
          autoClose={10000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnVisibilityChange={false}
          pauseOnFocusLoss={true}
          draggable
          pauseOnHover
        />

        <div className="d-none d-lg-block" style={{paddingTop: "50px", paddingBottom: "28px", height: "100%"}}>
          {/* need to support down to width of 990 for d-lg.  Tag starts at width needed for 3 columns */}
          <PanelGroup panelWidths={panelWidths}>
            <TagPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} inactive={this.props.match.params.action}/>
            {this.props.match.params.action ?
              <ActionPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} action={this.props.match.params.action}/>
              :
              <PSPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} showPopoutButton={true}/>
            }
            <FigurePanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} inactive={this.props.match.params.action}/>
          </PanelGroup>
        </div>
        <div className="d-block d-lg-none" style={{paddingTop: "50px", paddingBottom: "28px", height: "100%"}}>
          <PSPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this}/>
        </div>


      </div>
    )
  }
}
