import React, { Component } from "react";
import { Row } from "reactstrap";

import auth from "../../auth";
import history from "../../history";

import "./style.css";

class Member extends Component {
  constructor() {
    super();

    this.state = {};
  }

  render() {
    return (
      <Row className="Member" noGutters>
        <div className="text-center">
          You are a member... you are awesome...
        </div>
        <div>
          <span
            className="link"
            onClick={() => {
              auth.logout();
              history.push("/");
            }}
          >
            now logout
          </span>
          ...
        </div>
      </Row>
    );
  }
}

export default Member;
