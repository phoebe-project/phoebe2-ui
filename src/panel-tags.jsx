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
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundleid, this.props.to)});
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

class Tag extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false,
      selected: false,
      isAvailable: true,
    }
  }
  componentDidMount() {
    this.setState({selected: this.props.currentGroupFilter.indexOf(this.props.tag)!==-1})
  }
  addToFilter = () => {
    var newGroupFilter = this.props.currentGroupFilter.concat(this.props.tag)
    this.props.bundle.setQueryParams({[this.props.group]: newGroupFilter})
  }
  removeFromFilter = () => {
    let newGroupFilter;
    if (this.props.currentGroupFilter.length===1) {
      newGroupFilter = [ ];
    } else {
      newGroupFilter = this.props.currentGroupFilter.filter(tag => tag !== this.props.tag)
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
    var isAvailable = this.isAvailable();

    if (isAvailable != this.state.isAvailable) {
      this.setState({isAvailable: isAvailable})
    }
  }
  render() {
    var className = "btn btn-tag"
    var iconClassName = "fas fa-fw"
    if (this.state.selected) {
      className += " btn-tag-selected"
      iconClassName += " fa-times"
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


    return (
      <span className={className} onClick={this.onClick} onMouseEnter={()=>this.setState({hover:true})} onMouseLeave={()=>this.setState({hover:false})}><span style={iconStyle} className={iconClassName}/> {this.props.tag}</span>
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
    var currentGroupFilter = this.props.bundle.queryParams[this.props.group] || []

    return (
      <React.Fragment>
        <div className='phoebe-tag-header' onClick={this.toggleExpanded}>
          {this.props.title}
          <div style={{float: "right"}}>
            {this.props.run ?
              <TagHeaderButton app={this.props.app} bundleid={this.props.bundleid} to={`run_${group}`} iconClassNames="fas fa-fw fa-play"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.remove ?
              <TagHeaderButton app={this.props.app} bundleid={this.props.bundleid} to={`remove_${group}`} iconClassNames="fas fa-fw fa-minus"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.rename ?
              <TagHeaderButton app={this.props.app} bundleid={this.props.bundleid} to={`rename_${group}`} iconClassNames="fas fa-fw fa-pen"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.add ?
              <TagHeaderButton app={this.props.app} bundleid={this.props.bundleid} to={`add_${group}`} iconClassNames="fas fa-fw fa-plus"/>
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
          </div>
          :
          null
        }
      </React.Fragment>
    )
  }
}

export class TagPanel extends Component {
  render() {
    var tags = this.props.bundle.state.tags || {}

    return (
      <Panel>
        <div style={{padding: "10px"}}>
          Showing: {this.props.bundle.state.paramsfilteredids.length}/{this.props.bundle.state.nparams} parameters
        </div>

        <TagGroup title="Context" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} expanded={true} tags={tags.contexts || null}/>
        <TagGroup title="Kind" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.kinds || null}></TagGroup>
        <TagGroup title="Constraint" app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid} tags={tags.constraints || null}></TagGroup>
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
