import React, { Component } from "react";
import PropTypes from "prop-types";
import { Progress } from "reactstrap";

class PasswordComplexityProgress extends Component {
  render() {
    const { password } = this.props;

    let percent = 0;
    const point = 10;

    if (password.length > 6) {
      percent += point;
    }

    if (password.length > 8) {
      percent += point;
    }

    if (password.length > 10) {
      percent += point + 10;
    }

    if (password.length > 12) {
      percent += point + 10;
    }

    const alphaLower = RegExp("[a-z]+");
    if (alphaLower.test(password)) {
      percent += point;
    }

    const alphaUpper = RegExp("[A-Z]+");
    if (alphaUpper.test(password)) {
      percent += point;
    }

    const numbers = RegExp("[0-9]+");
    if (numbers.test(password)) {
      percent += point;
    }

    const oddChars = RegExp(/[\!\@\#\$\%\^\&\*\(\)\-\+\=\<\>\,\.]+/);
    if (oddChars.test(password)) {
      percent += point;
    }

    return (
      <div>
        <Progress className="PasswordComplexity" value={percent} />
      </div>
    );
  }
}

PasswordComplexityProgress.propTypes = {
  password: PropTypes.string.isRequired
};

PasswordComplexityProgress.defaultProps = {};

export default PasswordComplexityProgress;
