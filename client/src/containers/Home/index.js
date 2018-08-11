import React, { Component } from "react";
import request from "superagent";
import { Row, Card } from "reactstrap";

import Login from "../Login";

import "./style.css";

class Home extends Component {
  constructor() {
    super();

    this.state = {};
  }

  async componentWillMount() {
    const rsp = await request.get("/api/__health");
    console.log(rsp.text);
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
        </div>
      </Row>
    );
  }
}

export default Home;
