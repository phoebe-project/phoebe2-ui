import React, { Component } from 'react';
// import {Redirect} from 'react-router-dom';
import 'babel-polyfill';

import FlipMove from 'react-flip-move'; // https://github.com/joshwcomeau/react-flip-move
import Select from 'react-select'; // https://react-select.com/home
import CreatableSelect from 'react-select/creatable'; // https://react-select.com/creatable
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

import {Link, Twig, generatePath, abortableFetch, mapObject, filterObjectByKeys, popUpWindow} from './common';
import {LogoSpinner} from './logo';
import {Panel} from './ui';
import {Tag} from './panel-tags';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

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

    var style = {...this.props.style, color: "#2B71B1", cursor: "pointer"}

    if (!this.props.pinnable && !this.props.checked) {
      // then we only allow unpinning, not pinning.  So disable pointer events
      // and make transparent.
      style.pointerEvents = 'none'
      style.color = 'transparent'
    }

    return (
      <span style={style} title={title} onMouseEnter={()=>{this.setState({hover: true})}} onMouseLeave={()=>{this.setState({hover: false})}} onClick={this.onClick}>
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
      expandedDetails: false,
      expandedValue: false,
      expandedUnit: false,
      userValue: null, // value the user is requesting to be changed
      userUnit: null, // unit the user is requesting to be changed
    };
    this.abortGetDetailsController = null;
    this.ref = React.createRef();

    this.expandFromClick = false;
  }
  toggleExpandedDetails = () => {
    if (this.props.PSPanel.state.activeParameter===this.props.uniqueidkey) {
      if (this.props.PSPanel.state.activeParameterDetails) {
        this.props.PSPanel.setState({activeParameter: null})
        this.props.PSPanel.setState({activeParameterDetails: false})
        this.props.PSPanel.setState({activeParameterValue: false})
        this.props.PSPanel.setState({activeParameterUnit: false})
      } else {
        this.props.PSPanel.setState({activeParameterDetails: true})
      }
    } else {
      // try to prevent the scroll action
      this.expandFromClick = true;
      this.props.PSPanel.setState({activeParameter: this.props.uniqueidkey})
      this.props.PSPanel.setState({activeParameterDetails: true})
      this.props.PSPanel.setState({activeParameterValue: false})
      this.props.PSPanel.setState({activeParameterUnit: false})
    }
  }
  toggleExpandedValue = (e) => {
    e.stopPropagation();
    if (this.props.PSPanel.state.activeParameter===this.props.uniqueidkey) {
      // this.props.PSPanel.setState({activeParameter: null})
      // this.props.PSPanel.setState({activeParameterDetails: false})
      this.props.PSPanel.setState({activeParameterValue: !this.props.PSPanel.state.activeParameterValue})
      this.props.PSPanel.setState({activeParameterUnit: false})
    } else {
      // try to prevent the scroll action
      this.expandFromClick = true;
      this.props.PSPanel.setState({activeParameter: this.props.uniqueidkey})
      this.props.PSPanel.setState({activeParameterDetails: false})
      this.props.PSPanel.setState({activeParameterValue: true})
      this.props.PSPanel.setState({activeParameterUnit: false})
    }
  }
  updateUserValue = (newValue) => {
    this.setState({userValue: newValue})
  }
  submitSetValue = (e) => {
    // console.log("request "+this.props.uniqueid+" to change to "+this.state.userValue)
    if (this.props.paramOverview.class==='ConstraintParameter') {
      console.log('ConstraintParameter submit value'+this.state.userValue)
      if (this.state.userValue) {
        this.props.app.socket.emit('bundle_method', {'method': 'flip_constraint', 'bundleid': this.props.bundle.state.bundleid, 'uniqueid': this.props.uniqueid, 'solve_for': this.state.userValue})
      }
    } else {
      this.props.app.socket.emit('set_value', {'bundleid': this.props.bundle.state.bundleid, 'uniqueid': this.props.uniqueid, 'value': this.state.userValue});
    }
    this.toggleExpandedValue(e)

  }
  toggleExpandedUnit = (e) => {
    e.stopPropagation();
    if (this.props.PSPanel.state.activeParameter===this.props.uniqueidkey) {
      // this.props.PSPanel.setState({activeParameter: null})
      // this.props.PSPanel.setState({activeParameterDetails: false})
      this.props.PSPanel.setState({activeParameterValue: false})
      this.props.PSPanel.setState({activeParameterUnit: !this.props.PSPanel.state.activeParameterUnit})
    } else {
      // try to prevent the scroll action
      this.expandFromClick = true;
      this.props.PSPanel.setState({activeParameter: this.props.uniqueidkey})
      this.props.PSPanel.setState({activeParameterDetails: false})
      this.props.PSPanel.setState({activeParameterValue: false})
      this.props.PSPanel.setState({activeParameterUnit: true})
    }
  }
  updateUserUnit = (newUnit) => {
    this.setState({userUnit: newUnit})
  }
  submitSetUnit = (e) => {
    this.props.app.socket.emit('set_default_unit', {'bundleid': this.props.bundle.state.bundleid, 'uniqueid': this.props.uniqueid, 'unit': this.state.userUnit});
    this.toggleExpandedUnit(e)
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
    if (ispinned !== this.state.pinned) {
      this.setState({pinned: ispinned})
    }

    var active = this.props.PSPanel.state.activeParameter===this.props.uniqueidkey || this.props.bundle.state.paramsfilteredids.length===1;
    var expandedDetails = active && this.props.PSPanel.state.activeParameterDetails
    if (expandedDetails !== this.state.expandedDetails) {
      this.setState({expandedDetails: expandedDetails})
      if (expandedDetails && !this.expandFromClick) {
        this.ref.current.scrollIntoView(true);
      }
      if (this.expandFromClick) {
        // reset so clicking on a link will use scroll behavior
        this.expandFromClick = false
      }
    }

    var expandedValue = active && this.props.PSPanel.state.activeParameterValue
    if (expandedValue != this.state.expandedValue) {
      this.setState({expandedValue: expandedValue})
    }

    var expandedUnit = active && this.props.PSPanel.state.activeParameterUnit
    if (expandedUnit != this.state.expandedUnit) {
      this.setState({expandedUnit: expandedUnit})
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
    if (['SelectParameter', 'SelectTwigParameter', 'FloatArrayParameter', 'DistributionParameter', 'ConstraintParameter'].indexOf(this.props.paramOverview.class)!==-1 && !this.state.expandedValue && !this.state.expandedUnit &&!this.state.expandedDetails && this.state.receivedDetails) {
      // reset so that we force a new refresh next time - this is only needed for parameters where we rely on state.details.value vs props.valuestr
      this.setState({receivedDetails: false, details: {}})
    }

    if ((this.state.expandedDetails || (this.state.expandedValue && ['ChoiceParameter', 'SelectParameter', 'SelectTwigParameter', 'UnitParameter', 'FloatArrayParameter', 'BoolParameter', 'DistributionParameter', 'ConstraintParameter'].indexOf(this.props.paramOverview.class)!==-1) || this.state.expandedUnit) && !this.state.receivedDetails) {
      this.setState({receivedDetails: true})

      this.abortGetDetailsController = new window.AbortController();
      abortableFetch("http://"+this.props.app.state.serverHost+"/parameter/"+this.props.bundle.state.bundleid+"/"+this.props.uniqueid, {signal: this.abortGetDetailsController.signal})
        .then(res => res.json())
        .then(json => {
          if (json.data.success) {
            console.log("received parameter details")
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


    let inlineValueContent, expandedValueContent, color
    if (this.state.expandedValue) {
      if (this.props.paramOverview.class==='FloatArrayParameter') {
        expandedValueContent = <span style={{verticalAlign: "super"}}>
                                <InputFloatArray app={this.props.app} parameter={this}/>
                             </span>
      } else if (this.props.paramOverview.class==='DistributionParameter') {
        expandedValueContent = <span style={{verticalAlign: "super"}}>
                                <InputDistribution app={this.props.app} bundle={this.props.bundle} parameter={this}/>
                             </span>
      } else if (['SelectParameter', 'SelectTwigParameter'].indexOf(this.props.paramOverview.class)!==-1) {
        expandedValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
                                <span><Input type='select' origValue={this.state.details.value} onChange={this.updateUserValue} choices={this.state.details.choices}/></span>
                                <span onClick={this.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                             </span>
      } else if (this.props.paramOverview.class==='ConstraintParameter') {
        expandedValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
                                  <InputConstraint parameter={this} onChange={this.updateUserValue}/>
                                <span onClick={this.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                             </span>
      } else if (this.props.paramOverview.class==='HierarchyParameter') {
        expandedValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
                                SET VALUE HierarchyParameter
                                <span onClick={this.toggleExpandedValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                             </span>
      } else if (['ChoiceParameter', 'BoolParameter', 'UnitParameter'].indexOf(this.props.paramOverview.class)!==-1) {
        inlineValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
                                <span><Input type='choice' origValue={this.props.paramOverview.valuestr} onChange={this.updateUserValue} choices={this.state.details.choices}/></span>
                                <span onClick={this.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                             </span>
      } else if (this.props.paramOverview.class==='IntParameter') {
        inlineValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
                                <span><Input type='int' origValue={this.props.paramOverview.valuestr} onChange={this.updateUserValue}/></span>
                                <span onClick={this.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                             </span>
      } else if (this.props.paramOverview.class==='FloatParameter') {
        if (this.props.paramOverview.unitstr) {
          inlineValueContent = <span style={{verticalAlign: "super"}}>
                                  <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
                                  <span><Input type='floatunits' origValue={this.props.paramOverview.valuestr+" "+this.props.paramOverview.unitstr} onChange={this.updateUserValue}/></span>
                                  <span onClick={this.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                               </span>
        } else {
          inlineValueContent = <span style={{verticalAlign: "super"}}>
                                  <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
                                  <span><Input type='float' origValue={this.props.paramOverview.valuestr} onChange={this.updateUserValue}/></span>
                                  <span onClick={this.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                               </span>
        }
      } else {
        inlineValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
                                <span><Input type='string' origValue={this.props.paramOverview.valuestr} onChange={this.updateUserValue}/></span>
                                <span onClick={this.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                             </span>
      }
    } else if (!this.state.expandedUnit) {
      color = this.props.paramOverview.readonly ? "slategray" : "black"
      var title = "value="+this.props.paramOverview.valuestr
      if (this.props.bundle.state.failedConstraints.indexOf(this.props.uniqueid)!==-1) {
        // then this parameter's value is out-of-date because of a failed
        // constraint that needs to be addressed
        color = 'red'
        title += ' (not updated due to failed constraint)'
      }
      inlineValueContent = <span onClick={this.props.paramOverview.readonly ? null : this.toggleExpandedValue} title={title} style={{display: "inline-block", color: color, textAlign: "right", width: "180px", paddingLeft: "5px", whiteSpace: "nowrap", overflowX: "hidden"}}>
                              {this.props.paramOverview.valuestr}
                           </span>
    }

    let inlineUnitContent
    if (this.state.expandedUnit) {
      inlineUnitContent = <span style={{verticalAlign: "super"}}>
                              <span onClick={this.toggleExpandedUnit} className="btn fa-fw fas fa-times" title="cancel changes"/>
                              <span><Input type='choice' origValue={this.props.paramOverview.unitstr} onChange={this.updateUserUnit} choices={this.state.details.unit_choices}/></span>
                              <span onClick={this.submitSetUnit} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
                           </span>
    } else if (!this.state.expandedValue) {
      inlineUnitContent = <span onClick={this.toggleExpandedUnit} title={"unit="+this.props.paramOverview.unitstr} style={{display: "inline-block", textAlign: "left", width: "65px", paddingLeft: "5px", whiteSpace: "nowrap", overflowX: "hidden"}}>
                            {this.props.paramOverview.unitstr}
                          </span>
    }

    if (this.state.expandedDetails && this.props.bundle.queryParams['lastActive'] != this.props.uniqueid) {
      this.props.bundle.setQueryParams({lastActive: this.props.uniqueid})
    }

    return (
      <div ref={this.ref} className='phoebe-parameter'>
        <div className='phoebe-parameter-header' style={{minWidth: "250px"}}>
          <Checkbox style={{verticalAlign: "super"}} checked={this.state.pinned} pinnable={this.props.pinnable} onClick={this.togglePinned} checkedTitle="unpin parameter" uncheckedTitle="pin parameter" />

          <span style={{display: "inline-block", marginLeft: "10px", fontWeight: "bold", width: "calc(100% - 280px)", overflowX: "hidden"}} onClick={this.toggleExpandedDetails}>
            <Twig twig={this.props.paramOverview.twig} paramOverview={this.props.paramOverview}/>
          </span>

          {inlineValueContent}
          {inlineUnitContent}

        </div>

        {expandedValueContent ?
          <div className='phoebe-parameter-content' style={{minHeight: "100px"}}>
            {expandedValueContent}
          </div>
          :
          null
        }

        {this.state.expandedDetails ?
          <div className='phoebe-parameter-content'>
            <ParameterDetailsItem title="Description">
              {this.state.details.description || null}
            </ParameterDetailsItem>

            {this.props.disableFiltering ?
              null
              :
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
                    {this.props.paramOverview.time && <div><Tag bundle={this.props.bundle} group="time" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.time}/></div>}
                    {this.props.paramOverview.qualifier && <div><Tag bundle={this.props.bundle} group="qualifier" includeGroup={true} currentGroupFilter={null} tag={this.props.paramOverview.qualifier}/></div>}
                  </span>
              </ParameterDetailsItem>
            }


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

            {Object.keys(this.state.details.referenced_parameter || {}).length ?
              <ParameterDetailsItem title="Referenced Parameter">
                <div style={{display: "inline-block"}}>
                  {mapObject(this.state.details.referenced_parameter, (uniqueid, twig) => {
                    return <ParameterDetailsItemPin key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} uniqueid={uniqueid} twig={twig} disableFiltering={this.props.disableFiltering}/>
                  })}
                </div>
              </ParameterDetailsItem>
            :
            null
            }

            {this.state.details.is_adjustable || false ?
              <ParameterDetailsItem title="Distributions">
                <div style={{display: "inline-block"}}>
                  {mapObject(this.state.details.distributions || {} , (uniqueid, twig) => {
                    return <ParameterDetailsItemPin key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} uniqueid={uniqueid} twig={twig} disableFiltering={this.props.disableFiltering}/>
                  })}
                  <Link to={generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, 'add_distribution', this.props.bundle.getSearchString())}><span className="fas fa-fw fa-plus" style={{paddingLeft: "26px", paddingRight: "22px"}}></span><span style={{color: "#000000"}}>add distribution</span></Link>
                </div>
              </ParameterDetailsItem>
            :
            null
            }

            {Object.keys(this.state.details.constraint || {}).length ?
              <ParameterDetailsItem title="Constraint">
                <div style={{display: "inline-block"}}>
                  {mapObject(this.state.details.constraint, (uniqueid, twig) => {
                    return <ParameterDetailsItemPin key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} uniqueid={uniqueid} twig={twig} disableFiltering={this.props.disableFiltering}/>
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
                    return <ParameterDetailsItemPin key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} uniqueid={uniqueid} twig={twig} disableFiltering={this.props.disableFiltering}/>
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
                    return <ParameterDetailsItemPin key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} uniqueid={uniqueid} twig={twig} disableFiltering={this.props.disableFiltering}/>
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
  // constructor(props) {
    // super(props);
    // this.state = {
      // pinned: false,
    // };
  // }
  addToPinned = () => {
    var pinned = this.props.bundle.queryParams.pinned || []
    var newPinned = pinned.concat(this.props.uniqueid)
    this.props.bundle.setQueryParams({pinned: newPinned})
  }
  expandParameter = () => {
    this.props.PSPanel.setState({activeParameterDetails: true})
    this.props.PSPanel.setState({activeParameterValue: false})
    this.props.PSPanel.setState({activeParameterUnit: false})
    this.props.PSPanel.setState({activeParameter: 'PS:'+this.props.uniqueid})
  }
  popParameter = () => {
    var bundleid = this.props.bundle.state.bundleid || this.props.bundle.match.params.bundleid

    var url = generatePath(this.props.app.state.serverHost, bundleid, 'ps');
    var win = popUpWindow(url, `?advanced=["onlyPinned"]&pinned=["${this.props.uniqueid}"]`);
    // TODO: callback to remove from childrenWindows when manually closed?
    this.props.bundle.childrenWindows.push(win);

  }
  render() {
    var isCurrentlyVisible = this.props.bundle.state.paramsfilteredids.indexOf(this.props.uniqueid) !== -1

    return (
      <div>
        {isCurrentlyVisible ?
          <span style={{color: "#2B71B1", cursor: "pointer"}} className="fa-fw fas fa-sign-in-alt" onClick={this.expandParameter} title="go to parameter"/>
          :
          this.props.disableFiltering ?
            <span style={{minWidth: "20px", display: "inline-block"}}></span>
            :
            <Checkbox checked={false} pinnable={true} onClick={this.addToPinned} checkedTitle="unpin parameter" uncheckedTitle="pin parameter"/>

        }
        <span style={{marginLeft: "4px", color: "#2B71B1", cursor: "pointer"}} title="open parameter in external window" onClick={this.popParameter} className="fas fa-fw fa-external-link-alt"/>

        <Twig twig={this.props.twig}/>


      </div>
    )
  }
}

class Input extends Component {
  constructor(props) {
    super(props);
    this.state = {
      origValue: this.props.origValue || null,
      value: this.props.origValue || null
    };
    this.refinput = React.createRef();
  }
  onChange = (e) => {
    var value = null;
    if (this.props.type == 'float') {
      value = e.target.value.replace(/[^0-9.-]/g, '');
    } else if (this.props.type == 'floatunits') {
      // allow space and [a-z,A-Z] if units
      value = e.target.value.replace(/[^0-9A-Za-z.-\s]/g, '');
    } else if (this.props.type == 'int') {
      value = e.target.value.replace(/[^0-9-]/g, '');
    } else if (this.props.type == 'array') {
      value = e.target.value.replace(/[^0-9-\.\,]/g, '');
    } else if (this.props.type == 'choice') {
      value = e.value
    } else if (this.props.type == 'select') {
      if (e) {
        value = e.map((item) => item.value)
      } else {
        value = []
      }
    } else {
      value = e.target.value
    }


    this.setState({value: value});
    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }
  componentDidMount() {
    const focusOnMount = !(this.props.disableFocusOnMount || false);
    if (this.refinput.current && focusOnMount) {
      this.refinput.current.select();
    }
  }
  render() {
    if (this.props.origValue !== this.state.origValue) {
      // we do this so that a change in origValue from the props will force
      // and update
      this.setState({origValue: this.props.origValue, value: this.props.origValue})
    }


    if (this.props.type==='choice' || this.props.type==='select') {
      var width = this.props.width || "185px"
      var choices = this.props.choices || [];
      var choicesList = choices.map((choice) => ({value: choice, label: choice}))

      if (this.props.type==='choice') {
        var className = 'phoebe-parameter-choice'
        var defaultValueList = {value: this.props.origValue, label: this.props.origValue}
        var valueList = {value: this.state.value, label: this.state.value} || null
        var isMulti = false
      } else if (this.props.type==='select') {
        width = "calc(100% - 80px)"
        var className = 'phoebe-parameter-select'
        if (this.props.origValue) {
          var defaultValueList = this.props.origValue.map((choice) => ({value: choice, label: choice}))
        } else {
          var defaultValueList = null
        }

        var value = this.state.value
        if (value) {
          var valueList = value.map((choice) => ({value: choice, label: choice}))
        } else {
          var valueList = defaultValueList
        }

        var isMulti = true
      }

      if (this.props.origValue) {
      } else {
        var defaultValueList = null
      }

      if (isMulti) {
        return (
          <span style={{marginLeft: "10px", marginRight: "10px", width: width, height: "26px", display: "inline-block", verticalAlign: "sub", lineHeight: "1.0"}}>
            <CreatableSelect options={choicesList} defaultValue={defaultValueList} value={valueList} onChange={this.onChange} defaultMenuIsOpen={!(this.props.disableFocusOnMount || false)} isMulti={isMulti} isClearable={isMulti} closeMenuOnSelect={!isMulti} components={animatedComponents} className={className} classNamePrefix={className}/>
          </span>
        )
      } else {

        return (
          <span style={{marginLeft: "10px", marginRight: "10px", width: width, height: "26px", display: "inline-block", verticalAlign: "sub", lineHeight: "1.0"}}>
            <Select options={choicesList} defaultValue={defaultValueList} value={valueList} onChange={this.onChange} defaultMenuIsOpen={!(this.props.disableFocusOnMount || false)} isMulti={isMulti} isClearable={isMulti} closeMenuOnSelect={!isMulti} components={animatedComponents} className={className} classNamePrefix={className}/>
          </span>
        )
      }
    } else if (this.props.type == 'array') {
      return (
        <span>
          <input ref={this.refinput} id={this.props.id} type="text" style={{marginLeft: "10px", marginRight: "10px", width: "calc(100% - 80px)", height: "26px", borderRadius: "4px", border: "1px solid lightgray"}} name="value" title="value" value={this.state.value || this.props.origValue} onChange={this.onChange}/>
        </span>
      )
    } else {
      return (
        <input ref={this.refinput} id={this.props.id} type="text" style={{marginLeft: "10px", marginRight: "10px", width: this.props.width || "185px", height: "26px", borderRadius: "4px", border: "1px solid lightgray"}} name="value" title="value" value={this.state.value || this.props.origValue} onChange={this.onChange}/>
      )
    }
  }
}

class InputFloatArray extends Component {
  constructor(props) {
    super(props);
    this.state = {
      valueType: null,
      inputType: null,
      args: {},
      userArgs: {},
      argsLoaded: false,
    };
    this.refinput = React.createRef();
  }
  updateArgs = (value) => {


    if (!this.props.parameter || !this.props.parameter.state.details || this.props.parameter.state.details.value === undefined) {
      console.log("deferring converting nparray")
      return
    }

    if (!value) {
      value = this.props.parameter.state.details.value
    }

    this.abortGetArgsForType = new window.AbortController();

    console.log("requesting conversion of nparray: "+JSON.stringify(value))
    abortableFetch("http://"+this.props.app.state.serverHost+"/nparray/"+JSON.stringify(value), {signal: this.abortGetArgsForType.signal})
      .then(res => res.json())
      .then(json => {
        console.log(json)
        if (json.data.success) {
          var args = json.data.response
          // api won't return the original array (just to be cheaper)
          args[this.state.valueType] = this.props.parameter.state.details.value

          this.setState({args: args, argsLoaded: true})

          if (!this.state.userArgs[this.state.inputType]) {
            var userArgs = this.state.userArgs
            userArgs[this.state.inputType] = args[this.state.inputType]
            this.setState({userArgs: userArgs})
          }

        } else {
          console.log("server error (ignoring for now): "+json.data.error);
          this.setState({userArgs: {}})
        }
      }, err=> {
        // then we canceled the request
        console.log("received abort signal")
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          // then we canceled the request
          console.log("received abort signal")
        } else {
          // alert("server error, try again")
          console.log("server error (ignoring for now)")
          this.setState({userArgs: {}})
        }
      });
  }
  onChange = (type, key, value) => {
    // console.log("onChange "+type+" "+key+" "+value)
    var userArgs = this.state.userArgs

    if (type==='array') {
      // this.updateArgs(value)
      userArgs = {'array': value}
      this.props.parameter.updateUserValue(value)
    } else {
      if (!userArgs[type]) {
        userArgs[type] = this.state.args[type]
      }
      userArgs[type][key] = value

      this.updateArgs(userArgs[type]);
      this.props.parameter.updateUserValue(userArgs[type])
    }
    this.setState({userArgs: userArgs})

  }
  onChangeType = (type) => {
    var userArgs = this.state.userArgs
    if (!userArgs[type]) {
      userArgs[type] = this.state.args[type]
    }
    this.props.parameter.updateUserValue(userArgs[type])
    this.setState({inputType: type})
  }
  componentDidUpdate() {
    if (!this.state.argsLoaded) {
      this.updateArgs();
    }
  }
  componentWillUnmount() {
    this.setState({inputType: null})
  }
  render() {
    var btnStyle = {width: "calc(25% - 4px)", margin: "2px", textAlign: "center", lineHeight: "1em"}

    if (this.state.inputType == null && this.props.parameter.state.details && this.props.parameter.state.details.value!==undefined) {
      const nparrayType = this.props.parameter.state.details.value.nparray || ''
      if (nparrayType === 'linspace') {
        this.setState({valueType: 'linspace', inputType: 'linspace'})
      } else if (nparrayType === 'arange') {
        this.setState({valueType: 'arange', inputType: 'arange'})
      } else {
        this.setState({valueType: 'array', inputType: 'array'})
      }
    }

    const disabledInputStyle = {marginLeft: "10px", marginRight: "10px", width: "calc(100% - 80px)", height: "26px", borderRadius: "4px", border: "1px solid lightgray"};

    var args = this.state.args[this.state.inputType] || undefined;
    if (this.state.inputType == 'array') {
      args = this.state.args['arraystr'] || ''
    }

    if (args === undefined) {
      return (null)
    }
    // console.log("args for "+this.state.inputType+"(valueType="+this.state.valueType+"): ")
    // console.log(args)

    var input = null
    var belowInput = null
    const spanLabelStyle = {padding: "2px", display: "inline-block"}
    const inputWidth = "80px"
    if (this.state.inputType === 'linspace') {
      input = <span><input type="text" value={this.state.args.arraystr || ''} disabled style={disabledInputStyle}/></span>
      spanLabelStyle.width = "calc(25% - 2px)"
      belowInput = <div style={{display: 'block'}}>
                    <span style={spanLabelStyle}>
                      start
                      <Input type='float' origValue={args.start.toString()} onChange={(inputValue) => this.onChange('linspace', 'start', inputValue)} width={inputWidth}/>
                    </span>
                    <span style={spanLabelStyle}>
                      stop
                      <Input type='float' origValue={args.stop.toString()} onChange={(inputValue) => this.onChange('linspace', 'stop', inputValue)} width={inputWidth} disableFocusOnMount={true}/>
                    </span>
                    <span style={spanLabelStyle}>
                      num
                      <Input type='int' origValue={args.num.toString()} onChange={(inputValue) => this.onChange('linspace', 'num', inputValue)} width={inputWidth} disableFocusOnMount={true}/>
                    </span>
                    <span>
                      endpoint
                      <Input type='choice' choices={['True', 'False']} origValue={args.endpoint.toString()} onChange={(inputValue) => this.onChange('linspace', 'endpoint', inputValue)} width={inputWidth} disableFocusOnMount={true}/>
                    </span>
              </div>
    } else if (this.state.inputType === 'arange') {
      input = <span><input type="text" value={this.state.args.arraystr || ''} disabled style={disabledInputStyle}/></span>
      spanLabelStyle.width = "calc(33% - 2px)"
      belowInput = <div style={{display: 'block'}}>
                    <span style={spanLabelStyle}>
                      start
                      <Input type='float' origValue={args.start.toString()} onChange={(inputValue) => this.onChange('arange', 'start', inputValue)} width={inputWidth}/>
                    </span>
                    <span style={spanLabelStyle}>
                      stop
                      <Input type='float' origValue={args.stop.toString()} onChange={(inputValue) => this.onChange('arange', 'stop', inputValue)} width={inputWidth} disableFocusOnMount={true}/>
                    </span>
                    <span style={{padding: "2px", display: "inline-block"}}>
                      step
                      <Input type='float' origValue={args.step.toString()} onChange={(inputValue) => this.onChange('arange', 'step', inputValue)} width={inputWidth} disableFocusOnMount={true}/>
                    </span>
              </div>
    } else if (this.state.inputType === 'file') {
      input = <span><input type="text" disabled style={disabledInputStyle}/></span>
      belowInput = <span>file input support coming soon</span>
    } else if (this.state.inputType === 'array') {
      input = <Input type='array' origValue={args.toString()} onChange={(inputValue) => this.onChange('array', 'value', inputValue)}/>
    }

    return (
      <React.Fragment>
        <span onClick={this.props.parameter.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
        <span>{input}</span>
        <span onClick={this.props.parameter.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>
        {this.state.argsLoaded ?
          <React.Fragment>
            <span>{belowInput}</span>
            <div>
              <span className={this.state.inputType=='array' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('array')}}>array</span>
              <span className={this.state.inputType=='linspace' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('linspace')}}>linspace</span>
              <span className={this.state.inputType=='arange' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('arange')}}>arange</span>
              <span className={this.state.inputType=='file' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{alert("not yet implemented: can import in bulk from import button on main toolbar")}}>file import</span>
            </div>
          </React.Fragment>
          :
          null
        }


      </React.Fragment>

    )
  }
}

class InputDistribution extends Component {
  constructor(props) {
    super(props);
    this.state = {
      valueType: null,
      inputType: null,
      args: {},
      userArgs: {},
      argsLoaded: false,
      current_face_value: null,
    };
    this.refinput = React.createRef();
  }
  updateArgs = (value) => {


    if (!this.props.parameter || !this.props.parameter.state.details || this.props.parameter.state.details.value === undefined) {
      console.log("deferring converting distl object")
      return
    }

    if (!this.state.current_face_value) {
        var current_face_value_uniqueid = Object.keys(this.props.parameter.state.details.referenced_parameter)[0]
        var current_face_value = this.props.bundle.state.params[current_face_value_uniqueid].valuestr
        this.setState({current_face_value: current_face_value})
    }

    if (!value) {
      value = this.props.parameter.state.details.value
    }

    this.abortGetArgsForType = new window.AbortController();

    console.log("requesting conversion of distl object: "+JSON.stringify(value)+ " current face value: "+this.state.current_face_value)
    abortableFetch("http://"+this.props.app.state.serverHost+"/distl/"+JSON.stringify(value)+"/"+this.state.current_face_value, {signal: this.abortGetArgsForType.signal})
      .then(res => res.json())
      .then(json => {
        // console.log(json)
        if (json.data.success) {
          var args = json.data.response
          // api won't return the original array (just to be cheaper)
          args[this.state.valueType] = this.props.parameter.state.details.value

          this.setState({args: args, argsLoaded: true})

          if (!this.state.userArgs[this.state.inputType]) {
            var userArgs = this.state.userArgs
            userArgs[this.state.inputType] = args[this.state.inputType]
            this.setState({userArgs: userArgs})
          }

        } else {
          console.log("server error (ignoring for now): "+json.data.error);
          this.setState({userArgs: {}})
        }
      }, err=> {
        // then we canceled the request
        console.log("received abort signal")
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          // then we canceled the request
          console.log("received abort signal")
        } else {
          // alert("server error, try again")
          console.log("server error (ignoring for now)")
          this.setState({userArgs: {}})
        }
      });
  }
  onChange = (type, key, value) => {
    // console.log("onChange "+type+" "+key+" "+value)
    var userArgs = this.state.userArgs

    if (!userArgs[type]) {
      userArgs[type] = this.state.args[type]
    }
    userArgs[type][key] = value

    this.updateArgs(userArgs[type]);
    this.props.parameter.updateUserValue(userArgs[type])

    this.setState({userArgs: userArgs})

  }
  onChangeType = (type) => {
    var userArgs = this.state.userArgs
    if (!userArgs[type]) {
      userArgs[type] = this.state.args[type]
    }
    this.props.parameter.updateUserValue(userArgs[type])
    this.setState({inputType: type})
  }
  componentDidUpdate() {
    if (!this.state.argsLoaded) {
      this.updateArgs();
    }
  }
  componentWillUnmount() {
    this.setState({inputType: null})
  }
  render() {
    // var btnStyle = {width: "calc(25% - 4px)", margin: "2px", textAlign: "center", lineHeight: "1em"}
    var btnStyle = {width: "calc(33% - 4px)", margin: "2px", textAlign: "center", lineHeight: "1em"}

    if (this.state.inputType == null && this.props.parameter.state.details && this.props.parameter.state.details.value!==undefined) {
      console.log(this.props.parameter.state.details.value)
      const distlType = this.props.parameter.state.details.value.distl || ''
      this.setState({valueType: distlType, inputType: distlType})
    }

    const disabledInputStyle = {marginLeft: "10px", marginRight: "10px", width: "calc(100% - 80px)", height: "26px", borderRadius: "4px", border: "1px solid lightgray"};

    var args = this.state.args[this.state.inputType] || undefined;

    if (args === undefined) {
      return (null)
    }
    // console.log("args for "+this.state.inputType+"(valueType="+this.state.valueType+"): ")
    // console.log(args)

    var belowInput = null
    const spanLabelStyle = {padding: "2px", display: "inline-block"}
    const inputWidth = "80px"
    if (this.state.inputType === 'Delta') {
      spanLabelStyle.width = "calc(100% - 60px)"
      belowInput = <div style={{display: 'inline'}}>
                    <span style={spanLabelStyle}>
                      loc
                      <Input type='float' origValue={args.loc.toString()} onChange={(inputValue) => this.onChange('Delta', 'loc', inputValue)} width={inputWidth}/>
                    </span>
              </div>
    } else if (this.state.inputType === 'Delta_Around') {
      spanLabelStyle.width = "calc(100% - 60px)"
      belowInput = <div style={{display: 'inline'}}>
                    <span style={spanLabelStyle}>
                      loc
                      <input type='text' value={this.state.current_face_value} disabled style={disabledInputStyle}/>
                    </span>
                    </div>
    } else if (this.state.inputType === 'Uniform') {
      spanLabelStyle.width = "calc(50% - 30px)"
      belowInput = <div style={{display: 'inline'}}>
                    <span style={spanLabelStyle}>
                      low
                      <Input type='float' origValue={args.low.toString()} onChange={(inputValue) => this.onChange('Uniform', 'low', inputValue)} width={inputWidth}/>
                    </span>
                    <span style={spanLabelStyle}>
                      high
                      <Input type='float' origValue={args.high.toString()} onChange={(inputValue) => this.onChange('Uniform', 'high', inputValue)} width={inputWidth}/>
                    </span>
              </div>
    } else if (this.state.inputType === 'Uniform_Around') {
      spanLabelStyle.width = "calc(50% - 30px)"
      belowInput = <div style={{display: 'inline'}}>
                    <span style={spanLabelStyle}>
                      loc
                      <input type='text' value={this.state.current_face_value} disabled style={disabledInputStyle}/>
                    </span>
                    <span style={spanLabelStyle}>
                      width
                      <Input type='float' origValue={args.width.toString()} onChange={(inputValue) => this.onChange('Uniform_Around', 'width', inputValue)} width={inputWidth}/>
                    </span>
              </div>
    } else if (this.state.inputType === 'Gaussian') {
      spanLabelStyle.width = "calc(50% - 30px)"
      belowInput = <div style={{display: 'inline'}}>
                    <span style={spanLabelStyle}>
                      loc
                      <Input type='float' origValue={args.loc.toString()} onChange={(inputValue) => this.onChange('Gaussian', 'loc', inputValue)} width={inputWidth}/>
                    </span>
                    <span style={spanLabelStyle}>
                      scale
                      <Input type='float' origValue={args.scale.toString()} onChange={(inputValue) => this.onChange('Gaussian', 'scale', inputValue)} width={inputWidth}/>
                    </span>
              </div>
    } else if (this.state.inputType === 'Gaussian_Around') {
      spanLabelStyle.width = "calc(50% - 30px)"
      belowInput = <div style={{display: 'inline'}}>
                    <span style={spanLabelStyle}>
                      loc
                      <input type='text' value={this.state.current_face_value} disabled style={disabledInputStyle}/>
                    </span>
                    <span style={spanLabelStyle}>
                      scale
                      <Input type='float' origValue={args.scale.toString()} onChange={(inputValue) => this.onChange('Gaussian_Around', 'scale', inputValue)} width={inputWidth}/>
                    </span>
              </div>
    }

    return (
      <React.Fragment>
        {this.state.argsLoaded ?
          <React.Fragment>
            <span onClick={this.props.parameter.toggleExpandedValue} className="btn fa-fw fas fa-times" title="cancel changes"/>
            <span>{belowInput}</span>
            <span onClick={this.props.parameter.submitSetValue} style={{marginLeft: "-10px"}} className="btn fa-fw fas fa-check" title="apply changes"/>

            <div>
              <span className={this.state.inputType=='Delta' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('Delta')}}>delta</span>
              <span className={this.state.inputType=='Uniform' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('Uniform')}}>uniform</span>
              <span className={this.state.inputType=='Gaussian' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('Gaussian')}}>gaussian</span>
              {/* <span className={this.state.inputType=='Other' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{alert("not yet implemented")}}>other</span> */}
            </div>
            <div>
              <span className={this.state.inputType=='Delta_Around' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('Delta_Around')}}>delta around</span>
              <span className={this.state.inputType=='Uniform_Around' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('Uniform_Around')}}>uniform around</span>
              <span className={this.state.inputType=='Gaussian_Around' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{this.onChangeType('Gaussian_Around')}}>gaussian around</span>
              {/* <span className={this.state.inputType=='Other' ? 'btn btn-primary btn-primary-active' : 'btn btn-primary'} style={btnStyle} onClick={()=>{alert("not yet implemented")}}>other</span> */}
            </div>
          </React.Fragment>
          :
          null
        }


      </React.Fragment>

    )
  }
}

class InputConstraint extends Component {
  constructor(props) {
    super(props);
    this.state = {
      solve_for: null
    }
  }
  onChange = (twig) => {
    if (this.state.value === twig) {
      twig = null;
    }

    this.setState({solve_for: twig})

    if (this.props.onChange) {
      this.props.onChange(twig)
    }
  }
  renderPart = (part) => {
    if (part===null) {
      return null
    } else if (part.indexOf("{") === -1) {
      return <span>{part}</span>
    } else {
      var twig = part.replace(/[{}]/g, '')
      return <span className={this.state.solve_for==twig ? 'btn btn-tag btn-tag-selected' : 'btn btn-tag btn-tag-unselected'} style={{width: 'fit-content', maxWidth: 'fit-content'}} title={'solve for '+twig} onClick={() => this.onChange(twig)}>{twig}</span>
    }
  }
  render() {
    var parts = [];
    if (this.props.parameter.state.details && this.props.parameter.state.details.value!==undefined) {
      parts = this.props.parameter.state.details.value.split(/(\{[a-zA-Z0-9_@]*\})/g)
    }

    var constrains = null
    if (this.props.parameter.state.details && this.props.parameter.state.details.constrains!==undefined) {
      constrains = Object.values(this.props.parameter.state.details.constrains)[0]
      if (this.state.solve_for === null) {
        this.setState({solve_for: constrains})
      }
    }

    return (
      <span style={{width: 'calc(100% - 80px)', display: 'inline-block', marginLeft: '10px', marginRight: '10px'}}>
        {constrains ? <span>{this.renderPart('{'+constrains+'}')} <b>=</b> </span> : <span>loading...</span>}
        {parts.map((part) => this.renderPart(part))}
      </span>
    )
  }
}

class ChecksReportItem extends Component {
  render() {

    var style = {padding: "10px", marginBottom: "5px"}

    if (this.props.report.level == 'ERROR') {
      style.borderLeft = '4px solid rgba(255,0,0,0.6)';
    } else if (this.props.report.level == 'WARNING') {
      style.borderLeft = '4px solid rgba(255,255,0,1.0)';
    }


    return (
      <div style={style}>
        <b>{this.props.report.level}</b>: {this.props.report.message}

        {Object.keys(this.props.report.parameters).map(twig => {
          let uniqueid = this.props.report.parameters[twig]
          let param = this.props.bundle.state.params[uniqueid]
          return <Parameter key={uniqueid} uniqueid={uniqueid} uniqueidkey={"checks:"+this.props.reportKey+":"+uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} paramOverview={param} pinnable={true} disableFiltering={false} disableScrollTo={true} description={param.description}/>
        })}

      </div>
    )
  }
}

export class PSPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeParameter: null,
      activeParameterDetails: false,
      activeParameterValue: false,
      activeParameterUnit: false,
    };
    this.prevNParams = 0;
  }
  popPS = () => {
    var bundleid = this.props.bundleid || this.props.match.params.bundleid

    var url = generatePath(this.props.app.state.serverHost, bundleid, 'ps');
    var win = popUpWindow(url, window.location.search);
    // TODO: callback to remove from childrenWindows when manually closed?
    this.props.bundle.childrenWindows.push(win);
  }
  orderByChanged = (e) => {
    var value = "Context"
    if (e) {
      value = e.value
    }
    this.props.bundle.setQueryParams({orderBy: value})
  }
  render() {
    var params = this.props.bundle.state.params || {}
    var tags = this.props.bundle.state.tags || {}

    var paramsFiltered = filterObjectByKeys(params, this.props.bundle.state.paramsfilteredids)
    // animations can be laggy, and not even that effective, when there are a
    // lot of changes.  So we'll check the change in length as well as the
    // length itself (in the case of changing orderBy)
    var enablePSAnimation = Math.abs(this.props.bundle.state.paramsfilteredids.length - this.prevNParams) <= 20 && this.props.bundle.state.paramsfilteredids.length <= 20;
    this.prevNParams = this.props.bundle.state.paramsfilteredids.length

    var orderBy = this.props.orderBy
    if (!orderBy) {
      orderBy = this.props.bundle.queryParams.orderBy || 'context'
      if (this.props.disableFiltering) {
        orderBy = 'context'
      }
    }

    var orderByDefault = {value: orderBy, label: orderBy}
    var orderByTags = tags[orderBy+'s'] || []
    orderByTags = orderByTags.concat([null]);

    var orderByChoices = [{value: "context", label: "context"},
                          {value: "kind", label: "kind"},
                          {value: "component", label: "component"},
                          {value: "feature", label: "feature"},
                          {value: "dataset", label: "dataset"},
                          {value: "figure", label: "figure"},
                          {value: "compute", label: "compute"},
                          {value: "model", label: "model"},
                          {value: "time", label: "time"},
                          {value: "qualifier", label: "qualifier"}]

    return (
      <Panel backgroundColor="#e4e4e4" minHeight={this.props.minHeight}>

        {this.props.showChecks && this.props.bundle.state.checksStatus !== 'UNKNOWN' ?
          <div className="phoebe-parameter" style={{padding: "10px"}}>
            {this.props.bundle.state.checksReport.length == 0 ?
              <span style={{borderLeft: "4px solid rgba(0,255,0,0.6)", padding: "10px", marginBottom: "5px"}}><b>PASSING</b>: no errors or warnings to show</span>
              :
              null
            }

            <FlipMove appearAnimation={false} enterAnimation="fade" leaveAnimation="fade" maintainContainerHeight={true}>
              {this.props.bundle.state.checksReport.map((report,i) => {
                return <ChecksReportItem report={report} reportKey={i} bundle={this.props.bundle} PSPanel={this} app={this.props.app}/>
              })}
            </FlipMove>
          </div>
          :
          null
        }



        {this.props.showPopoutButton ?
          <div style={{float: "right", marginTop: "6px", paddingRight: "10px"}}>
            <span className="btn btn-blue" onClick={this.popPS} style={{height: "34px", width: "34px"}} title="popout into external window"><span className="fas fa-fw fa-external-link-alt"/></span>
          </div>
          :
          null
        }

        {this.props.disableFiltering ?
          null
          :
          <div style={{paddingTop: "10px", paddingLeft: "10px"}}>
            Order by:
            <span style={{width: "250px", lineHeight: "1.0", display: "inline-block", paddingLeft: "10px", verticalAlign: "sub"}}>
              <Select options={orderByChoices} defaultValue={orderByDefault} onChange={this.orderByChanged} className="phoebe-parameter-choice" classNamePrefix="phoebe-parameter-choice"/>
            </span>
          </div>
        }


        <div style={{paddingTop: "10px"}}>
          {this.props.bundle.state.paramsfilteredids.length || Object.keys(this.props.bundle.queryParams).length ?

            orderByTags.map(orderByTag => {

              return <PSGroup app={this.props.app} bundle={this.props.bundle} PSPanel={this} orderBy={orderBy} orderByTag={orderByTag} paramsFiltered={paramsFiltered} enablePSAnimation={enablePSAnimation} PSPanelOnly={this.props.PSPanelOnly} disableFiltering={this.props.disableFiltering || false}/>



            })


            :
            <LogoSpinner pltStyle={{backgroundColor: "rgb(43, 113, 177)"}}/>
          }
        </div>

        {this.props.children}

      </Panel>
    )
  }
}

class PSGroup extends Component {
  render() {
    var parameters = []
    parameters = mapObject(this.props.paramsFiltered, (uniqueid, param) => {
      if (param[this.props.orderBy]===this.props.orderByTag) {
        return (<Parameter key={uniqueid} uniqueid={uniqueid} uniqueidkey={'PS:'+uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} paramOverview={param} pinnable={!this.props.PSPanelOnly} disableFiltering={this.props.disableFiltering} description={param.description}/>)
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
