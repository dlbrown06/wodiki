const app = "wodiki";

const Auth = {
  isLoggedIn() {
    const app = localStorage.getItem(app);
    if (app === null) {
      return false;
    }

    const appObj = JSON.parse(app);
    return appObj.email && appObj.token;
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

  login: (email, token) => {
    localStorage[app] = JSON.stringify({
      email,
      token
    });
  },

  logout: () => {
    localStorage.removeItem(app);
  },

  getToken() {
    const app = localStorage.getItem(app);
    if (app === null) {
      return {};
    }
    return JSON.parse(app).token;
  },

  getUsername() {
    const app = localStorage.getItem(app);
    if (app === null) {
      return {};
    }

    return JSON.parse(app).user.username;
  },

  getUserFullName() {
    const app = localStorage.getItem(app);
    if (app === null) {
      return {};
    }

    const user = JSON.parse(app).user;

    return `${user.first_name} ${user.last_name}`;
  },

  getUser() {
    const app = localStorage.getItem(app);
    if (app === null) {
      return {};
    }

    return JSON.parse(app).user;
  },

  tokenHeader() {
    return ["Authorization", `Bearer ${this.getToken()}`];
  }
};

export default Auth;
