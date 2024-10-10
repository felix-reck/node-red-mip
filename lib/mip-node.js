const mipclient = require('./mip-client.js');
const bodyCreator = require('./body-creator.js');
const responseHandler = require('./response-handler.js');

module.exports = function (RED) {
    function httpNode(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.on('input', async function (msg) {
            node.name = config.name || 'mip-node';

            // Input parameters
            const server = RED.nodes.getNode(config.server);
            const service = (config.service || msg.service || '').replace(/\./g, '/');
            const method = config.method || 'GET';
            const format = config.format;
            const servicetype = config.servicetype;

            // Create request body
            let requestBody = bodyCreator.customBody(msg.payload);
            requestBody = format == 'original' ? requestBody : { ...requestBody, returnAsObject: false };

            // Create options for the request using the mip-client helper
            const options = mipclient.createOptions({
                url: server.url,
                user: server.user,
                password: server.password,
                accessId: server.accessId,
                sslVerify: server.sslVerify,
                method: method,
                service: service,
                servicetype: servicetype
            }, requestBody);


            let response = await mipclient.performRequest(node, options.optionsCookie);
            if (response.status === 401) {
                response = await mipclient.performRequest(node, options.optionsAuth);
            }
            if (response.status === 200) {
                const result = mipclient.handleResponse(response, format, servicetype, server.accessId);
                msg.payload = result.payload;
                msg.request = result.request;

                node.status({ fill: 'green', shape: 'dot', text: 'Success, HTTP ' + response.status });
                node.send(msg);
            } else {
                const message = response.errorMessage || 'Fail' //better error messages
                node.status({ fill: 'red', shape: 'dot', text: message });
                node.error('FAIL')

            }


        });
    }

    RED.nodes.registerType('mip', httpNode);
};
