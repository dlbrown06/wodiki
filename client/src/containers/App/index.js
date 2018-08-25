import React, { Component } from "react";
import { Container } from "reactstrap";

import "./style.css";

class App extends Component {
  render() {
    return (
      <Container className="App" fluid>
        <div className="d-none d-sm-block mobile-only-banner">
          Currently WODiki Only Supports Mobile Browsing
        </div>
        {React.cloneElement(this.props.children, this.props)}
      </Container>
    );
  }
}

export default App;
