import React, { Component } from "react";
import PropTypes from "prop-types";
import { Col, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";

import "./style.css";

class FormLogin extends Component {
  constructor() {
    super();

    this.state = {
      email: "",
      password: ""
    };
  }

  onEmailChange = e => {
    this.setState({ email: e.target.value });
  };

  onPasswordChange = e => {
    this.setState({ password: e.target.value });
  };

  render() {
    const { error, onSubmit, disable } = this.props;
    const { email, password } = this.state;

    return (
      <Form className="FormLogin">
        <FormGroup row>
          <Label for="exampleEmail" hidden>
            Email
          </Label>
          <Col>
            <Input
              type="email"
              name="email"
              id="email"
              placeholder="Email"
              value={email}
              onChange={this.onEmailChange}
              disabled={disable}
            />
          </Col>
        </FormGroup>
        <FormGroup row>
          <Label for="examplePassword" hidden>
            Password
          </Label>
          <Col>
            <Input
              type="password"
              name="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={this.onPasswordChange}
              disabled={disable}
              onKeyPress={e => e.key === "Enter" && onSubmit(email, password)}
            />
          </Col>
        </FormGroup>
        {error && <Alert color="danger">{error}</Alert>}
        <Button
          block
          disabled={disable}
          onClick={() => onSubmit(email, password)}
        >
          Login
        </Button>
      </Form>
    );
  }
}

FormLogin.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormLogin.defaultProps = {
  error: undefined,
  disable: false
};

export default FormLogin;
