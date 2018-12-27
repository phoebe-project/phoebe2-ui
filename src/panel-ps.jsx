import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import FlipMove from 'react-flip-move'; // https://github.com/joshwcomeau/react-flip-move

import {Link, Twig, generatePath, isStaticFile, abortableFetch, mapObject, filterObjectByKeys, popUpWindow} from './common';
import {LogoSpinner} from './logo';
import {Panel} from './ui';
import {Tag} from './panel-tags';

import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

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

    return (
      <span style={{color: "#2B71B1", cursor: "pointer"}} title={title} onMouseEnter={()=>{this.setState({hover: true})}} onMouseLeave={()=>{this.setState({hover: false})}} onClick={this.onClick}>
        <span className={classNames}/>
        {this.props.children}
      </span>
    )
  }

}

class Parameter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pinned: false,
      receivedDetails: false,
      details: {},
      expanded: false
    };
    this.abortGetDetailsController = null;
    this.ref = React.createRef();

    this.expandFromClick = false;
  }
  toggleExpanded = () => {
    if (this.props.PSPanel.state.expandedParameter===this.props.uniqueid) {
        this.props.PSPanel.setState({expandedParameter: null})
    } else {
      // try to prevent the scroll action
      this.expandFromClick = true;
      this.props.PSPanel.setState({expandedParameter: this.props.uniqueid})
    }
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

    var expanded = this.props.PSPanel.state.expandedParameter===this.props.uniqueid || this.props.bundle.state.paramsfilteredids.length===1;
    if (expanded != this.state.expanded) {
      this.setState({expanded: expanded})
      if (expanded && !this.expandFromClick) {
        this.ref.current.scrollIntoView(true);
      }
      if (this.expandFromClick) {
        // reset so clicking on a link will use scroll behavior
        this.expandFromClick = false
      }
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
    if (this.state.expanded && !this.state.receivedDetails) {
      this.setState({receivedDetails: true})

      this.abortGetDetailsController = new window.AbortController();
      abortableFetch("http://"+this.props.app.state.serverHost+"/parameter/"+this.props.bundle.state.bundleid+"/"+this.props.uniqueid, {signal: this.abortGetDetailsController.signal})
        .then(res => res.json())
        .then(json => {
          if (json.data.success) {
            this.setState({details: json.data.parameter})
          } else {
            alert("server error: "+json.data.error);
            this.setState({receivedDetails: true, details: {}});
          }
        }, err=> {
          console.log("received abort signal")
        })
        .catch(err => {
          if (err.name === 'AbortError') {
            console.log("received abort signal")
          } else {
            alert("server error, try again")
            this.setState({receivedDetails: true, details: {}})
          }

        });


    }

    return (
      <div ref={this.ref} className='phoebe-parameter'>
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
            <Twig twig={this.props.twig}/>
          </span>

        </div>

        {this.state.expanded ?
          <div className='phoebe-parameter-content'>
            <ParameterDetailsItem title="Description">
              {this.state.details.description || null}
            </ParameterDetailsItem>

            <ParameterDetailsItem title="Tags">
                <span style={{display: "inline-block"}}>
                  {this.props.paramOverview.context && <div><Tag bundle={this.props.bundle} group="context" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.context}/></div>}
                  {this.props.paramOverview.kind && <div><Tag bundle={this.props.bundle} group="kind" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.kind}/></div>}
                  {/* {this.props.paramOverview.constraint && <div><Tag bundle={this.props.bundle} group="constraint" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.constraint}/></div>} */}
                  {this.props.paramOverview.component && <div><Tag bundle={this.props.bundle} group="component" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.component}/></div>}
                  {this.props.paramOverview.feature && <div><Tag bundle={this.props.bundle} group="feature" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.feature}/></div>}
                  {this.props.paramOverview.dataset && <div><Tag bundle={this.props.bundle} group="dataset" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.dataset}/></div>}
                  {this.props.paramOverview.figure && <div><Tag bundle={this.props.bundle} group="figure" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.figure}/></div>}
                  {this.props.paramOverview.compute && <div><Tag bundle={this.props.bundle} group="compute" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.compute}/></div>}
                  {this.props.paramOverview.model && <div><Tag bundle={this.props.bundle} group="model" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.model}/></div>}
                  {this.props.paramOverview.qualifier && <div><Tag bundle={this.props.bundle} group="qualifier" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.qualifier}/></div>}
                </span>
            </ParameterDetailsItem>

            {this.state.details.limits && (this.state.details.limits[0]!==null || this.state.details.limits[1]!==null) ?
              <ParameterDetailsItem title="Limits">
                {this.state.details.limits[0]!==null ?
                  this.state.details.limits[0]
                  :
                  <span>-&infin;</span>
                }
                &rarr;
                {this.state.details.limits[1]!=null ?
                  this.state.details.limits[1]
                  :
                  <span>&infin;</span>
                }
                {this.state.details.limits[2] ?
                  <span style={{marginLeft: "5px"}}>({this.state.details.limits[2]})</span>
                  :
                  null
                }
              </ParameterDetailsItem>
              :
              null
            }

            {Object.keys(this.state.details.constraint || {}).length ?
              <ParameterDetailsItem title="Constraint">
                <div style={{display: "inline-block"}}>
                  {mapObject(this.state.details.constraint, (uniqueid, twig) => {
                    return <ParameterDetailsItemPin key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} uniqueid={uniqueid} twig={twig}/>
                  })}
                </div>
              </ParameterDetailsItem>
            :
            null
            }

            {Object.keys(this.state.details.constrains || {}).length ?
              <ParameterDetailsItem title="Constrains">
                <div style={{display: "inline-block"}}>
                  {mapObject(this.state.details.constrains, (uniqueid, twig) => {
                    return <ParameterDetailsItemPin key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} uniqueid={uniqueid} twig={twig}/>
                  })}
                </div>
              </ParameterDetailsItem>
            :
            null
            }

            {Object.keys(this.state.details.related_to || {}).length ?
              <ParameterDetailsItem title="Related to">
                <div style={{display: "inline-block"}}>
                  {mapObject(this.state.details.related_to, (uniqueid, twig) => {
                    return <ParameterDetailsItemPin key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} uniqueid={uniqueid} twig={twig}/>
                  })}
                </div>
              </ParameterDetailsItem>
            :
            null
            }

          </div>
          :
          null
        }
      </div>
    )
  }
}

class ParameterDetailsItem extends Component {
  render() {
    if (!this.props.children) {
      return null
    }
    return (
      <div style={{marginTop: "10px"}}>
        <span style={{display: "inline-block", minWidth: "120px", marginRight: "10px", textAlign: "right", verticalAlign: "top"}}>
          {this.props.title}:
        </span>
        <span>
          {this.props.children}
        </span>
      </div>
    )
  }
}

class ParameterDetailsItemPin extends Component {
  constructor(props) {
    super(props);
    // this.state = {
      // pinned: false,
    // };
  }
  addToPinned = () => {
    var pinned = this.props.bundle.queryParams.pinned || []
    var newPinned = pinned.concat(this.props.uniqueid)
    this.props.bundle.setQueryParams({pinned: newPinned})
  }
  expandParameter = () => {
    this.props.PSPanel.setState({expandedParameter: this.props.uniqueid})
  }
  popParameter = () => {
    var bundleid = this.props.bundle.state.bundleid || this.props.bundle.match.params.bundleid

    var url = generatePath(this.props.app.state.serverHost, bundleid, 'ps');
    var win = popUpWindow(url, `?advanced=["onlyPinned"]&pinned=["${this.props.uniqueid}"]`);

  }
  render() {
    var isCurrentlyVisible = this.props.bundle.state.paramsfilteredids.indexOf(this.props.uniqueid) !== -1

    return (
      <div>
        {isCurrentlyVisible ?
          <span style={{color: "#2B71B1", cursor: "pointer"}} className="fa-fw fas fa-sign-in-alt" onClick={this.expandParameter} title="go to parameter"/>
          :
          <Checkbox checked={false} onClick={this.addToPinned} checkedTitle="unpin parameter" uncheckedTitle="pin parameter"/>
        }
        <span style={{marginLeft: "4px", color: "#2B71B1", cursor: "pointer"}} title="open parameter in external window" onClick={this.popParameter} className="fas fa-fw fa-external-link-alt"/>

        <Twig twig={this.props.twig}/>


      </div>
    )
  }
}

export class PSPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expandedParameter: null,
    };
    this.prevNParams = 0;
  }
  popPS = () => {
    var bundleid = this.props.bundleid || this.props.match.params.bundleid

    var url = generatePath(this.props.app.state.serverHost, bundleid, 'ps');
    var win = popUpWindow(url, window.location.search);
  }
  orderByChanged = (e) => {
    var value = "Context"
    if (e) {
      value = e.nativeEvent.srcElement.value
    }
    this.props.bundle.setQueryParams({orderBy: value})
  }
  render() {
    var bundleid = this.props.bundleid || this.props.match.params.bundleid
    var params = this.props.bundle.state.params || {}

    var paramsFiltered = filterObjectByKeys(params, this.props.bundle.state.paramsfilteredids)
    // animations can be laggy, and not even that effective, when there are a
    // lot of changes.  So we'll check the change in length as well as the
    // length itself (in the case of changing orderBy)
    var enablePSAnimation = Math.abs(this.props.bundle.state.paramsfilteredids.length - this.prevNParams) <= 20 && this.props.bundle.state.paramsfilteredids.length <= 20;
    this.prevNParams = this.props.bundle.state.paramsfilteredids.length

    var orderBy = this.props.bundle.queryParams.orderBy || 'context'
    var orderByTags = this.props.bundle.state.tags[orderBy+'s'] || []
    orderByTags = orderByTags.concat([null]);

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
          Order by:
          <select onChange={this.orderByChanged}>
              <option value="context" selected={orderBy==='context' ? 'selected' : false}>Context</option>
              <option value="kind" selected={orderBy==='kind' ? 'selected' : false}>Kind</option>
              {/* <option value="constraint" selected={orderBy==='constraint' ? 'selected' : false}>Constraint</option> */}
              <option value="component" selected={orderBy==='component' ? 'selected' : false}>Component</option>
              <option value="feature" selected={orderBy==='feature' ? 'selected' : false}>Feature</option>
              <option value="dataset" selected={orderBy==='dataset' ? 'selected' : false}>Dataset</option>
              <option value="figure" selected={orderBy==='figure' ? 'selected' : false}>Figure</option>
              <option value="compute" selected={orderBy==='compute' ? 'selected' : false}>Compute</option>
              <option value="model" selected={orderBy==='model' ? 'selected' : false}>Model</option>
              <option value="qualifier" selected={orderBy==='qualifier' ? 'selected' : false}>Qualifier</option>
          </select>
        </div>

        <div style={{paddingTop: "10px"}}>
          {this.props.bundle.state.paramsfilteredids.length || Object.keys(this.props.bundle.queryParams).length ?

            orderByTags.map(orderByTag => {

              return <PSGroup app={this.props.app} bundle={this.props.bundle} PSPanel={this} orderBy={orderBy} orderByTag={orderByTag} paramsFiltered={paramsFiltered} enablePSAnimation={enablePSAnimation} PSPanelOnly={this.props.PSPanelOnly}/>



            })


            :
            <LogoSpinner pltStyle={{backgroundColor: "rgb(43, 113, 177)"}}/>
          }
        </div>

      </Panel>
    )
  }
}

class PSGroup extends Component {
  render() {
    var parameters = []
    parameters = mapObject(this.props.paramsFiltered, (uniqueid, param) => {
      if (param[this.props.orderBy]===this.props.orderByTag) {
        return (<Parameter key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} paramOverview={param} uniqueid={uniqueid} pinnable={!this.props.PSPanelOnly} twig={param.twig} value={param.valuestr} description={param.description}/>)
      }
    })

    if (parameters.some(v => v!==undefined)) {
      return (
        <div>
          <b key={this.props.orderByTag}>{this.props.orderBy}: {this.props.orderByTag===null ? "None" : this.props.orderByTag}</b>

          <FlipMove appearAnimation={false} enterAnimation="fade" leaveAnimation="fade" maintainContainerHeight={true} disableAllAnimations={!this.props.enablePSAnimation}>
            {parameters}
          </FlipMove>
        </div>
      )
    } else {
      return null
    }


  }
}
