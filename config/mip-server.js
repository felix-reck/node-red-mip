module.exports = function(RED) {
    function MipServerNode(n) {
        RED.nodes.createNode(this,n);
     
        this.name = n.name;
        this.url = n.url;
        this.user = n.user;
        this.password = this.credentials.password; // aus credentials store
        this.accessId = String(n.accessId).padStart(8, '0'); //
        this.sslVerify = n.sslVerify
        
    }
    RED.nodes.registerType('mip-server',MipServerNode,{
        credentials: {
            password: {type:'password'}
        }
    });
}