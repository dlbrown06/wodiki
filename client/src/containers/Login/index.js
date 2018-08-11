import React, { Component } from "react";
import request from "superagent";
import { Card } from "reactstrap";

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

  async componentWillMount() {
    const rsp = await request.get("/api/__health");
    console.log(rsp.text);
  }

  onSubmit = async (email, password) => {
    this.setState({ disableForm: true, loginError: null });
    setTimeout(() => {
      this.setState({ loginError: "Invalid Email / Password Combination" });
      this.setState({ disableForm: false });
    }, 500);
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
