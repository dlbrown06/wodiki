import React, { Component } from "react";
import qs from "querystring";
import { Alert, Button } from "reactstrap";
import request from "superagent";

import history from "../../history";
import "./style.css";

class VerifyAthlete extends Component {
  constructor() {
    super();

    this.state = {
      verifying: true,
      verificationError: undefined,
      verified: false,
      email: ""
    };
  }

  async componentDidMount() {
    try {
      const { email, token } = qs.parse(this.props.location.search.substr(1));
      this.setState({ verifying: true });
      await request.get("/api/athletes/verify").query({ email, token });

      this.setState(
        {
          verificationError: undefined,
          verified: true,
          verifying: false
        },
        () =>
          setTimeout(() => {
            history.push("/");
          }, 5000)
      );
    } catch (err) {
      console.error(err);
      this.setState({
        verificationError: err.response.body
          ? err.response.body.message
          : err.toString()
      });
    } finally {
      this.setState({ verifying: false });
    }
  }

  render() {
    const { verifying, verified, verificationError } = this.state;

    return (
      <div className="VerifyAthlete">
        <h1>
          {verifying
            ? "Verifying Athlete..."
            : verified
              ? "Athlete Verified!"
              : "Verification Failed"}
        </h1>
        {verificationError && <Alert color="danger">{verificationError}</Alert>}
        {verified && <p>Redirecting back to homepage to login in 5 seconds.</p>}
        <Button color="info" onClick={() => history.push("/")}>
          Go Home
        </Button>
      </div>
    );
  }
}

export default VerifyAthlete;
