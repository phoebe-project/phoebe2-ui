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

function processLink(link) {
  if (link.startsWith("http") || link.startsWith("ftp")) {
    return link
  }

  if (link.startsWith("#")) {
    link = link
  } else {
    if (!link.startsWith("/")) {
      link = "/" + link
    }
    if (!link.startsWith(process.env.PUBLIC_URL)) {
      link = process.env.PUBLIC_URL + link
    }
  }
  return link
}

export function mapObject(object, callback) {
  return Object.keys(object).map(function (key) {
    return callback(key, object[key]);
  });
}

export class Link extends Component {
  render() {
    var to = this.props.to
    if (!to) {
      return (
        <a {...this.props}>{this.props.children}</a>
      )
    }
    return (
      <RouterLink {...this.props}>{this.props.children}</RouterLink>
    )
  }
}

export class Image extends Component {
  render() {
    var src = processLink(this.props.src)
    return (
      <img {...this.props} src={src}/>
    )
  }
}
