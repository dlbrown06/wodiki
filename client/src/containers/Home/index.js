import React, { Component } from "react";
import { Row } from "reactstrap";

import Login from "../Login";
import Register from "../Register";

import "./style.css";

class Home extends Component {
  constructor() {
    super();

    this.state = {};
  }

  render() {
    return (
      <Row className="Home" noGutters>
        <div className="center-it">
          <div>
            <img
              src="/images/brand/wodiki-crossfit-250.png"
              alt="WODiki Home"
            />
          </div>
          <div className="title">WODiki</div>
          <div className="description">
            Built for Crossfit Athletes and Affiliates Alike
          </div>
          <div className="social">
            <div>Want to know what's coming or request an invite?</div>
            <div className="ask">
              <a href="https://twitter.com/wodiki1" target="_blank">
                Ask us on Twitter
              </a>
            </div>
          </div>

          <Login />

          {/*<Register className="m-t-md" />*/}
        </div>
      </Row>
    );
  }
}

export default Home;
