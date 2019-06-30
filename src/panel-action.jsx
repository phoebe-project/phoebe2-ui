import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

// import FlipMove from 'react-flip-move'; // https://github.com/joshwcomeau/react-flip-move

import {Link, Twig, generatePath, abortableFetch, mapObject, filterObjectByKeys, popUpWindow} from './common';
// import {LogoSpinner} from './logo';
import {Panel} from './ui';
import {Tag} from './panel-tags';

// import isElectron from 'is-electron'; // https://github.com/cheton/is-electron


class ActionButton extends Component {
  render() {
    return (
      null
    )
  }
}


export class ActionPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      redirect: null,
      actionActive: false,
    };
  }
  closePanel = () => {
    this.setState({redirect: generatePath(this.props.app.state.serverHost, this.props.bundle.state.bundleid, null, this.props.bundle.getSearchString())})
  }
  render() {
    if (this.state.redirect) {
      return (<Redirect to={this.state.redirect}/>)
    }

    var action = this.props.action.split("_")[0];
    var actionIcon = "fas fa-fw "
    if (action == 'add') {
      actionIcon += 'fa-plus'
    } else if (action == 'rename') {
      actionIcon += 'fa-pen'
    } else if (action == 'remove') {
      actionIcon += 'fa-minus'
    } else if (action == 'run') {
      actionIcon += 'fa-play'
    }

    var actionStyle = {margin: '5px'}
    if (!this.state.actionActive) {
      actionStyle.pointerEvents = 'none'
      actionStyle.color = 'gray'
      actionStyle.borderColor = 'gray'
    }

    return (
      <Panel backgroundColor="#e4e4e4">
        <h2>{this.props.action}</h2>

        <div style={{float: "right", margin: "5px"}}>
          <span onClick={this.closePanel} className="btn btn-primary" style={{margin: "5px"}}><span className="fas fa-fw fa-times"></span> cancel</span>
          <span className="btn btn-primary" style={actionStyle}><span className={actionIcon}></span> {this.props.action}</span>
        </div>
      </Panel>
    )
  }
}
