/* Includes */
include("ringo/term");
include("ringo/shell");

/* Requires */
var Client  = require("ringo/httpclient");

exports.postLink = function(accessToken, ogProfileId, link, message) {
   Client.request({
      "url": "https://graph.facebook.com/" + ogProfileId + "/links",
      "method": "POST",
      "data": {
         "access_token": accessToken,
         "link": link,
         "message": message
      },
      "async": false,
      "binary": false,
      "success": function(data) {
         writeln("Posted on Facebook: "+ data);
      },
      "error": function(data) {
         writeln("Posting on Facebook failed: "+ data);
      }
   });
};