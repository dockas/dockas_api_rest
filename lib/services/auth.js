let AuthCore = require("core/auth");

class AuthSrv {
    static connect() {
        AuthSrv.client = new AuthCore();
    }
}

AuthSrv.types = require("core/auth/types");

module.exports = AuthSrv;