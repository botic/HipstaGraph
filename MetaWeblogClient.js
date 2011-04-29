include("ringo/term");

var fs      = require("fs");
var binary  = require("binary");
var base64  = require("ringo/base64");
var Client  = require("ringo/httpclient");

exports.MetaWeblogClient = function MetaWeblogClient(apiEndpoint) {

   /**
    * metaWeblog.newPost (blogid, username, password, struct, publish) returns string
    */
   this.newPost = function(blogid, username, password, struct, publish) {
   
      var xmlString = "<?xml version=\"1.0\"?> \
         <methodCall> \
         	<methodName>metaWeblog.newPost</methodName> \
         	<params> \
         		<param> \
         			<value><string>" + blogid + "</string></value> \
         			<value><string>" + username + "</string></value> \
         			<value><string>" + password + "</string></value> \
         			<value> \
         			   <struct> \
                        <member> \
                           <name>title</name> \
                           <value><string>" + struct.title + "</string></value> \
                        </member> \
                        <member> \
                           <name>description</name> \
                           <value><string>" + struct.description + "</string></value> \
                        </member> \
                        <member> \
                           <name>categories</name> \
                           <value><string>" + struct.categories + "</string></value> \
                        </member> \
                     </struct> \
         			</value> \
         			<value><boolean>" + (publish ? "1" : "0") + "</boolean></value> \
         		</param> \
         	</params> \
         </methodCall>";
   
      Client.request({
         "url": apiEndpoint,
         "method": "POST",
         "data": xmlString,
         "contentType": "text/xml",
         "async": false,
         "binary": false,
         "success": function(data) {
            writeln("Success. "+ data);
            return 12345;
         },
         "error": function() {
            return -1;
         }
      });
   };

   /**
    * metaWeblog.newMediaObject (blogid, username, password, struct) returns struct
    */
   this.newMediaObject = function(blogid, username, password, struct) {
      var xmlString = "<?xml version=\"1.0\"?> \
         <methodCall> \
         	<methodName>metaWeblog.newMediaObject</methodName> \
         	<params> \
         		<param> \
         			<value><string>" + blogid + "</string></value> \
         			<value><string>" + username + "</string></value> \
         			<value><string>" + password + "</string></value> \
         			<value> \
         			   <struct> \
                        <member> \
                           <name>type</name> \
                           <value><string>" + struct.type + "</string></value> \
                        </member> \
                        <member> \
                           <name>name</name> \
                           <value><string>" + struct.name + "</string></value> \
                        </member> \
                        <member> \
                           <name>bits</name> \
                           <value><base64>" + struct.bits + "</base64></value> \
                        </member>";

      if (struct.maxWidth) {
         xmlString +=  "<member> \
                           <name>maxWidth</name> \
                           <value><int>" + parseInt(struct.maxWidth, 10) + "</int></value> \
                        </member>";
      }
      
      if (struct.maxHeight) {
         xmlString +=  "<member> \
                           <name>maxHeight</name> \
                           <value><int>" + parseInt(struct.maxHeight, 10) + "</int></value> \
                        </member>";
      }

      xmlString +=  "</struct> \
         			</value> \
         		</param> \
         	</params> \
         </methodCall>";
   
      Client.request({
         "url": apiEndpoint,
         "method": "POST",
         "data": xmlString,
         "contentType": "text/xml",
         "async": false,
         "binary": false,
         "success": function(data) {
            writeln("Success. "+ data);
            return 12345;
         },
         "error": function() {
            return -1;
         }
      });
   };
};