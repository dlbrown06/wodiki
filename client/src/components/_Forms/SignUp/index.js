import React, { Component } from "react";
import PropTypes from "prop-types";
import { Col, Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";

import "./style.css";
import history from "../../../history";

class FormSignUp extends Component {
  constructor() {
    super();

    this.state = {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      gender: "Private",
      birthday: "",
      genderOptions: ["Private", "Male", "Female"]
    };
  }

  onInputChange = (name, value) => {
    const state = this.state;
    state[name] = value;
    this.setState(state);
  };

  render() {
    const { error, onSubmit, disable } = this.props;
    const {
      email,
      password,
      firstName,
      lastName,
      gender,
      birthday,
      genderOptions
    } = this.state;

    return (
      <Form className="FormSignUp text-left">
        <FormGroup>
          <Label for="email">
            Email <span className="text-danger">*</span>
          </Label>
          <Input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={e => this.onInputChange("email", e.target.value)}
            disabled={disable}
          />
        </FormGroup>
        <FormGroup>
          <Label for="password">
            Password <span className="text-danger">*</span>
          </Label>
          <Input
            type="password"
            placeholder="Enter New Password"
            value={password}
            onChange={e => this.onInputChange("password", e.target.value)}
            disabled={disable}
          />
        </FormGroup>

        <hr />

        <FormGroup>
          <Label for="firstName">First Name</Label>
          <Input
            type="text"
            placeholder="Enter First Name"
            value={firstName}
            onChange={e => this.onInputChange("password", e.target.value)}
            disabled={disable}
          />
        </FormGroup>

        <FormGroup>
          <Label for="lastName">Last Name</Label>
          <Input
            type="text"
            placeholder="Enter Last Name"
            value={lastName}
            onChange={e => this.onInputChange("lastName", e.target.value)}
            disabled={disable}
          />
        </FormGroup>

        <FormGroup>
          <Label for="gender">Gender</Label>
          <Input
            type="select"
            onChange={e => this.onInputChange("gender", e.target.value)}
            disabled={disable}
            value={gender}
          >
            {genderOptions.map((opt, key) => (
              <option key={key}>{opt}</option>
            ))}
          </Input>
        </FormGroup>

        <FormGroup>
          <Label for="birthday">Birthday</Label>
          <Input
            type="date"
            placeholder="Enter Birthday"
            value={birthday}
            onChange={e => this.onInputChange("birthday", e.target.value)}
            disabled={disable}
          />
        </FormGroup>

        {error && <Alert color="danger">{error}</Alert>}
        <Button
          block
          color="primary"
          disabled={disable}
          onClick={() => onSubmit(email, password)}
        >
          Sign Up
        </Button>
      </Form>
    );
  }
}

FormSignUp.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormSignUp.defaultProps = {
  error: undefined,
  disable: false
};

export default FormSignUp;
