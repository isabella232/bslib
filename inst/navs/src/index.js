/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { Component, cloneElement, Fragment, Children } from 'react';

// ----------------------------------------------------------------------------
// navs_tab()/navs_pill() logic
// ----------------------------------------------------------------------------
class Navs extends Component {

  constructor(props) {
    super(props);

    this.firstNavValue = this.firstNavValue.bind(this);
    this.addChildProps = this.addChildProps.bind(this);
    this.getContent = this.getContent.bind(this);

    const tabsetId = this.newId();
    const selected = props.selected === undefined ? 
      this.firstNavValue(props.children) :
      props.selected;
    const children = this.addChildProps(props.children, {tabsetId, selected});
    const content = this.getContent(children);

    this.state = {tabsetId, selected, children, content};
  }

  render() {
    const props = this.props;
    const ulClass = `nav nav-${props.type}`;
    const {ulTag, divTag} = _buildTabset(props, this.state, ulClass)
    return <Fragment>
        {ulTag}
        {divTag}
    </Fragment>
  }

  firstNavValue(navs) {
    let x = Array.isArray(navs) ? navs[0] : navs;
    if (x.type.name === 'NavMenu') {
      x = x.props.children[0]
    }
    if (x.type.name !== 'Nav') {
      console.warn("Couldn't find the first nav")
    }
    return x.props.value
  }

  getContent(navs) {
    const result = [];
    Children.forEach(navs, x => {
      if (x.type.name === 'NavMenu') {
        result.push(this.getContent(x.props.children))
      }
      if (x.type.name === 'Nav') {
        const className = `tab-pane ${x.props.selected === x.props.value ? 'active' : ''}`;
        result.push(
          <div id={x.props.id} role='tabpanel' className={className} key={x.props.id}>
            {x.props.children}
          </div>
        );
      }
    })
    return result;
  }

  addChildProps(children, props) {
    var self = this;
    return Children.map(children, (x, idx) => {
      if (typeof x === "string") {
        return props.menu ? _textFilterMenu(x) : _textFilter(x);
      }
      if (x.type.name === 'NavMenu') {
        props.menu = true; // Let <Nav>'s within this component know that they're in a menu
        props.tabsetId = self.newId();
        const children_ = self.addChildProps(x.props.children, props);
        return cloneElement(x, props, children_);
      }
      props.id = `tab-${props.tabsetId}-${idx + 1}`;
      return cloneElement(x, props);
    });
  }

  newId() {
    return Math.floor(1000 + Math.random() * 9000);
  }
}

// ----------------------------------------------------------------------------
// navs_tab_card()/navs_pill_card() logic
// ----------------------------------------------------------------------------
class NavsCard extends Navs {
  render() {
    const props = this.props;
    const ulClass = `nav nav-${props.type} card-header-${props.type}`;
    const {ulTag, divTag} = _buildTabset(props, this.state, ulClass);

    const below = props.placement === "below";

    return <div className="card">
        { below ? null : <div className="card-header"> {ulTag} </div>}
        <div className="card-body"> {divTag} </div>
        { below ? <div className="card-footer"> {ulTag} </div> : null}
    </div>
  }
}

// ----------------------------------------------------------------------------
// navs_pill_list() logic
// ----------------------------------------------------------------------------
class NavsList extends Navs {
  render() {
    const props = this.props;
    const ulClass = `nav nav-pills nav-stacked`;
    const {ulTag, divTag} = _buildTabset(props, this.state, ulClass);
    const widthNav = props.widthNav || 4;
    const widthContent = props.widthContent || 8;
    return <div className="row">
      <div className={`col-sm-${widthNav} ${props.well ? 'well' : ''}`}>
        {ulTag}
      </div>
      <div className={`col-sm-${widthContent}`}>
        {divTag}
      </div>
    </div>
  }
}


// ----------------------------------------------------------------------------
// navs_bar()/page_navbar() logic
// ----------------------------------------------------------------------------
class NavsBar extends Navs {
  render() {
    const props = this.props;

    const collapseId = `#navbar-collapse-${this.newId()}`;
    const collapseBtn =
      <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-bs-toggle="collapse" data-target={collapseId} data-bs-target={collapseId}>
        <span className="sr-only">Toggle navigation</span>
        <span className="icon-bar"></span>
        <span className="icon-bar"></span>
        <span className="icon-bar"></span>
      </button>

    const navbarHeader =
      <div className="navbar-header">
        { props.collapse ? collapseBtn : null }
        <span className="navbar-brand">{props.title}</span>
      </div>

    const {ulTag, divTag} = _buildTabset(props, this.state, 'nav navbar-nav');

    const containerDiv =
      <div className={`container${props.fluid ? '-fluid' : ''}`}>
        {navbarHeader}
        {collapseId ? <div className="collapse navbar-collapse" id={collapseId}>{ulTag}</div> : ulTag}
      </div>;

    const navbarClass = `navbar navbar-default ${props.inverse ? 'navbar-inverse' : ''} ${props.position ? ('navbar-' + props.position) : '' }`;

    // TODO:
    // 1. re-implement https://github.com/rstudio/bslib/blob/d77f5ce61003307e7a6dc3c211e7ac6ee6896582/R/navs-legacy.R#L225
    // 2. auto color contrasting
    return <Fragment>
      <nav className={navbarClass} role="navigation" ref={(el) => el && props.bg && el.style.setProperty("background-color", props.bg, "important")}>
        {containerDiv}
      </nav>
      {divTag}
    </Fragment>
  }
}


//-----------------------------------------------------------------------------
// Rendering logic for different nav items
//-----------------------------------------------------------------------------

function Nav(props) {
  let aClass = props.menu ? 'dropdown-item' : 'nav-link';
  if (props.selected === props.value) {
    aClass += ' active';
  }

  return (
    <li key={props.id} className={props.menu ? '' : 'nav-item'}>
      <a href={'#' + props.id} className={aClass} data-toggle='tab' data-value={props.value} role='tab'>
       {props.title}
      </a>
    </li>
  )
}

function NavSpacer(props) {
  return <div className="bslib-nav-spacer"></div>
}

function NavItem(props) {
  return <li className="form-inline" key={props.id}>{props.children}</li>
}

function NavMenu(props) {
  const vals = props.children.map(function(x) { return x.props.value });
  const active = vals.indexOf(props.selected) > -1;
  const liClass = `dropdown nav-item${active ? ' active' : ''}`
  const ulClass = `dropdown-menu${props.align === "right" ? ' dropdown-menu-right' : ''}`;
  return (
    <li className={liClass} key={props.tabsetId}>
      <a className="dropdown-toggle nav-link" data-toggle="dropdown" data-bs-toggle="dropdown" href="#" role="button" aria-expanded="false">
        {props.title}
      </a>
      <ul className={ulClass} data-tabsetid={props.tabsetId}>
        {props.children}
      </ul>
    </li>
  )
}

//-----------------------------------------------------------------------------
// Utility functions
//-----------------------------------------------------------------------------

function _buildTabset(props, state, ulClass) {
  ulClass += props.id ? ' shiny-tab-input' : ''
  return {
    ulTag: <ul id={props.id} className={ulClass} role='tablist' data-tabsetid={state.tabsetId}>
      {state.children}
    </ul>,
    divTag: <div className='tab-content' data-tabsetid={state.tabsetId}>
      {props.header}
      {state.content}
      {props.footer}
    </div>
  }
}

function _textFilterMenu(x) {
  if (/^-+$/.test(x)) {
    return <div className="dropdown-divider"/>
  } else {
    return <div className="dropdown-header">{x}</div>
  }
}

function _textFilter(x) {
  return <li className="navbar-brand">{x}</li>
}

//-----------------------------------------------------------------------------
// Public API
//-----------------------------------------------------------------------------

export { Navs, NavsCard, NavsBar, NavsList, Nav, NavSpacer, NavItem, NavMenu }
