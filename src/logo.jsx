import React, { Component } from 'react';

import './logo.css';

export class LogoSpinner extends Component {
  render() {
    return(
      <LogoSplash {...this.props} className="PhoebeLogoSpinner" animationEffect="animateSpinner"/>
    )
  }
}

export class LogoSplash extends Component {
  constructor(props) {
    super(props);
    this.didClearTransitionIn = false;
    this.phoebelogo = React.createRef();
    this.plt1 = React.createRef();
    this.plt2 = React.createRef();
    this.plt3 = React.createRef();
    this.plt4 = React.createRef();
    this.plt5 = React.createRef();
    this.plt6 = React.createRef();
    this.plt7 = React.createRef();
    this.plt8 = React.createRef();
    this.pltb1 = React.createRef();
    this.pltb2 = React.createRef();
    this.pltb3 = React.createRef();
    this.pltb4 = React.createRef();
    this.pltb5 = React.createRef();
    this.pltb6 = React.createRef();
    this.pltb7 = React.createRef();
    this.pltt1 = React.createRef();
    this.pltt2 = React.createRef();
    this.pltt3 = React.createRef();
    this.pltt4 = React.createRef();
  }
  clearTransitionIn = () => {
    if (this.didClearTransitionIn===false) {
      this.phoebelogo.current.classList.remove(this.props.transitionIn || "transitionInNone");
      this.didClearTransitionIn = true;
    }
  }
  disableAnimation = () => {
    if (this.props.animationEffect) {
      this.phoebelogo.current.classList.remove(this.props.animationEffect);
    }
  }
  enableAnimation = () => {
    if (this.props.animationEffect) {
      this.phoebelogo.current.classList.add(this.props.animationEffect);
    }
  }
  showSingle = () => {
    this.clearTransitionIn();
    this.clearTemporary();
    this.disableAnimation();

    this.plt8.current.classList.add('tmphide');
    this.plt7.current.classList.add('tmphide');
  }
  showDetached = () => {
    this.clearTransitionIn();
    this.clearTemporary();
    this.disableAnimation();

    this.plt8.current.classList.add('tmphide');
    this.plt7.current.classList.add('tmphide');
    // this.pltb1.current.classList.add('tmpshow');
    this.pltb2.current.classList.add('tmpshow');
    this.pltb3.current.classList.add('tmpshow');
    this.pltb4.current.classList.add('tmpshow');
    this.pltb5.current.classList.add('tmpshow');
    this.pltb6.current.classList.add('tmpshow');
    this.pltb7.current.classList.add('tmpshow');
  }
  showSemidetachedPrimary = () => {
    this.showDetached();
    this.plt7.current.classList.remove('tmphide');
  }
  showSemidetachedSecondary = () => {
    this.showDetached();
    this.pltb1.current.classList.add('tmpshow');
  }
  showContact = () => {
    this.showDetached();
    this.pltb1.current.classList.add('tmpshow');
    this.plt7.current.classList.remove('tmphide');
  }
  showTriple21Detached = () => {
    this.showDetached();

    this.pltt2.current.classList.add('tmpshow');
  }
  showTriple21Contact = () => {
    this.showContact();

    this.pltt2.current.classList.add('tmpshow');
  }
  showTriple12Detached = () => {
    this.showSingle();

    this.pltt3.current.classList.add('tmpshow');
    this.pltt4.current.classList.add('tmpshow');
  }
  showTriple12Contact = () => {
    this.showSingle();

    this.pltt1.current.classList.add('tmpshow');
    this.pltt2.current.classList.add('tmpshow');
  }
  clearTemporary = () => {
    HTMLCollection.prototype[Symbol.iterator] = Array.prototype[Symbol.iterator];
    for (var element of this.phoebelogo.current.children) {
      element.classList.remove('tmphide', 'tmpshow');
    }
    this.enableAnimation();
  }
  render() {
    // onMouseEnter: null (default), showSingle, showDetached, showContact, ...
    // transitionIn: null/"transitionInNone" (default), "transitionInContact"
    // animationEffect: null (default), "animateSpinner", "animateShimmer"
    // className: null (default), string of any other classes to add to the entire div
    // pltStyle: {} (default), dictionary to pass to css style of EACH triangle (i.e. to change color)

    var transitionIn = this.props.transitionIn || "transitionInNone"
    var animationEffect = this.props.animationEffect || ""
    var additionalClasses = this.props.className || ""

    var divClasses = "PhoebeLogo"+" "+transitionIn+" "+animationEffect+" "+additionalClasses
    var pltStyle = this.props.pltStyle || {}

    return(
      <div className={divClasses} ref={this.phoebelogo} onMouseEnter={this.props.onMouseEnter || null} onMouseLeave={this.clearTemporary}>
        <div className='PLT PLT1' style={pltStyle} ref={this.plt1}/>
        <div className='PLT PLT2' style={pltStyle} ref={this.plt2}/>
        <div className='PLT PLT3' style={pltStyle} ref={this.plt3}/>
        <div className='PLT PLT4' style={pltStyle} ref={this.plt4}/>
        <div className='PLT PLT5' style={pltStyle} ref={this.plt5}/>
        <div className='PLT PLT6' style={pltStyle} ref={this.plt6}/>
        <div className='PLT PLT7' style={pltStyle} ref={this.plt7}/>
        <div className='PLT PLT8' style={pltStyle} ref={this.plt8}/>
        <div className='PLTB PLTB1' style={pltStyle} ref={this.pltb1}></div>
        <div className='PLTB PLTB2' style={pltStyle} ref={this.pltb2}></div>
        <div className='PLTB PLTB3' style={pltStyle} ref={this.pltb3}></div>
        <div className='PLTB PLTB4' style={pltStyle} ref={this.pltb4}></div>
        <div className='PLTB PLTB5' style={pltStyle} ref={this.pltb5}></div>
        <div className='PLTB PLTB6' style={pltStyle} ref={this.pltb6}></div>
        <div className='PLTB PLTB7' style={pltStyle} ref={this.pltb7}></div>
        <div className='PLTT PLTT1' style={pltStyle} ref={this.pltt1}></div>
        <div className='PLTT PLTT2' style={pltStyle} ref={this.pltt2}></div>
        <div className='PLTT PLTT3' style={pltStyle} ref={this.pltt3}></div>
        <div className='PLTT PLTT4' style={pltStyle} ref={this.pltt4}></div>
      </div>
    )

  }
}
