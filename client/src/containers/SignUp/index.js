import React, { Component } from "react";
import { Card } from "reactstrap";
import request from "superagent";
import httpStatus from "http-status-codes";

import FormSignUp from "../../components/_Forms/SignUp";

class SignUp extends Component {
  constructor() {
    super();

    this.state = {
      signupError: undefined,
      disableForm: false
    };
  }

  onSubmit = async (email, password) => {
    this.setState({ disableForm: true, signupError: null });

    try {
      const rsp = await request
        .post("/api/athletes/signup")
        .send({ email, password });

      if (rsp.status === httpStatus.OK) {
        this.setState({ loginError: `Woot: ${rsp.body.message}` });
      } else {
        this.setState({ loginError: rsp.body.message });
      }
    } catch (err) {
      console.log(err);
      this.setState({ signupError: "Unable to Create New Athlete" });
    }

    this.setState({ disableForm: false });
  };

  render() {
    const { signupError, disableForm } = this.state;

    return (
      <Card body className={this.props.className}>
        <FormSignUp
          onSubmit={this.onSubmit}
          error={signupError}
          disable={disableForm}
        />
      </Card>
    );
  }
}

export default SignUp;
