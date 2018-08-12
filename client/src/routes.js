// src/routes.js
import React from "react";
import { Router, Route, Switch } from "react-router";
import history from "./history";
import auth from "./auth";

import App from "./containers/App";
import Home from "./containers/Home";
import Athletes from "./containers/Athletes";

import NotFound from "./components/NotFound";

const Routes = props => (
  <Router {...props} history={history}>
    <App>
      <Switch>
        <Route exact path="/" component={Home} onEnter={auth.passIfLoggedIn} />
        <Route exact path="/athletes" component={Athletes} />
        <Route path="*" component={NotFound} />
      </Switch>
    </App>
  </Router>
);

export default Routes;
