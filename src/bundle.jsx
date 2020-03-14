import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';
import 'babel-polyfill';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// minified version is also included
// import 'react-toastify/dist/ReactToastify.min.css';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron
import PanelGroup from 'react-panelgroup'; // https://www.npmjs.com/package/react-panelgroup
import {arrayMove} from 'react-sortable-hoc';

// will need to move to array-move if updating react-sortable-hoc, but
// currently causes npm run build to fail
// const arrayMove = require('array-move'); // https://www.npmjs.com/package/array-move

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
      figures: [],
      figureUpdateTimes: {},
      failedConstraints: [],
      checksReport: [],
      checksStatus: "UNKNOWN",
      paramsfilteredids: [],
      tags: {},
      tagsAvailable: {},
      nAdvancedHiddenEach: {},
      nAdvancedHiddenTotal: 0,
      nparams: 0,
      pendingBundleMethod: null,
      pollingJobs: {}, // uniqueid: interval
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
          autoClose: false,
          closeButton: true})

        this.setState({pendingBundleMethod: null})

      } else {
        var level = data.level || 'ERROR'
        var toastLevel = toast.error
        if (level.toUpperCase() === 'WARNING') {
          toastLevel = toast.warning
        }
        toastLevel(level.toUpperCase()+': '+data.error, {
          position: "bottom-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true})

      }

    })

    this.props.app.socket.on(this.state.bundleid+':checks:react', (data) => {
      this.setState({checksReport: data.checks_report || [], checksStatus: data.checks_status || "UNKNOWN"})
    })

    this.props.app.socket.on(this.state.bundleid+':failed_constraints:react', (data) => {
      this.setState({failedConstraints: data.failed_constraints || []})
    })

    this.props.app.socket.on(this.state.bundleid+':figures_updated:react', (data) => {
      console.log(data)
      var figureUpdateTimes = this.state.figureUpdateTimes
      Object.keys(data.figure_update_times).forEach( figure => {
        figureUpdateTimes[figure] = data.figure_update_times[figure]
      })
      this.setState({figureUpdateTimes: figureUpdateTimes})
    })

    this.props.app.socket.on(this.state.bundleid+':changes:react', (data) => {
      // console.log("received changes", data)
      if (data.parameters) {
        var params = this.state.params;
        Object.keys(data.parameters).forEach( uniqueid => {
          // console.log("updating "+data.parameters[uniqueid].uniquetwig)
          params[uniqueid] = data.parameters[uniqueid];
        });
        var removed_params = data.removed_parameters || []
        removed_params.forEach( uniqueid => {
          delete params[uniqueid];
        })
        this.setState({params: params});
      }


      if (data.tags) {
        this.setState({tags: data.tags});

        // update figures
        var figures = this.state.figures
        for (const figure of data.tags.figures) {
          if (figures.indexOf(figure) == -1) {
            figures.push(figure)
          }
        }
        figures.forEach( (figure,i) => {
          // likewise if there is a figure that is no longer in data.tags.figures, we need to remove
          if (data.tags.figures.indexOf(figure) == -1) {
            figures.splice(i, 1)
          }
        })
        this.setState({figures: figures})

        var figureUpdateTimes = this.state.figureUpdateTimes
        Object.keys(figureUpdateTimes).forEach( figure => {
          if (figures.indexOf(figure) == -1) {
            // then this figure has been removed, so we need to remove it from figureUpdateTimes
            delete figureUpdateTimes[figure]
          }
        })
        this.setState({figureUpdateTimes: figureUpdateTimes})

      }


      if (data.add_filter) {

        var filterstr = ''
        for (const [key, value] of Object.entries(data.add_filter)) {
          filterstr += key+ ' = '+value
        }

        var onClick = (e) => {this.clearQueryParams(); this.setQueryParams(data.add_filter)}

        if (this.state.pendingBundleMethod) {
          toast.update(this.state.pendingBundleMethod, {
            render: 'Success!',
            type: toast.TYPE.SUCCESS,
            autoClose: 1000,
            closeButton: true,
            closeOnClick: true})

          // we'll let the waiting panel-action clear the pendingBundleMethod once it updates the view
          this.setQueryParams({tmp: '"'+Object.keys(data.add_filter)[0]+':'+Object.values(data.add_filter)[0]+'"'})

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
          autoClose: 1000,
          closeButton: true,
          closeOnClick: true})

        this.setState({pendingBundleMethod: null})


      }

      // TODO: do we ever need to be worried about the state not being updated yet?
      this.updatePollingJobs(this.state.params)


    });

  }
  deregisterBundle = () => {
    console.log("deregisterBundle")
    // terminate any polling for jobs
    mapObject(this.state.pollingJobs, (jobid, interval) => {
      clearInterval(interval)
    })
    this.setState({pollingJobs: {}})
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
          var figureUpdateTimes = {}
          json.data.tags.figures.forEach( (figure) => {
            // NOTE: this will show an empty icon if failed (ie no data or model);
            // so as soon as we set this we'll request all to be updated
            figureUpdateTimes[figure] = 'load'
          });
          this.setState({params: json.data.parameters,
                         tags: json.data.tags,
                         figures: json.data.tags.figures,
                         figureUpdateTimes: figureUpdateTimes,
                         failedConstraints: json.data.failed_constraints,
                         checksStatus: json.data.checks_status || "UNKNOWN",
                         checksReport: json.data.checks_report || [],
                         nparams: Object.keys(json.data.parameters).length})

          this.updatePollingJobs(json.data.parameters);
          this.props.app.socket.emit('rerun_all_figures', {bundleid: this.state.bundleid});
        } else {
          alert("server error: "+json.data.error);
          this.setState({params: null, tags: null, figures: [], failedConstraints: [], checksStatus: "UNKNOWN", checksReport: null, nparams: null});
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
  pollJob = (uniqueid) => {
    console.log("polling for "+uniqueid)

    var packet = {bundleid: this.state.bundleid, method: 'attach_job', uniqueid: uniqueid}
    this.props.app.socket.emit('bundle_method', packet);
  }
  updatePollingJobs = (params) => {
    var pollingJobs = [];
    mapObject(params, (uniqueid, param) => {
      if (Object.keys(this.state.pollingJobs).indexOf(uniqueid) === -1) {
        if (param.qualifier === 'detached_job' && ['loaded', 'error'].indexOf(param.valuestr) === -1) {
          // then we need to poll for updates to this parameter
          // console.log("adding polling interval for detached_job "+uniqueid+" with status "+param.valuestr)
          var interval = setInterval(() => this.pollJob(uniqueid), 1000);
          pollingJobs[uniqueid] = interval
        }
      } else {
        if (param.qualifier === 'detached_job' && ['loaded', 'error'].indexOf(param.valuestr) === -1) {
          // then we leave the current interval in place
          pollingJobs[uniqueid] = this.state.pollingJobs[uniqueid]
        } else {
          // then we clear the existing interval
          console.log("clearing polling for "+uniqueid)
          clearInterval(this.state.pollingJobs[uniqueid])
          // and don't add an entry to the new state
        }
      }
    })

    this.setState({pollingJobs: pollingJobs})
  }
  onFigureSortEnd = ({oldIndex, newIndex}) => {
    this.setState({
      figures: arrayMove(this.state.figures, oldIndex, newIndex),
    });
  }
  filter = (params, filter, ignoreGroups=[]) => {
    var ignoreGroupsFilter = ignoreGroups.concat(["pinned", "advanced", "orderBy", "tmp", "checks"])

    var nAdvancedHiddenEach = {};
    var nAdvancedHiddenTotal = 0;
    var inAdvancedAll = null
    var paramsfilteredids = [];
    var includeThisParam = true;

    var advanced = filter.advanced || []

    if (filter.tmp!==undefined && filter.tmp.length) {
      // then this is a temporary filter (i.e. for the results from add_*)
      // syntax: tag1:value1|value2,tag2:value1
      const filterStrings = filter.tmp.split(',')
      var filterTmp = {}
      for (const filterString of filterStrings) {
        // console.log(filterString)
        var tmpFilterTag = filterString.split(':')[0].replace('%22', '')
        var tmpFilterValues = filterString.split(':')[1].replace('%22', '').split('|')
        tmpFilterValues = tmpFilterValues.map((item) => { return item == 'null' ? null : item; });
        // console.log(tmpFilterTag)
        // console.log(tmpFilterValues)
        filterTmp[tmpFilterTag] = tmpFilterValues

        // override the advanced setting for single-choices to always show in the tmpFilter
        advanced.push('is_single')
      }

      mapObject(params, (uniqueid, param) => {
        // determine initial visibility based on advanced filter
        includeThisParam = true;
        inAdvancedAll = param.advanced_filter;
        inAdvancedAll.forEach(advancedItem => {
          // we'll respect all of the advanced options except for 'is_constraint' (so that compute_phases/times constraint is shown)
          if (advanced.indexOf(advancedItem) === -1 && ['is_constraint'].indexOf(advancedItem) === -1) {
            includeThisParam = false;
          }
        })

        mapObject(filterTmp, (tmpFilterTag, tmpFilterValues) => {
          if (tmpFilterValues.indexOf(param[tmpFilterTag]) === -1) {
            includeThisParam = false
          }
        })
        // if (tmpFilterValues.indexOf(param[tmpFilterTag]) === -1) {
          // includeThisParam = false
        // }

        if (includeThisParam) {
          paramsfilteredids.push(uniqueid)
        }
      })
      return [paramsfilteredids, null, null]
    }

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
    } else if (this.props.FigurePanelOnly) {
      return (<FigurePanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} showPopoutButton={false} FigurePanelOnly={this.props.FigurePanelOnly}/>)
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
              <PSPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} showPopoutButton={true} showChecks={!this.queryParams.hideChecks}/>
            }
            <FigurePanel app={this.props.app} bundleid={this.state.bundleid} bundle={this} showPopoutButton={true} inactive={this.props.match.params.action}/>
          </PanelGroup>
        </div>
        <div className="d-block d-lg-none" style={{paddingTop: "50px", paddingBottom: "28px", height: "100%"}}>
          <PSPanel app={this.props.app} bundleid={this.state.bundleid} bundle={this}/>
        </div>


      </div>
    )
  }
}
