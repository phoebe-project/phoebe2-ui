import React, { Component } from 'react';
// import {Redirect} from 'react-router-dom';

import FlipMove from 'react-flip-move'; // https://github.com/joshwcomeau/react-flip-move

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
    if (this.props.PSPanel.state.activeParameter===this.props.uniqueid) {
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
      this.props.PSPanel.setState({activeParameter: this.props.uniqueid})
      this.props.PSPanel.setState({activeParameterDetails: true})
      this.props.PSPanel.setState({activeParameterValue: false})
      this.props.PSPanel.setState({activeParameterUnit: false})
    }
  }
  toggleExpandedValue = (e) => {
    e.stopPropagation();
    if (this.props.PSPanel.state.activeParameter===this.props.uniqueid) {
      // this.props.PSPanel.setState({activeParameter: null})
      // this.props.PSPanel.setState({activeParameterDetails: false})
      this.props.PSPanel.setState({activeParameterValue: !this.props.PSPanel.state.activeParameterValue})
      this.props.PSPanel.setState({activeParameterUnit: false})
    } else {
      // try to prevent the scroll action
      this.expandFromClick = true;
      this.props.PSPanel.setState({activeParameter: this.props.uniqueid})
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
    this.props.app.socket.emit('set_value', {'bundleid': this.props.bundle.state.bundleid, 'uniqueid': this.props.uniqueid, 'value': this.state.userValue});
    this.toggleExpandedValue(e)

  }
  toggleExpandedUnit = (e) => {
    e.stopPropagation();
    if (this.props.PSPanel.state.activeParameter===this.props.uniqueid) {
      // this.props.PSPanel.setState({activeParameter: null})
      // this.props.PSPanel.setState({activeParameterDetails: false})
      this.props.PSPanel.setState({activeParameterValue: false})
      this.props.PSPanel.setState({activeParameterUnit: !this.props.PSPanel.state.activeParameterUnit})
    } else {
      // try to prevent the scroll action
      this.expandFromClick = true;
      this.props.PSPanel.setState({activeParameter: this.props.uniqueid})
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

    var active = this.props.PSPanel.state.activeParameter===this.props.uniqueid || this.props.bundle.state.paramsfilteredids.length===1;
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
    if ((this.state.expandedDetails || (this.state.expandedValue && ['ChoiceParameter', 'BoolParameter'].indexOf(this.props.paramOverview.class)!==-1) || this.state.expandedUnit) && !this.state.receivedDetails) {
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
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times"/>
                                SET VALUE FloatArrayParameter
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-check"/>
                             </span>
      } else if (this.props.paramOverview.class==='SelectParameter') {
        expandedValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times"/>
                                SET VALUE Selectparameter
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-check"/>
                             </span>
      } else if (this.props.paramOverview.class==='ConstraintParameter') {
        expandedValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times"/>
                                SET VALUE ConstraintParameter
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-check"/>
                             </span>
      } else if (['ChoiceParameter', 'BoolParameter'].indexOf(this.props.paramOverview.class)!==-1) {
        inlineValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times"/>
                                <span><Input type='choice' origValue={this.props.paramOverview.valuestr} onChange={this.updateUserValue} choices={this.state.details.choices}/></span>
                                <span onClick={this.submitSetValue} className="btn fa-fw fas fa-check"/>
                             </span>
      } else if (this.props.paramOverview.class==='IntParameter') {
        inlineValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times"/>
                                <span><Input type='int' origValue={this.props.paramOverview.valuestr} onChange={this.updateUserValue}/></span>
                                <span onClick={this.submitSetValue} className="btn fa-fw fas fa-check"/>
                             </span>
      } else if (this.props.paramOverview.class==='FloatParameter') {
        if (this.props.paramOverview.unitstr) {
          inlineValueContent = <span style={{verticalAlign: "super"}}>
                                  <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times"/>
                                  <span><Input type='floatunits' origValue={this.props.paramOverview.valuestr+" "+this.props.paramOverview.unitstr} onChange={this.updateUserValue}/></span>
                                  <span onClick={this.submitSetValue} className="btn fa-fw fas fa-check"/>
                               </span>
        } else {
          inlineValueContent = <span style={{verticalAlign: "super"}}>
                                  <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times"/>
                                  <span><Input type='float' origValue={this.props.paramOverview.valuestr} onChange={this.updateUserValue}/></span>
                                  <span onClick={this.submitSetValue} className="btn fa-fw fas fa-check"/>
                               </span>
        }
      } else {
        inlineValueContent = <span style={{verticalAlign: "super"}}>
                                <span onClick={this.toggleExpandedValue} className="btn fa-fw fas fa-times"/>
                                <span><Input type='string' origValue={this.props.paramOverview.valuestr} onChange={this.updateUserValue}/></span>
                                <span onClick={this.submitSetValue} className="btn fa-fw fas fa-check"/>
                             </span>
      }
    } else if (!this.state.expandedUnit) {
      color = this.props.paramOverview.readonly ? "slategray" : "black"
      inlineValueContent = <span onClick={this.props.paramOverview.readonly ? null : this.toggleExpandedValue} style={{display: "inline-block", color: color, textAlign: "right", width: "110px", paddingLeft: "5px", whiteSpace: "nowrap", overflowX: "hidden"}}>
                              {this.props.paramOverview.valuestr}
                           </span>
    }

    let inlineUnitContent
    if (this.state.expandedUnit) {
      inlineUnitContent = <span style={{verticalAlign: "super"}}>
                              <span onClick={this.toggleExpandedUnit} className="btn fa-fw fas fa-times"/>
                              <span><Input type='choice' origValue={this.props.paramOverview.unitstr} onChange={this.updateUserUnit} choices={this.state.details.unit_choices}/></span>
                              <span onClick={this.submitSetUnit} className="btn fa-fw fas fa-check"/>
                           </span>
    } else if (!this.state.expandedValue) {
      inlineUnitContent = <span onClick={this.toggleExpandedUnit} style={{display: "inline-block", textAlign: "left", width: "65px", paddingLeft: "5px", whiteSpace: "nowrap", overflowX: "hidden"}}>
                            {this.props.paramOverview.unitstr}
                          </span>
    }

    return (
      <div ref={this.ref} className='phoebe-parameter'>
        <div className='phoebe-parameter-header' style={{minWidth: "250px"}}>
          <Checkbox style={{verticalAlign: "super"}} checked={this.state.pinned} pinnable={this.props.pinnable} onClick={this.togglePinned} checkedTitle="unpin parameter" uncheckedTitle="pin parameter" />

          <span style={{display: "inline-block", marginLeft: "10px", fontWeight: "bold", width: "calc(100% - 210px)", overflowX: "hidden"}} onClick={this.toggleExpandedDetails}>
            <Twig twig={this.props.paramOverview.twig}/>
          </span>

          {inlineValueContent}
          {inlineUnitContent}

        </div>

        {expandedValueContent ?
          <div className='phoebe-parameter-content'>
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
    this.props.PSPanel.setState({activeParameter: this.props.uniqueid})
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
      value: this.props.origValue || ''
    };
    this.refinput = React.createRef();
  }
  onChange = (e) => {
    e.stopPropagation();
    e.preventDefault();
    var value = e.target.value;
    if (this.props.type == 'float') {
      value = value.replace(/[^0-9.-]/g, '');
    } else if (this.props.type == 'floatunits') {
      // allow space and [a-z,A-Z] if units
      value = value.replace(/[^0-9A-Za-z.-\s]/g, '');
    } else if (this.props.type == 'int') {
      value = value.replace(/[^0-9-]/g, '');
    }


    this.setState({value: value});
    if (this.props.onChange) {
      this.props.onChange(value);
    }
  }
  componentDidMount() {
    if (this.refinput.current) {
      this.refinput.current.select();
    }
  }
  render() {
    if (this.props.type==='choice') {
      var choices = this.props.choices || [];
      return (
        <React.Fragment>
          <select style={{marginLeft: "10px", width: "115px", height: "26px"}} value={this.state.value} onChange={this.onChange}>
            {choices.map(choice => <option value={choice}>{choice}</option>)}
          </select>
        </React.Fragment>
      )
    } else {
      return (
        <input ref={this.refinput} type="text" style={{marginLeft: "10px", width: "115px", height: "26px"}} name="value" pattern="[0-9]" title="value" value={this.state.value} onChange={this.onChange}/>
      )
    }
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
      value = e.nativeEvent.srcElement.value
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

    var orderBy = this.props.bundle.queryParams.orderBy || 'context'
    var orderByTags = tags[orderBy+'s'] || []
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
          <select onChange={this.orderByChanged} defaultValue={orderBy}>
              <option value="context">Context</option>
              <option value="kind">Kind</option>
              {/* <option value="constraint">Constraint</option> */}
              <option value="component">Component</option>
              <option value="feature">Feature</option>
              <option value="dataset">Dataset</option>
              <option value="figure">Figure</option>
              <option value="compute">Compute</option>
              <option value="model">Model</option>
              <option value="qualifier">Qualifier</option>
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
        return (<Parameter key={uniqueid} app={this.props.app} bundle={this.props.bundle} PSPanel={this.props.PSPanel} paramOverview={param} uniqueid={uniqueid} pinnable={!this.props.PSPanelOnly} description={param.description}/>)
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
