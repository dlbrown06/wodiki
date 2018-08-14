import React, { Component } from "react";
import PropTypes from "prop-types";
import { Form, FormGroup, Label, Input, Button, Alert } from "reactstrap";

import PasswordComplexityProgress from "../../PasswordComplexityProgress";

class FormRegister extends Component {
  constructor() {
    super();

    this.state = {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      gender: "Private",
      birthday: "",
      genderOptions: ["Private", "Male", "Female"],
      formValidationError: ""
    };
  }

  onInputChange = (name, value) => {
    const state = this.state;
    state[name] = value;
    this.setState(state);
  };

  onSubmit = async () => {
    const { onSubmit, disable } = this.props;
    const {
      email,
      password,
      firstName,
      lastName,
      gender,
      birthday,
      genderOptions
    } = this.state;

    if (disable) return;

    const validateEmail = email => {
      const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(String(email).toLowerCase());
    };

    /**
     * Validate the Form Inputs
     */

    if (!validateEmail(email)) {
      return this.setState({ formValidationError: "Invalid Email Provided" });
    }

    if (password.length < 6) {
      return this.setState({
        formValidationError: "Password must be at least 6 characters"
      });
    }

    if (genderOptions.indexOf(gender) === -1) {
      return this.setState({ formValidationError: "Invalid Gender Selection" });
    }

    if (birthday.length > 0 && new Date(birthday) === "Invalid Date") {
      return this.setState({ formValidationError: "Invalid Gender Selection" });
    }

    onSubmit({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      gender,
      birthday
    });
  };

  render() {
    const { error, disable } = this.props;
    const {
      email,
      password,
      firstName,
      lastName,
      gender,
      birthday,
      genderOptions,
      formValidationError
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

        <FormGroup>
          <PasswordComplexityProgress password={password} />
        </FormGroup>

        <hr />

        <FormGroup>
          <Label for="firstName">First Name</Label>
          <Input
            type="text"
            placeholder="Enter First Name"
            value={firstName}
            onChange={e => this.onInputChange("firstName", e.target.value)}
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

        {formValidationError.length > 0 ? (
          <Alert color="danger">{formValidationError}</Alert>
        ) : (
          error && <Alert color="danger">{error}</Alert>
        )}

        <Button
          block
          color="primary"
          disabled={disable || email.length < 5 || password.length < 6}
          onClick={() => this.onSubmit()}
        >
          Sign Up
        </Button>
      </Form>
    );
  }
}

FormRegister.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  error: PropTypes.string,
  disable: PropTypes.bool
};

FormRegister.defaultProps = {
  error: undefined,
  disable: false
};

export default FormRegister;
