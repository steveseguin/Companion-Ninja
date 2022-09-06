// If needing certs, you can try certbot; it's free, but requires updates every 3 months.
//sudo add-apt-repository ppa:certbot/certbot # Add the certbot repository
//sudo apt-get install certbot -y # Install certbot required for the HTTPS certificate

"use strict";
var fs = require("fs");
//var https = require("https");
var http = require("http")
var express = require("express");
var app = express();
var WebSocket = require("ws");
var cors = require('cors');

// make sure you have SSL certs installed; if using Certbot, they should be like this:
//const key = fs.readFileSync("/etc/letsencrypt/live/wss.contribute.cam/privkey.pem");
//const cert = fs.readFileSync("/etc/letsencrypt/live/wss.contribute.cam/fullchain.pem");
//var server = https.createServer({key,cert}, app);

var server = http.createServer(app); // in this app, I'm going to rely on Cloudflare for SSL. keeps life easy
var websocketServer = new WebSocket.Server({ server });

var callback = {};

app.use(express.json());

app.use(cors({
    origin: '*'
}));

app.get('/', (req, res) => {
  res.send("0")
})

app.get('/:room', async (req, res) => {
  var room = req.params.room + "";
  var counter = 0;
  var pid = Math.random().toString(36).substr(2, 9);
  var promise = new Promise((resolve, reject) => {
        callback[pid] = {};
        callback[pid].resolve = resolve;
        callback[pid].reject = reject;
        setTimeout((pid) => {
            if (callback[pid]){
                callback[pid].resolve('timeout');
                delete callback[pid];
            }
        }, 5000, pid);
  });

  var msg = {};
  msg.action = "getDetails";
  msg.value = "value";
  msg.get = pid;
  msg = JSON.stringify(msg);

  websocketServer.clients.forEach( client => {
        if (client.room === room){
                try{
                        client.send(msg);
                        counter+=1;
                } catch(e){}
        }
  });

  if (counter==0){
        res.send("failed");
        callback[pid].resolve('failed');
  } else {
        var cb = await promise.then(function(x){return x;}).catch(function(x){return x;});
        res.send(""+cb);
  }
});

app.post('/:room', async (req, res) => {
  var room = req.params.room + "";
  var counter = 0;
  var pid = Math.random().toString(36).substr(2, 9);
  var promise = new Promise((resolve, reject) => {
        callback[pid] = {};
        callback[pid].resolve = resolve;
        callback[pid].reject = reject;
        setTimeout((pid) => {
            if (callback[pid]){
                callback[pid].resolve('timeout');
                delete callback[pid];
            }
        }, 5000, pid);
  });
  var msg = req.body;
  msg.get = pid;
  msg = JSON.stringify(msg);

  websocketServer.clients.forEach( client => {
        if (client.room === room){
                try {
                        client.send(msg);
                        counter+=1;
                } catch(e){}
        }
  });
  if (counter==0){
        res.send("failed");
        callback[pid].resolve('failed');
  } else {
        var cb = await promise.then(function(x){return x;}).catch(function(x){return x;});
        res.send(""+cb);
  }
});

app.put('/:room', async (req, res) => {
  var room = req.params.room + "";
  var counter = 0;
  var pid = Math.random().toString(36).substr(2, 9);
  var promise = new Promise((resolve, reject) => {
        callback[pid] = {};
        callback[pid].resolve = resolve;
        callback[pid].reject = reject;
        setTimeout((pid) => {
            if (callback[pid]){
                callback[pid].resolve('timeout');
                delete callback[pid];
            }
        }, 5000, pid);
  });
  var msg = req.body;
  msg.get = pid;
  msg = JSON.stringify(msg);

  websocketServer.clients.forEach( client => {
        if (client.room === room){
                try {
                        client.send(msg);
                        counter+=1;
                } catch(e){}
        }
  });
  if (counter==0){
        res.send("failed");
        callback[pid].resolve('failed');
  } else {
        var cb = await promise.then(function(x){return x;}).catch(function(x){return x;});
        res.send(""+cb);
  }
});

app.get('/:room/:action/:value', async (req, res) => {

  var pid = Math.random().toString(36).substr(2, 9);
  var promise = new Promise((resolve, reject) => {
        callback[pid] = {};
        callback[pid].resolve = resolve;
        callback[pid].reject = reject;
        setTimeout((pid) => {
            if (callback[pid]){
                callback[pid].resolve('timeout');
                delete callback[pid];
            }
        }, 5000, pid);
  });
  var msg = {};
  msg.action = req.params.action;
  msg.value = req.params.value;
  msg.get = pid;
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
  if (counter==0){
        res.send("failed");
        callback[pid].resolve('failed');
  } else {
        var cb = await promise.then(function(x){return x;}).catch(function(x){return x;});
        res.send(""+cb);
  }
});

app.get('/:room/:action', async (req, res) => {

  var pid = Math.random().toString(36).substr(2, 9);
  var promise = new Promise((resolve, reject) => {
        callback[pid] = {};
        callback[pid].resolve = resolve;
        callback[pid].reject = reject;
        setTimeout((pid) => {
            if (callback[pid]){
                callback[pid].resolve('timeout');
                delete callback[pid];
            }
        }, 5000, pid);
  });
  var msg = {};
  msg.get = pid;
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
  if (counter==0){
        res.send("failed");
        callback[pid].resolve('failed');
  } else {
        var cb = await promise.then(function(x){return x;}).catch(function(x){return x;});
        res.send(""+cb);
  }
});

app.get('/:room/:action/:target/:value', async (req, res) => {

  var pid = Math.random().toString(36).substr(2, 9);
  var promise = new Promise((resolve, reject) => {
        callback[pid] = {};
        callback[pid].resolve = resolve;
        callback[pid].reject = reject;
        setTimeout((pid) => {
            if (callback[pid]){
                callback[pid].resolve('timeout');
                delete callback[pid];
            }
        }, 5000, pid);
  });
  var msg = {};
  msg.action = req.params.action;
  msg.value = req.params.value;
  msg.target = req.params.target;
  msg.get = pid;
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
  if (counter==0){
        res.send("failed");
        callback[pid].resolve('failed');
  } else {
        var cb = await promise.then(function(x){return x;}).catch(function(x){return x;});
        res.send(""+cb);
  }
});

websocketServer.on('connection', (webSocketClient) => {
    var room = false;
    var out = false;
    webSocketClient.on('message', (message) => {
	    if (!webSocketClient.room){
		try{
                    var msg = JSON.parse(message);
		    if ("join" in msg){
			room = msg.join+"";
			webSocketClient.room = room;

			if ("out" in msg){
                                webSocketClient.out = msg.out;
                                out = msg.out;
                        } else {
                                webSocketClient.out = false;
                        }
                        if ("in" in msg){
                                webSocketClient.inn = msg.in;
                        } else {
                                webSocketClient.inn = false;
                        }
		    }
		    return;
	        } catch(e){return;}
	    }
	    var msg = JSON.parse(message);
            if (msg.callback && ("get" in msg.callback)){
		if (callback[msg.callback.get]){
			if ("result" in msg.callback){
				if (typeof msg.callback.result=='object'){
					callback[msg.callback.get].resolve(JSON.stringify(msg.callback.result));
				} else {
					callback[msg.callback.get].resolve(msg.callback.result);
				}
			} else {
				try {
					var msg = message.callback;
					delete msg.get;
					callback[msg.callback.get].resolve(JSON.stringify(msg));
				}catch(e){}
			}
		}
		return;
	    }

	    websocketServer.clients.forEach( client => {
		    if (client.room === room){
		    	if (webSocketClient!=client){
				if (client.inn && out){
                                        if (client.inn == out){
                                                try{
                                                        client.send(message.toString());
                                                } catch(e){}
                                        }
                                } else if (client.inn || out){
                                        // skip
                                } else {
                                        try{
                                                client.send(message.toString());
                                        } catch(e){}
                                }
		    	}
		    }
	    });
    });
    webSocketClient.on('close', function(reasonCode, description) {
    });

});
//server.listen(443, () => {console.log(`Server started on port 443`) });
server.listen(80, () => {console.log(`Server started on port 80`) });
