import React from 'react'
import ReactDOM from 'react-dom'
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from 'react-router-dom'

import './style.css'
import Services from './views/services'
import Products from './views/products'
import Careers from './views/careers'
import Home from './views/home'
import ContactUs from './views/contact-us'
import AboutUs from './views/about-us'
import NotFound from './views/not-found'

const App = () => {
  return (
    <Router>
      <Switch>
        <Route component={Services} exact path="/services" />
        <Route component={Products} exact path="/products" />
        <Route component={Careers} exact path="/careers" />
        <Route component={Home} exact path="/" />
        <Route component={ContactUs} exact path="/contact-us" />
        <Route component={AboutUs} exact path="/about-us" />
        <Route component={NotFound} path="**" />
        <Redirect to="**" />
      </Switch>
    </Router>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
