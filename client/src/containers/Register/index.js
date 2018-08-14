import React, { Component } from "react";
import { Card } from "reactstrap";
import request from "superagent";
import httpStatus from "http-status-codes";

import FormRegister from "../../components/_Forms/Register";

class Register extends Component {
  constructor() {
    super();

    this.state = {
      registerError: undefined,
      disableForm: false
    };
  }

  onSubmit = async params => {
    this.setState({ disableForm: true, registerError: null });

    try {
      const rsp = await request.post("/api/athletes/register").send(params);
      if (rsp.status === httpStatus.OK) {
        this.setState({ loginError: `Woot: ${rsp.body.message}` });
      } else {
        this.setState({ loginError: rsp.body.message });
      }
    } catch (err) {
      console.error(err);
      this.setState({
        registerError: `Failure to Register: ${
          err.response ? err.response.body.message : JSON.stringify(err)
        }`
      });
    }

    this.setState({ disableForm: false });
  };

  render() {
    const { registerError, disableForm } = this.state;

    return (
      <Card body className={this.props.className}>
        <FormRegister
          onSubmit={this.onSubmit}
          error={registerError}
          disable={disableForm}
        />
      </Card>
    );
  }
}

export default Register;
