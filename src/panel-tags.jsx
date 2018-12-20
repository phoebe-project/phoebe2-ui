import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

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

class TagGroup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expanded: this.props.expanded,
      // redirect: null,
    };
  }
  toggleExpanded = () => {
    this.setState({expanded: !this.state.expanded})
  }
  // componentDidUpdate() {
  //   if (this.state.redirect) {
  //     this.setState({redirect: null})
  //   }
  // }
  render() {
    // if (this.state.redirect) {
    //   return (<Redirect to={this.state.redirect}/>)
    // }

    var tags = this.props.tags || [];

    return (
      <React.Fragment>
        <div className='phoebe-tag-header' onClick={this.toggleExpanded}>
          {this.props.title}
          <div style={{float: "right"}}>
            {this.props.run ?
              <TagHeaderButton app={this.props.app} bundleid={this.props.bundleid} to={`run_${this.props.title.toLowerCase()}`} iconClassNames="fas fa-fw fa-play"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.remove ?
              <TagHeaderButton app={this.props.app} bundleid={this.props.bundleid} to={`remove_${this.props.title.toLowerCase()}`} iconClassNames="fas fa-fw fa-minus"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.rename ?
              <TagHeaderButton app={this.props.app} bundleid={this.props.bundleid} to={`rename_${this.props.title.toLowerCase()}`} iconClassNames="fas fa-fw fa-pen"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }
            {this.props.add ?
              <TagHeaderButton app={this.props.app} bundleid={this.props.bundleid} to={`add_${this.props.title.toLowerCase()}`} iconClassNames="fas fa-fw fa-plus"/>
              :
              <div style={{display: "inline-block", width: "34px"}}>&nbsp;</div>
            }

          </div>
        </div>
        {this.state.expanded ?
          <div className='phoebe-tag-drawer'>
            {tags ?
              tags.map(t => <span className="btn btn-tag" key={t}><span className="fas fa-fw fa-times"/> {t}</span>)
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
          Showing: ???/{this.props.bundle.state.nparams} parameters
        </div>

        <TagGroup title="Context" app={this.props.app} bundleid={this.props.bundleid} expanded={true} tags={tags.contexts || null}/>
        <TagGroup title="Kind" app={this.props.app} bundleid={this.props.bundleid} tags={tags.kinds || null}></TagGroup>
        <TagGroup title="Constraint" app={this.props.app} bundleid={this.props.bundleid} tags={tags.constraints || null}></TagGroup>
        <TagGroup title="Component" app={this.props.app} bundleid={this.props.bundleid} tags={tags.components || null} add={true} rename={true} remove={true}></TagGroup>
        <TagGroup title="Feature" app={this.props.app} bundleid={this.props.bundleid} tags={tags.features || null} add={true} rename={true} remove={true}></TagGroup>
        <TagGroup title="Dataset" app={this.props.app} bundleid={this.props.bundleid} tags={tags.datasets || null} add={true} rename={true} remove={true}></TagGroup>
        <TagGroup title="Figure" app={this.props.app} bundleid={this.props.bundleid} tags={tags.figures || null} add={true} rename={true} remove={true}></TagGroup>
        <TagGroup title="Compute" app={this.props.app} bundleid={this.props.bundleid} tags={tags.computes || null} add={true} rename={true} remove={true} run={true}></TagGroup>
        <TagGroup title="Model" app={this.props.app} bundleid={this.props.bundleid} tags={tags.models || null} add={false} rename={true} remove={true}></TagGroup>
        <TagGroup title="Qualifier" app={this.props.app} bundleid={this.props.bundleid} tags={tags.qualifiers || null} expanded={true}></TagGroup>

      </Panel>
    )
  }
}
