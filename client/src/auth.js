const app = "wodiki-user";

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

  login: (id, email, is_admin, token) => {
    localStorage[app] = JSON.stringify({
      id,
      email,
      is_admin,
      token
    });
  },

  logout: () => {
    localStorage.removeItem(app);
  },

  getToken() {
    const user = localStorage.getItem(app);
    if (user === null) {
      return {};
    }
    return JSON.parse(user).token;
  },

  getEmail() {
    const user = localStorage.getItem(app);
    if (user === null) {
      return {};
    }
    return JSON.parse(user).email;
  },

  getId() {
    const user = localStorage.getItem(app);
    if (user === null) {
      return {};
    }
    return JSON.parse(user).id;
  },

  tokenHeader() {
    return ["Authorization", `Bearer ${this.getToken()}`];
  }
};

export default Auth;
