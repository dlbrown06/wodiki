import React, { Component } from "react";
import request from "superagent";
import { Card } from "reactstrap";

import LoginForm from "../../components/_Forms/Login";

import "./style.css";

class Login extends Component {
  constructor() {
    super();

    this.state = {
      loginError: undefined
    };
  }

  async componentWillMount() {
    const rsp = await request.get("/api/__health");
    console.log(rsp.text);
  }

  onSubmit = async (email, password) => {
    this.setState({ loginError: "Invalid Email / Password Combination" });
  };

  render() {
    const { loginError } = this.state;

    return (
      <Card body>
        <LoginForm onSubmit={this.onSubmit} error={loginError} />
      </Card>
    );
  }
}

export default Login;
