import React, { Component } from 'react';
import {Link as RouterLink, Router as RouterRouter, HashRouter as RouterHashRouter} from 'react-router-dom';

import isElectron from 'is-electron'; // https://github.com/cheton/is-electron

// use native browser implementation if it supports aborting, otherwise use polyfill and whatwg-fetch
import 'abortcontroller-polyfill';
import {fetch} from 'whatwg-fetch';
export const abortableFetch = ('signal' in new Request('')) ? window.fetch : fetch

export function isStaticFile() {
  return window.location.pathname.includes('index.html')
}

export function generatePath(serverHost, bundleid, modal, filter) {
  var prefix = ""
  // if (isStaticFile()) {prefix = "#"}
  if (!serverHost) {
    return prefix+"/"
  } else if (!bundleid) {
    return prefix+"/"+serverHost
  } else if (!modal) {
    return prefix+"/"+serverHost+"/"+bundleid
  } else if (!filter) {
    return prefix+"/"+serverHost+"/"+bundleid+"/"+modal
  } else {
    return prefix+"/"+serverHost+"/"+bundleid+"/"+modal+"/"+filter
  }
}

function processLink(link) {
  if (link.startsWith("http") || link.startsWith("ftp")) {
    return link
  }

  if (!link.startsWith("#")) {
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

// export function filterObject(object, callback) {
  // return Object.keys(object).filter(function (key) {
    // return callback(key, object[key]);
  // })
// }

export function filterObjectByKeys (object, keys) {
  return Object.keys(object).reduce((accum, key) => {
    if (keys.includes(key)) {
      return { ...accum, [key]: object[key] }
    } else {
      return accum
    }
  }, {})
}

export class Router extends Component {
  render() {
    if (isStaticFile()) {
      return (
        <RouterHashRouter {...this.props}>{this.props.children}</RouterHashRouter>
      )
    } else {
      return (
        <RouterRouter {...this.props}>{this.props.children}</RouterRouter>
      )
    }

  }
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

export class CancelSpinnerIcon extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hover: false
    }
  }
  onCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (this.props.onCancel) {
      this.props.onCancel(e);
    }
  }
  render() {
    // onCancel

    var classes = "fas fa-fw"
    var style = {display: "inline-block", float: "left", marginTop: "4px", width: "20px", marginRight: "-20px", textAlign: "center", textDecoration: "none"}

    style.pointerEvents = "all"
    if (this.state.hover) {
      classes += " fa-times"
    } else {
      classes += " fa-circle-notch fa-spin"
    }

    return (
      <span {...this.props} style={style} className={classes} onClick={this.onCancel} onMouseEnter={()=>{this.setState({hover:true})}} onMouseLeave={()=>{this.setState({hover:false})}}/>
    )
  }
}
