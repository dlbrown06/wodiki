import React, { Component } from "react";
import request from "superagent";

import "./App.css";

class App extends Component {
  async componentWillMount() {
    const rsp = await request.get("/api/__health");
    console.log(rsp.text);
  }

  render() {
    return (
      <div className="App">
        <div className="center-it">
          <div>
            <img
              src="/images/brand/wodiki-crossfit-250.png"
              alt="WODiki Home"
            />
          </div>
          <div className="title">WODiki</div>
          <div className="description">
            Built for Crossfit Athletes and Affiliates Alike
          </div>
          <div className="social">
            <div>Want to know what's coming?</div>
            <div className="ask">
              <a href="https://twitter.com/wodiki1" target="_blank">
                Ask us on Twitter
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
