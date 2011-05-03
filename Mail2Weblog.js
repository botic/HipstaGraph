/* Includes */
include("ringo/term");
include("ringo/shell");
include("system");

/* Requires */
var {Stream, MemoryStream} = require("io"),
{ByteArray} = require("binary"),
base64  = require("ringo/base64"),
{MetaWeblogClient} = require("./MetaWeblogClient"),
graph = require("./FacebookApi");


/* Init bot */
if (args[1] != null && args[2] != null && args[3] != null && args[4] != null && args[5] != null && args[6] != null) {
   var emailUsername = args[1];
   var emailPassword = args[2];
   
   var blogUsername = args[3];
   var blogPassword = args[4];

   var fbAccessToken = args[5];
   var fbProfileId   = args[6];

   var props = java.lang.System.getProperties();
   props.setProperty("mail.store.protocol", "imaps");

   var session = Packages.javax.mail.Session.getDefaultInstance(props, null);
   var store = session.getStore("imaps");
   store.connect("imap.gmail.com", emailUsername, emailPassword);

   var inbox = store.getFolder("Inbox");
   inbox.open(Packages.javax.mail.Folder.READ_WRITE);

   var client = new MetaWeblogClient("http://antville.org/api/");

   var parseMultipart = function(multipart) {
      var msgData = {
         cameraConfig: {},
         text: undefined
      };
      
      for (var i = 0; i < multipart.getCount(); i++) {
         var bodyPart = multipart.getBodyPart(i);
         var disp = bodyPart.getDisposition();
         if (disp != null && disp.equalsIgnoreCase(javax.mail.Part.ATTACHMENT)) {
            // attachment
            writeln("Got ATTACHMENT --> Attachments not supported...");
         } else {
            // inline
            if (bodyPart.isMimeType("text/plain")) {
               // Append text
               var msgContent = bodyPart.getContent();
               
               var lens, flash, film;
               if ((lens = msgContent.match(/Lens: (.+)/))) {
                  msgData.cameraConfig.lens  = lens[1];
               }
               
               if ((flash = msgContent.match(/Flash: (.+)/))) {
                  msgData.cameraConfig.flash = flash[1];
               }
               
               if ((film = msgContent.match(/Film: (.+)/))) {
                  msgData.cameraConfig.film = film[1];
               }
               
               writeln("Parsed hipsta metadata: " + JSON.stringify(msgData.cameraConfig));
            } else {
               if (bodyPart.isMimeType("image/jpeg")) {
                  var inStream = new Stream(bodyPart.getInputStream());
                  var outStream = new MemoryStream(1024 * 64);
                  inStream.copy(outStream);
               
                  outStream.position = 0;
                  var checkArr = new ByteArray(512);
                  outStream.readInto(checkArr);
               
                  var EXIF_HIPSTA = [0x48, 0x69, 0x70, 0x73, 0x74, 0x61, 0x6D, 0x61, 0x74, 0x69, 0x63];
                  var isFromHipstamatic = false;
                  for (var i = 0; i < checkArr.length && !isFromHipstamatic; i++) {
                     if (checkArr[i] == EXIF_HIPSTA[0]) {
                        isFromHipstamatic = true;
                        for (var u = 1; u < EXIF_HIPSTA.length && i + u < checkArr.length; u++) {
                           isFromHipstamatic = isFromHipstamatic && (checkArr[i + u] == EXIF_HIPSTA[u]);
                        }
                     }
                  }
               
                  if (isFromHipstamatic) {
                     writeln("Hipstamatic found --> Uploading photo...");
                     var imgName = "hipsta" + (new Date()).getTime();
                     client.newMediaObject("hipstagraphy", blogUsername, blogPassword, {
                        "type": "image/jpeg",
                        "name": imgName,
                        "bits": base64.encode(outStream.content),
                        "maxWidth": 500
                     });
                     msgData.text = "&lt;% image '" + imgName + "' %&gt;";
                  } else {
                     writeln("Not from Hipstamatic --> Drop.");
                     return null;
                  }
               }
            }
         
         }
      }
      
      return msgData;
   };

   //var messages = inbox.getMessages();
   var messages = inbox.search(new javax.mail.search.FlagTerm(new javax.mail.Flags(javax.mail.Flags.Flag.SEEN), false));
   writeln("Found " + messages.length + " messages in the inbox.");
   
   for(var i = 0; i < 10 && i < messages.length; i++) {
      var message = messages[i];
      
      try {
         var content = message.getContent();
      
         writeln("Processing message #"+i);
      
         if (content instanceof java.lang.String) {
            // do nothing
         } else if (content instanceof javax.mail.Multipart) {
            var msgData = parseMultipart(content);
            if (msgData.text) {
               writeln("Create posting with subject: " + message.getSubject());
               var tags = "";
               var author = message.getFrom().map(function(item) {
                     if (item instanceof javax.mail.internet.InternetAddress) {
                        return (item.getPersonal() || "martin").toLowerCase().replace(/\s*/g, "");
                     }
                  }).join(" ");
            
               if (msgData.cameraConfig.lens) {
                  tags += ", lens" + msgData.cameraConfig.lens.replace(/\s+|,/g, "");
               }
               if (msgData.cameraConfig.film) {
                  tags += ", film" + msgData.cameraConfig.film.replace(/\s+|,/g, "");
               }
               if (msgData.cameraConfig.flash) {
                  tags += ", flash" + msgData.cameraConfig.flash.replace(/\s+|,/g, "");
               }
            
               var pid = client.newPost("hipstagraphy", blogUsername, blogPassword, {
                  "title": (message.getSubject() || ""),
                  "description": msgData.text,
                  "categories": author + tags
               }, true);
            
               writeln("Got posting#" + pid + " back from Antville API.");
            
               if (pid > 0) {
                  // Post link on the Facebook fanpage
                  var msgText = "A new photo has been posted";
                  if (message.getSubject()) {
                     msgText += ": " + message.getSubject();
                  }
               
                  msgText += " by " + author;
               
                  graph.postLink(
                        fbAccessToken,
                        fbProfileId,
                        "http://hipstagraphy.antville.org/stories/" + pid + "/",
                        msgText
                  );
               }
            }
         }
   
         if (!message.isSet(javax.mail.Flags.Flag.SEEN)) {
            message.setFlag(javax.mail.Flags.Flag.SEEN, true);
         }
      } catch (err) {
         writeln("Error: " + err);
      }
   }
}