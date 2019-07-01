import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

// import ReactQueryParams from 'react-query-params'; // https://github.com/jeff3dx/react-query-params

import {Link, generatePath} from './common';
import {Panel} from './ui';

class TagHeaderButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null
    }
  }
  componentDidUpdate() {
    if (this.state.redirect) {
      this.setState({redirect: null})
    }
  }
  followLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundleid, this.props.to, this.props.bundle.getSearchString())});
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }
    return (
      <a title={this.props.to} onClick={this.followLink} style={{width: "8px", padding: "2px", marginLeft: "8px"}}>
        <span className={this.props.iconClassNames}/>
      </a>
    )
  }
}

class TagClearFilterButton extends Component{
  constructor(props) {
    super(props);
    this.state = {
      hover: false
    }
  }
  onClear = () => {
    if (this.props.group) {
      this.props.bundle.setQueryParams({[this.props.group]: []})
    } else {
      // var currentthis.props.currentGroupFilter
      Object.keys(this.props.bundle.queryParams).forEach(group => {
        if (["pinned", "orderBy", "advanced"].indexOf(group) === -1) {
          this.props.bundle.setQueryParams({[group]: []})
        }
      })
    }
  }
  render() {
    var showButton = false;
    if (this.props.group) {
      if (this.props.bundle.queryParams[this.props.group] && this.props.bundle.queryParams[this.props.group].length > 0) {
        showButton = true;
      }
    } else {
      Object.keys(this.props.bundle.queryParams).forEach(group => {
        if (["pinned", "advanced", "orderBy"].indexOf(group)===-1 && this.props.bundle.queryParams[group].length > 0) {
          showButton = true;
        }
      })

    }

    if (this.props.bundle.state.paramsfilteredids.length === 0) {
      showButton = false;
    }

    var title = "reset filter"

    if (this.props.group==='pinned') {
      title = "clear pinned parameters"
    } else if (this.props.group) {
      title = "clear "+this.props.group+" filter"
    }

    var padding = this.props.padding || "6px"

    return (
      <div style={{width: "100%", padding: padding, textAlign: "center"}}>
        {showButton ?
          <span style={{width: "50%", maxWidth: "300px", minWidth: "100px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClear} onMouseEnter={()=>this.setState({hover:true})} onMouseLeave={()=>this.setState({hover:false})}>{title}</span>
          :
          null
        }
      </div>
    )
  }
}

class TagOnlyPinnedButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: false,
    }
  }
  addToFilter = () => {
    var currentAdvanced = this.props.bundle.queryParams.advanced || []
    var newAdvanced = currentAdvanced.concat("onlyPinned")
    this.props.bundle.setQueryParams({advanced: newAdvanced})
  }
  removeFromFilter = () => {
    let newAdvanced;
    var currentAdvanced = this.props.bundle.queryParams.advanced || []
    if (this.props.bundle.queryParams.length===1) {
      newAdvanced = [ ];
    } else {
      newAdvanced = currentAdvanced.filter(v => v !== "onlyPinned")
    }
    this.props.bundle.setQueryParams({advanced: newAdvanced})
  }
  onClick = () => {
    if (this.state.selected) {
      this.setState({selected: false})
      this.removeFromFilter();
    } else {
      this.setState({selected: true})
      this.addToFilter()
    }
  }
  componentDidMount() {
    this.componentDidUpdate();
  }
  componentDidUpdate() {
    var advanced = this.props.bundle.queryParams.advanced || []
    var selected = advanced.indexOf("onlyPinned")!==-1
    if (selected !== this.state.selected) {
      this.setState({selected: selected})
    }
  }
  render() {
    let title
    if (this.state.selected) {
      title = "include non-pinned parameters"

    } else {
      title = "show only pinned parameters"

    }

    return (
      <div style={{width: "100%", padding: "2px", textAlign: "center"}}>
        <span style={{width: "50%", maxWidth: "300px", minWidth: "100px"}} className="btn btn-tag btn-tag-clear" onClick={this.onClick}>{title}</span>
      </div>

    )
  }
}

export class Tag extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentGroupFilter: [],
      hover: false,
      selected: false,
      isAvailable: true,
    }
  }
  addToFilter = () => {
    var newGroupFilter = this.state.currentGroupFilter.concat(this.props.tag)
    this.props.bundle.setQueryParams({[this.props.group]: newGroupFilter})
  }
  removeFromFilter = () => {
    let newGroupFilter;
    if (this.state.currentGroupFilter.length===1) {
      newGroupFilter = [ ];
    } else {
      newGroupFilter = this.state.currentGroupFilter.filter(tag => tag !== this.props.tag)
    }
    this.props.bundle.setQueryParams({[this.props.group]: newGroupFilter})
  }
  onClick = () => {
    if (this.state.selected) {
      this.setState({selected: false})
      this.removeFromFilter();
    } else {
      this.setState({selected: true})
      this.addToFilter()
    }
  }
  isAvailable = () => {
    if (!this.props.bundle.state.tagsAvailable || !this.props.bundle.state.tagsAvailable[this.props.group+'s']) {
      return true
    }
    return this.props.bundle.state.tagsAvailable[this.props.group+'s'].indexOf(this.props.tag) !== -1
  }
  componentDidUpdate() {

    if (this.props.currentGroupFilter) {
      if (this.props.currentGroupFilter !== this.state.currentGroupFilter) {
        this.setState({currentGroupFilter: this.props.currentGroupFilter})
      }
    } else {
      var currentGroupFilter = this.props.bundle.queryParams[this.props.group.toLowerCase()] || null
      if (currentGroupFilter !== this.state.currentGroupFilter && currentGroupFilter != null) {
        this.setState({currentGroupFilter: currentGroupFilter})
      }
    }


    if (this.state.currentGroupFilter) {
      var selected = this.state.currentGroupFilter.indexOf(this.props.tag)!==-1
      if (selected !== this.state.selected) {
        this.setState({selected: selected})
      }

      var isAvailable = this.isAvailable();

      if (isAvailable !== this.state.isAvailable) {
        this.setState({isAvailable: isAvailable})
      }
    }

  }
  componentDidMount() {
    this.componentDidUpdate()
  }
  render() {
    var className = "btn btn-tag"
    var iconClassName = "fas fa-fw"
    var title = "add to filter"
    var style={}
    if (this.state.selected) {
      className += " btn-tag-selected"
      iconClassName += " fa-times"
      title = "remove from filter"
    } else {
      className += " btn-tag-unselected"
      iconClassName += " fa-plus"
    }

    if (!this.state.isAvailable) {
      className += " btn-tag-unavailable"
    }



    var iconStyle = {}
    if (!this.state.hover) {
      iconStyle.color = 'transparent'
    }

    if (this.props.includeGroup) {
      style.maxWidth = "200px"
    }


    return (
      <span className={className} style={style} title={title} onClick={this.onClick} onMouseEnter={()=>this.setState({hover:true})} onMouseLeave={()=>this.setState({hover:false})}><span style={iconStyle} className={iconClassName}/>
        {this.props.includeGroup ?
          <span>
            {this.props.group}:
          </span>
          :
          null
        }
        {this.props.tag}
      </span>
    )
  }
}

class TagGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      currentGroupFilter: []
      // redirect: null,
    };
  }
  toggleExpanded = () => {
    this.setState({expanded: !this.state.expanded})
  }
  componentDidMount() {
    this.setState({expanded: this.props.expanded})
    this.componentDidUpdate();
  }
  componentDidUpdate() {
    var currentGroupFilter = this.props.bundle.queryParams[this.props.title.toLowerCase()] || []
    if (currentGroupFilter.length !== this.state.currentGroupFilter.length) {
      this.setState({currentGroupFilter: currentGroupFilter})
    }
  }
  render() {
    // if (this.state.redirect) {
    //   return (<Redirect to={this.state.redirect}/>)
    // }

    var group = this.props.title.toLowerCase()
    var tags = this.props.tags || [];
    // var currentGroupFilter = this.props.bundle.queryParams[this.props.group] || []

    return (
      <React.Fragment>
        <div className='phoebe-tag-header' onClick={this.toggleExpanded}>
          {this.props.title}
          <div style={{float: "right"}}>
            {this.props.run && tags.length ?
              <TagHeaderButton app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} to={`run_${group}`} iconClassNames="fas fa-fw fa-play"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.remove && tags.length ?
              <TagHeaderButton app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} to={`remove_${group}`} iconClassNames="fas fa-fw fa-minus"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.rename && tags.length ?
              <TagHeaderButton app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} to={`rename_${group}`} iconClassNames="fas fa-fw fa-pen"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.add ?
              <TagHeaderButton app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} to={`add_${group}`} iconClassNames="fas fa-fw fa-plus"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }

          </div>
        </div>
        {this.state.expanded ?
          <div className='phoebe-tag-drawer'>
            {tags ?
              tags.map(t => <Tag key={t} bundle={this.props.bundle} group={group} currentGroupFilter={this.state.currentGroupFilter} tag={t}/>)
              :
              null
            }
            <TagClearFilterButton bundle={this.props.bundle} group={group}/>

          </div>
          :
          null
        }
      </React.Fragment>
    )
  }
}

class FilterBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
    };
  }
  toggleExpanded = () => {
    this.setState({expanded: !this.state.expanded})
  }
  toggleCheckbox = (advanced, checked) => {
    var currentAdvanced = this.props.bundle.queryParams.advanced || []
    let newAdvanced
    if (checked) {
      newAdvanced = currentAdvanced.concat(advanced)
    } else {
      newAdvanced = currentAdvanced.filter(v => v !== advanced)
    }
    // console.log("toggleCheckbox "+advanced+" "+checked+" "+currentAdvanced+"->"+newAdvanced)
    this.props.bundle.setQueryParams({advanced: newAdvanced})
  }
  toggleIsConstraint = (e) => {
    this.toggleCheckbox("is_constraint", e.currentTarget.checked)
  }
  toggleIsSingle = (e) => {
    this.toggleCheckbox("is_single", e.currentTarget.checked)
  }
  toggleIsDefault = (e) => {
    this.toggleCheckbox("is_default", e.currentTarget.checked)
  }
  toggleNotVisible = (e) => {
    this.toggleCheckbox("not_visible", e.currentTarget.checked)
  }
  toggleIsAdvanced = (e) => {
    this.toggleCheckbox("is_advanced", e.currentTarget.checked)
  }
  render() {
    var pinned = this.props.bundle.queryParams.pinned || []

    var advanced = this.props.bundle.queryParams.advanced || []
    var advancedOnlyPinned = advanced.indexOf("onlyPinned")!==-1

    return (
      <div className="phoebe-parameter" style={{padding: "10px"}}>
        {advancedOnlyPinned ?
          <React.Fragment>
            <span style={{width: "100px", display: "inline=-block"}}>Showing:</span><b>{pinned.length}</b> pinned parameter{pinned.length !==1  && "s"}
              <TagOnlyPinnedButton bundle={this.props.bundle} padding="2px"/>
          </React.Fragment>

          :
          <React.Fragment>
            <span style={{width: "100px", display: "inline-block"}}>Showing:</span><b>{this.props.bundle.state.paramsfilteredids.length}/{this.props.bundle.state.nparams}</b> parameters<br/>
            <TagClearFilterButton bundle={this.props.bundle} group={false} padding="2px"/>

            <span style={{width: "100px", display: "inline-block"}}>Including:</span>{pinned.length} pinned parameter{pinned.length !== 1 && "s"}
            {pinned.length > 0 && <TagOnlyPinnedButton bundle={this.props.bundle} padding="2px"/>}
            <TagClearFilterButton bundle={this.props.bundle} group="pinned" padding="2px"/>

            <span style={{width: "100px", display: "inline-block"}}>Excluding:</span>{this.props.bundle.state.nAdvancedHiddenTotal} advanced parameters<span style={{float: "right", color: "#2B71B1", cursor: "pointer"}} onClick={this.toggleExpanded}>{this.state.expanded ? "hide options" : "show options"}</span>
            {this.state.expanded ?
              <React.Fragment>
                <br/>
                <input type="checkbox" checked={advanced.indexOf("is_constraint")!==-1} onChange={this.toggleIsConstraint}/> show constraints ({this.props.bundle.state.nAdvancedHiddenEach.is_constraint || 0})<br/>
                <input type="checkbox" checked={advanced.indexOf("is_single")!==-1} onChange={this.toggleIsSingle}/> show parameters with a single option ({this.props.bundle.state.nAdvancedHiddenEach.is_single || 0})<br/>
                <input type="checkbox" checked={advanced.indexOf("is_default")!==-1} onChange={this.toggleIsDefault}/> show parameters tagged _default ({this.props.bundle.state.nAdvancedHiddenEach.is_default || 0})<br/>
                <input type="checkbox" checked={advanced.indexOf("not_visible")!==-1} onChange={this.toggleNotVisible}/> show irrelevant parameters ({this.props.bundle.state.nAdvancedHiddenEach.not_visible || 0})<br/>
                <input type="checkbox" checked={advanced.indexOf("is_advanced")!==-1} onChange={this.toggleIsAdvanced}/> show advanced parameters ({this.props.bundle.state.nAdvancedHiddenEach.is_advanced || 0})<br/>
              </React.Fragment>
              :
              null
            }
          </React.Fragment>

        }



      </div>
    )
  }
}

export class TagPanel extends Component {
  render() {
    var tags = this.props.bundle.state.tags || {}

    return (
      <Panel inactive={this.props.inactive}>
        <FilterBox bundle={this.props.bundle}/>

        <TagGroup title="Context" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} expanded={true} tags={tags.contexts || null}/>
        <TagGroup title="Kind" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.kinds || null}></TagGroup>
        {/* <TagGroup title="Constraint" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.constraints || null}></TagGroup> */}
        <TagGroup title="Component" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.components || null} add={true} rename={true} remove={true}></TagGroup>
        <TagGroup title="Feature" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.features || null} add={true} rename={true} remove={true}></TagGroup>
        <TagGroup title="Dataset" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.datasets || null} add={true} rename={true} remove={true}></TagGroup>
        <TagGroup title="Figure" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.figures || null} add={true} rename={true} remove={true}></TagGroup>
        <TagGroup title="Compute" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.computes || null} add={true} rename={true} remove={true} run={true}></TagGroup>
        <TagGroup title="Model" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.models || null} add={false} rename={true} remove={true}></TagGroup>
        <TagGroup title="Qualifier" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.qualifiers || null} expanded={true}></TagGroup>

      </Panel>
    )
  }
}
