const mipclient = require('./mip-client.js');
const bodyCreator = require('./body-creator.js');

module.exports = function (RED) {
    function setWorkplaceState(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.on('input', async function (msg) {
            node.name = config.name || 'mip-workplace';

            // Input parameters
            const server = RED.nodes.getNode(config.server);
            const service = "ChangeWorkplaceStatus/execute";
            const method = 'POST';
            const format = config.format;
            const servicetype = 'data';

            // Create request body
            let requestBody = bodyCreator.workplaceBody(msg.topic, msg.payload, msg.timestamp);

            // Create options for the request using mip-client helper
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
                console.log("Retry with auth");
                response = await mipclient.performRequest(node, options.optionsAuth);
            }
            if (response.status === 200) {
                const result = mipclient.handleResponse(response, format, servicetype, server.accessId);
                msg.payload = result.data;
                msg.status= result.status;
                msg.statusText= result.statusText;

                node.status({ fill: 'green', shape: 'dot', text: 'Success, HTTP ' + response.status });
                node.send(msg);
            } else {
                const message = response.errorMessage || 'Fail' //better error messages
                node.status({ fill: 'red', shape: 'dot', text: message });
                node.error('FAIL')

            }


        });
    }

    RED.nodes.registerType('mip-wp-status', setWorkplaceState);
};
