const cookieJar = {}; // Shared Cookie Storage

module.exports = {
    getCookie: function (accessId) {
        return cookieJar[accessId];
    },
    setCookie: function (accessId, cookie) {
        cookieJar[accessId] = cookie;
    }
};
