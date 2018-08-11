// src/routes.js
import React from "react";
import { Router, Route, Switch } from "react-router";
import { BrowserRouter } from "react-router-dom";

import App from "./containers/App";
import Home from "./containers/Home";

import NotFound from "./components/NotFound";

const Routes = props => (
  <BrowserRouter {...props}>
    <App>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="*" component={NotFound} />
      </Switch>
    </App>
  </BrowserRouter>
);

export default Routes;
