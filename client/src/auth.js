const Cookie = require("js-cookie");
const app = "wodiki-user";

const Auth = {
  isLoggedIn() {
    const app = Cookie.getJSON(app);
    if (app === null) {
      return false;
    }

    return app.email && app.token;
  },

  passIfLoggedIn: (nextState, replace) => {
    if (Auth.isLoggedIn()) {
      replace({ pathname: "/" });
      Auth.setAppRootClass("");
    } else {
      Auth.setAppRootClass("login");
    }
  },

  requireLogin: (nextState, replace) => {
    if (!Auth.isLoggedIn()) {
      sessionStorage.setItem("redirect_uri", nextState.location.pathname);
      replace({ pathname: "/login" });
      Auth.setAppRootClass("login");
    } else {
      Auth.setAppRootClass("");
    }
  },

  requireAdmin: (nextState, replace) => {
    if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
      replace({ pathname: "/" });
      Auth.setAppRootClass("");
    } else {
      Auth.setAppRootClass("");
    }
  },

  requireSysAdmin: (nextState, replace) => {
    if (!Auth.isLoggedIn() || !Auth.isSysAdmin()) {
      replace({ pathname: "/" });
      Auth.setAppRootClass("");
    } else {
      Auth.setAppRootClass("");
    }
  },

  login: (id, email, is_admin, token) => {
    Cookie.set(
      app,
      {
        id,
        email,
        is_admin,
        token
      },
      { expires: 7 }
    );
  },

  logout: () => {
    Cookie.remove(app);
  },

  getToken() {
    const user = Cookie.getJSON(app);
    if (user === null) {
      return {};
    }
    return user.token;
  },

  getEmail() {
    const user = Cookie.getJSON(app);
    if (user === null) {
      return {};
    }
    return user.email;
  },

  getId() {
    const user = Cookie.getJSON(app);
    if (user === null) {
      return {};
    }
    return user.id;
  },

  tokenHeader() {
    return ["Authorization", `Bearer ${this.getToken()}`];
  }
};

export default Auth;
