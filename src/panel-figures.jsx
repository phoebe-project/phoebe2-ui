import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {Link, generatePath} from './common';
import {Tour} from './tour';
import {Panel} from './ui';

export class FigurePanel extends Component {

  render() {
    return (
      <Panel inactive={this.props.inactive}>
        <Tour app={this.props.app} bundle={this.props.bundle} bundleid={this.props.bundleid}/>
      </Panel>
    )
  }
}
