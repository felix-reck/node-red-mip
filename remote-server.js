module.exports = function(RED) {
    function RemoteServerNode(n) {
        RED.nodes.createNode(this,n);
     
        this.name = n.name;
        this.url = n.url;
        this.user = n.user;
        this.password = n.password;
        this.accessId = n.accessId;
        this.sslVerify = n.sslVerify
        
    }
    RED.nodes.registerType("remote-server",RemoteServerNode);
}