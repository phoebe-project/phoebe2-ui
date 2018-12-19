import React, { Component } from 'react';
import {Redirect} from 'react-router-dom';

import {Link, generatePath} from './common';
import {Panel} from './ui';

export class FigurePanel extends Component {
  render() {
    return (
      <Panel>
        <h1>Figures</h1>
      </Panel>
    )
  }
}
