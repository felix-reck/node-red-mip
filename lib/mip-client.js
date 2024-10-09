const cookieJar = {}; // Shared Cookie Storage
const axios = require('axios');
const https = require('https');
const responseHandler = require('./response-handler.js');

module.exports = {
    // Cookie Management
    getCookie: function (accessId) {
        return cookieJar[accessId];
    },
    setCookie: function (accessId, cookie) {
        cookieJar[accessId] = cookie;
    },
    updateSessionCookie: function (responseHeaders, accessId) {
        const setCookieHeader = responseHeaders['set-cookie'];
        if (setCookieHeader) {
            const sessionCookie = setCookieHeader.find(cookie => cookie.startsWith('JSESSIONID'));
            if (sessionCookie) {
                this.setCookie(accessId, sessionCookie.split(';')[0]);
            }
        }
    },

    // Helper Functions
    createOptions: function (config, requestBody) {
        const agent = new https.Agent({ rejectUnauthorized: config.sslVerify === 'true' });
        const endpoint = new URL(config.servicetype + '/' + config.service, config.url);

        endpoint.port = endpoint.port || 8080; //use default port if not specified

        const optionsBase = {
            method: config.method,
            url: endpoint.href,
            data: requestBody,
            httpsAgent: agent
        }

        const optionsCookie = {
            headers: {
                'Cookie': this.getCookie(config.accessId),
                'Content-Type': 'application/json'
            }
        };

        const optionsAuth = {
            auth: {
                username: config.user,
                password: config.password
            },
            headers: {
                'X-Access-Id': config.accessId,
                'Content-Type': 'application/json'
            }
        };
        return { optionsCookie: { ...optionsBase, ...optionsCookie }, optionsAuth: { ...optionsBase, ...optionsAuth } };
    },

    performRequest: async function (node, requestOptions) {
        let info = requestOptions.auth ? 'Requesting with credentials' : 'Requesting with cookie';
        node.status({ fill: 'blue', shape: 'dot', text: info });
        try {
            return await axios(requestOptions);
        } catch (error) {
            if (error.response) {
                // Der Request wurde ausgeführt und der Server hat eine Antwort gegeben
                const status = error.response.status;
                const errorMessage = `Error: Received ${status} - ${error.response.statusText}`;
                //node.error(errorMessage, { payload: error.response.data });
                return { success: false, status, errorMessage }; // Rückgabe eines Fehlerobjekts
            } else {
                // Fehler, der nicht durch den Server zurückgegeben wurde
                //node.error(`Error: ${error.message}`, { payload: error.message });
                return { success: false, errorMessage: error.message }; // Rückgabe eines Fehlerobjekts
            }
        }
    },

    // Response Handling
    handleResponse: function (response, format, servicetype, accessId) {
        let payload;
        if (format === 'modified' && servicetype === 'data') {
            payload = responseHandler.formatData(response.data);
        } else {
            payload = response.data;
        }

        this.updateSessionCookie(response.headers, accessId); // Update the session cookie

        return {
            payload,
            request: response.request._header,
            status: response.status
        };
    }
};
