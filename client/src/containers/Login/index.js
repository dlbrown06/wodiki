import React, { Component } from "react";
import { Card } from "reactstrap";
import request from "superagent";
import httpStatus from "http-status-codes";

import auth from "../../auth";
import history from "../../history";
import LoginForm from "../../components/_Forms/Login";

import "./style.css";

class Login extends Component {
  constructor() {
    super();

    this.state = {
      loginError: undefined,
      disableForm: false
    };
  }

  onSubmit = async (email, password) => {
    this.setState({ disableForm: true, loginError: null });

    try {
      const rsp = await request
        .post("/api/athletes/login")
        .send({ email, password });

      if (rsp.status === httpStatus.OK) {
        auth.login(email, rsp.body.is_admin, rsp.body.token);
        return history.push("/athletes");
      } else {
        this.setState({ loginError: rsp.body.message });
      }
    } catch (err) {
      console.log(err);
      this.setState({ loginError: "Invalid Email / Password" });
    }

    this.setState({ disableForm: false });
  };

  render() {
    const { loginError, disableForm } = this.state;

    return (
      <Card body>
        <LoginForm
          onSubmit={this.onSubmit}
          error={loginError}
          disable={disableForm}
        />
      </Card>
    );
  }
}

export default Login;
