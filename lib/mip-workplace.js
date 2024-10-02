module.exports = function (RED) {
    function setWorkplaceState(config){
        RED.nodes.createNode(this, config);

        let node = this;

        node.on('input', async function (msg) {
            const axios = require('axios');
            const https = require('https');
            const responseHandler = require('./responseHandler.js');
            const bodyCreator = require('./bodyCreator.js'); // Testing
            //const mipClient = require('./mip-client.js');

            node.name = config.name || 'HX'; // für was??
            const service = "" //workplace status""
            const method = 'POST';
            const servicetype = data; //meta oder data

            //Input parameters
            const server = RED.nodes.getNode(config.server);
            const url = server.url;
            const user = server.user;
            const password = server.password;
            const accessId = server.accessId;
            const sslVerify = server.sslVerify == 'true';

            const agent = new https.Agent({ rejectUnauthorized: sslVerify });
            const endpoint = new URL(servicetype + '/' + service, url);


            let requestBody = bodyCreator.workplaceBody(msg.payload);


            const optionsCookie = {
                method: method,
                url: endpoint.href,
                headers: {
                    'Cookie': cookieJar[accessId],
                    'Content-Type': 'application/json'
                },
                data: requestBody,
                httpsAgent: agent
            };

            const optionsAuth = {
                auth: {
                    username: user,
                    password: password
                },
                headers: {
                    'X-Access-Id': accessId,
                    'Content-Type': 'application/json'
                }
            };

            const options = cookieJar[accessId] ? optionsCookie : { ...optionsCookie, ...optionsAuth };

            try {
                const response = await performRequest(options);
                handleResponse(response, msg);
            } catch (error) {
                await handleRetry(error, optionsCookie, optionsAuth, msg);
            }


            async function performRequest(requestOptions) {
                let info = requestOptions.auth ? 'Requesting with credentials' : 'Requesting with cookie';
                node.status({ fill: 'blue', shape: 'dot', text: info });
                return await axios(requestOptions);
            }

            function handleResponse(response, msg) {

                if (format == 'modified' && servicetype == 'data') {
                    msg.payload = responseHandler.formatData(response.data)
                } else {
                    msg.payload = response.data

                }

                msg.request = response.request._header;
                const setCookieHeader = response.headers['set-cookie'];
                if (setCookieHeader) {
                    const sessionCookie = setCookieHeader.find(cookie => cookie.startsWith('JSESSIONID'));
                    if (sessionCookie) {
                        cookieJar[accessId] = sessionCookie.split(';')[0];
                    }
                }
                node.status({ fill: 'green', shape: 'dot', text: 'Success, HTTP ' + response.status });
                node.send(msg);
            }

            async function handleRetry(error, optionsCookie, optionsAuth, msg) {
                if (error.response && error.response.status === 401) {
                    node.warn('Retry with Auth');
                    try {
                        const response = await performRequest({ ...optionsCookie, ...optionsAuth });
                        handleResponse(response, msg);
                    } catch (retryError) {
                        node.status({ fill: 'red', shape: 'dot', text: 'Fail HTTP:' + retryError.status });
                        node.error(retryError.message, msg);
                        node.send(retryError);
                    }
                } else {
                    node.status({ fill: 'red', shape: 'dot', text: 'Fail' });
                    node.error(error.message, msg);
                    node.send(error);
                }
            }
        });

    }

    RED.nodes.registerType('mip workplace', setWorkplaceState);

};
