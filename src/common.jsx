import React, { Component } from 'react';
import {Link as RouterLink} from 'react-router-dom';

// import history from './history'

export function generatePath(serverHost, bundleid, modal, filter) {
  if (!serverHost) {
    return "/"
  } else if (!bundleid) {
    return "/"+serverHost
  } else if (!modal) {
    return "/"+serverHost+"/"+bundleid
  } else if (!filter) {
    return "/"+serverHost+"/"+bundleid+"/"+modal
  } else {
    return "/"+serverHost+"/"+bundleid+"/"+modal+"/"+filter
  }
}

export function mapObject(object, callback) {
  return Object.keys(object).map(function (key) {
    return callback(key, object[key]);
  });
}

export class Link extends Component {
  render() {
    return (
      <RouterLink {...this.props}>{this.props.children}</RouterLink>
    )
  }
}
