//sudo add-apt-repository ppa:certbot/certbot # Add the certbot repository, if desired
//sudo apt-get install certbot -y # Install certbot required for the HTTPS certificate, if desired

"use strict";
var fs = require("fs");
//var https = require("https");
var http = require("http")
var express = require("express");
var app = express();
var WebSocket = require("ws");
var cors = require('cors');

//const key = fs.readFileSync("/etc/letsencrypt/live/api.vdo.ninja/privkey.pem");
//const cert = fs.readFileSync("/etc/letsencrypt/live/api.vdo.ninja/fullchain.pem");

//var server = https.createServer({key,cert}, app);
var server = http.createServer(app); // in this app, I'm going to rely on Cloudflare for SSL. keep life easy
var websocketServer = new WebSocket.Server({ server });

app.use(express.json());

app.use(cors({
    origin: '*'
}));
          
app.get('/', (req, res) => {
  res.send("0")
})       
        
app.get('/:room', (req, res) => {
  res.send("0");
});   

app.post('/:room', (req, res) => { 
  var room = req.params.room + "";
  var counter = 0;
  var msg = JSON.stringify(req.body);
  websocketServer.clients.forEach( client => {
        if (client.room === room){
                try {
                        client.send(msg);
                        counter+=1;
                } catch(e){}
                  }
  });
  res.send(counter+"");
});

app.put('/:room', (req, res) => {
  var room = req.params.room + "";
  var counter = 0;
  var msg = JSON.stringify(req.body);
  websocketServer.clients.forEach( client => {
        if (client.room === room){
                try {
                        client.send(msg);
                        counter+=1;
                } catch(e){}
        }
  });
  res.end();
});

app.get('/:room/:action/:value', (req, res) => {
  var msg = {};
  msg.action = req.params.action;
  msg.value = req.params.value;
  msg = JSON.stringify(msg);

  var room = req.params.room + "";
  var counter = 0;
  websocketServer.clients.forEach( client => {
          if (client.room === room){
                try{
                        client.send(msg);
                        counter+=1;
                } catch(e){}
        }
  });
  res.send(counter+"");
});

app.get('/:room/:action', (req, res) => {
  var msg = {};
  msg.action = req.params.action;
  msg = JSON.stringify(msg);

  var room = req.params.room + "";
  var counter = 0;
  websocketServer.clients.forEach( client => {
        if (client.room === room){
                try{
                        client.send(msg);
                        counter+=1;
                } catch(e){}
        }
  });
  res.send(counter+"");
});

app.get('/:room/:action/:target/:value', (req, res) => {
  var msg = {};
  msg.action = req.params.action;
  msg.value = req.params.value;
  msg.target = req.params.target;
  msg = JSON.stringify(msg);
  var room = req.params.room +"";
  var counter = 0;
  websocketServer.clients.forEach( client => {
        if (client.room === room){
                try{
                        client.send(msg);
                        counter+=1;
                } catch(e){}
        }
  });
  res.send(counter+"");
});

websocketServer.on('connection', (webSocketClient) => {
    var room = false;
    webSocketClient.on('message', (message) => {
            if (!webSocketClient.room){
                try{
                    var msg = JSON.parse(message);
                    if ("join" in msg){
                        room = msg.join+"";
                        webSocketClient.room = room;
                    }
                    return;
                } catch(e){return;}
            }
            websocketServer.clients.forEach( client => {
                    if (client.room === room){
                        if (webSocketClient!=client){
                                try{
                                        client.send(message.toString());
                                } catch(e){}
                        }
                    }
            });
    });
    webSocketClient.on('close', function(reasonCode, description) {
    });

});
//server.listen(443, () => {console.log(`Server started on port 443`) }); // if using a local cert
server.listen(80, () => {console.log(`Server started on port 80`) }); // if using cloudflare ssl
