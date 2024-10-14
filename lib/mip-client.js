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
        const endpoint = new URL(`${config.servicetype}/${config.service}`, config.url);

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
        node.status({
            fill: 'blue',
            shape: 'dot',
            text: requestOptions.auth ? 'Requesting with credentials' : 'Requesting with cookie'
        });
        try {
            const response = await axios(requestOptions);
            node.status({ fill: 'green', shape: 'dot', text: `${response.statusText} ${response.status}` });
            return response;
        } catch (error) {
            if (error.response) {
                // Der Request wurde ausgeführt und der Server hat eine Antwort gegeben
                const status = error.response.status;
                const statusText = error.response.statusText;
                const message = error.response.data[0].message || 'Unknown error';

                node.status({ fill: 'red', shape: 'dot', text: `${statusText} ${status}` });

                return { message, status, statusText };
            } else {
                // Fehler, der nicht durch den Server zurückgegeben wurde
                const message = error.message;

                node.status({ fill: 'red', shape: 'dot', text: message });
                return message;
            }
        }
    },

    // Response Handling
    handleResponse: function (response, format, servicetype, accessId) {
        let data = response.data;
        if (format != 'original' && servicetype == 'data') {
            data = responseHandler.formatData(response.data, format == 'modified');
        }

        this.updateSessionCookie(response.headers, accessId); // Update the session cookie

        return {
            data,
            status: response.status,
            statusText: response.statusText
        };
    }
};
