import React, { Component } from "react";
import { Container } from "reactstrap";

import "./style.css";

class App extends Component {
  render() {
    return (
      <Container className="App" fluid>
        {React.cloneElement(this.props.children, this.props)}
      </Container>
    );
  }
}

export default App;
