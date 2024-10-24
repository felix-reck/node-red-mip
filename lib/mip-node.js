const mipclient = require('./mip-client.js');
const bodyCreator = require('./body-creator.js');

module.exports = function (RED) {
    function httpNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.on('input', async function (msg, send, done) {

            // Input parameters
            const server = RED.nodes.getNode(config.server);
            const service = (config.service || msg.service || '').replace(/\./g, '/');
            const method = config.method;
            const format = config.format;
            const servicetype = config.servicetype;

            // Create request body
            const requestBody = bodyCreator.customBody(msg.payload, format);

            if(!requestBody && method == 'POST'){
                const message = 'Invalid request body';
                node.status({ fill: 'red', shape: 'dot', text: message });
                return done(message);
            };
            /*
            This is not ideal. There are cases where msg.payload exists (for example sent by the trigger).
            Disabled until better solution is found
            if (msg.payload && method == 'GET'){
                const message = 'Request body + GET not possible';
                node.status({ fill: 'red', shape: 'dot', text: message });
                return done(message);
            }
            */

            // Create options for the request using the mip-client helper
            const options = mipclient.createOptions({
                url: server.url,
                user: server.user,
                password: server.password,
                accessId: server.accessId,
                sslVerify: server.sslVerify,
                method: method,
                service: service,
                servicetype: servicetype,
                maxResponseSize: server.maxResponseSize
            }, requestBody);


            let response = await mipclient.performRequest(node, options.optionsCookie);
            if (response.status === 401) {
                response = await mipclient.performRequest(node, options.optionsAuth);
            }
            if (response.status === 200) {
                const result = mipclient.handleResponse(response, format, servicetype);
                msg.payload = result.data;
                msg.status = result.status;
                msg.statusText = result.statusText;
                //msg.setCookie = result.setCookie;
                send(msg);
                done();
            } else {

                done(response.message)

                //do nothing!

            }


        });
    }

    RED.nodes.registerType('mip', httpNode);
};
