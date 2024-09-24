module.exports = function (RED) {
    function HttpNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;
        let cookieJar = {}; // Cookie Storage

        node.on('input', async function (msg) {
            const axios = require('axios');
            const https = require('https');

            node.name = config.name || 'HX';

            //Input parameters
            const url = config.url || msg.url;
            const user = config.user || msg.user;
            const password = config.password || msg.password;
            const service = config.service || msg.service;
            const method = config.method || msg.method || 'GET';
            const accessId = config.accessId || msg.accessId;
            const sslVerify = config.sslVerify === 'true';


            const agent = new https.Agent({ rejectUnauthorized: sslVerify });

            const endpoint = new URL(service, url);

            const optionsCookie = {
                method: method,
                url: endpoint.href,
                headers: {
                    'Cookie': cookieJar[accessId],
                    "Content-Type": "application/json"
                },
                data: msg.payload,
                httpsAgent: agent
            };

            const optionsAuth = {
                auth: {
                    username: user,
                    password: password
                },
                headers: {
                    'X-Access-Id': accessId,
                    "Content-Type": "application/json"
                }
            };

            const options = cookieJar[accessId] ? optionsCookie : { ...optionsCookie, ...optionsAuth };
            node.warn(options);

            try {
                const response = await performRequest(options);
                handleResponse(response, msg);
            } catch (error) {
                await handleRetry(error, optionsCookie, optionsAuth, msg);
            }


            async function performRequest(requestOptions) {
                return await axios(requestOptions);
            }

            function handleResponse(response, msg) {
                msg.payload = sortArray(response.data);
                msg.request = response.request._header;
                const setCookieHeader = response.headers["set-cookie"];
                if (setCookieHeader) {
                    const sessionCookie = setCookieHeader.find(cookie => cookie.startsWith("JSESSIONID"));
                    if (sessionCookie) {
                        cookieJar[accessId] = sessionCookie.split(";")[0];
                    }
                }
                node.status({ fill: "green", shape: "dot", text: "Success "+response.status });
                node.send(msg);
            }

            async function handleRetry(error, optionsCookie, optionsAuth, msg) {
                if (error.response && error.response.status === 401) {
                    node.warn("Retry with Auth");
                    try {
                        const response = await performRequest({ ...optionsCookie, ...optionsAuth });
                        handleResponse(response, msg);
                    } catch (retryError) {
                        node.status({ fill: "red", shape: "dot", text: "Fail :"+retryError.status });
                        node.error(retryError.message, msg);
                        node.send(error.response);
                    }
                } else {
                    node.status({ fill: "red", shape: "dot", text: "Fail :"+retryError.status });
                    node.error(error.message, msg);
                    node.send(error.response);
                }
            }

            function replaceDotsWithUnderscores(obj) {
                const newObj = {};

                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const newKey = key.replace(/\./g, '_');
                        newObj[newKey] = obj[key];
                    }
                }

                return newObj;
            }

            function sortArray(array) {
                const newArray = [];

                for (const obj of array) {
                    if (obj.__rowType === "DATA") {
                        const data = obj.data;
                        const metaData = {};

                        for (let i = 0; i < data.length; i++) {
                            const key = array[0].data[i].name;
                            const value = data[i];
                            metaData[key] = value;
                        }

                        const metaDataWithUnderscores = replaceDotsWithUnderscores(metaData);
                        newArray.push(metaDataWithUnderscores);
                    }
                }

                return newArray;
            }

        });


    }

    RED.nodes.registerType("http-request", HttpNode);
};
