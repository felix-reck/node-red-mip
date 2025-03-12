const mipclient = require('./mip-client.js');
const bodyCreator = require('./body-creator.js');

module.exports = function (RED) {
    function setWorkplaceState(config) {
        RED.nodes.createNode(this, config);
        let node = this;

        node.on('input', async function (msg, send, done) {

            // Input parameters
            const server = RED.nodes.getNode(config.server);
            const service = "ChangeWorkplaceStatus/execute";
            const method = 'POST';
            const format = config.format;
            const servicetype = 'data';
            const automatic = config.automatic ?? false
            const automaticParameter = automatic ? 'A' : 'M'

            // Create request body
            let requestBody = bodyCreator.workplaceBody(msg.topic, msg.payload, msg.timestamp, automaticParameter, format);

            // Create options for the request using mip-client helper
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

    RED.nodes.registerType('mip-wp-status', setWorkplaceState);
};
