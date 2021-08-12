# Companion Ninja (aka, OSC.Ninja)
Remote control web-based wrapper for OBS.Ninja; now Companion compatible.

### Works the same as VDO.Ninja

Companion.Ninja works the same as VDO.Ninja, using the same domain/service underneath.  The differnce is Companion.Ninja wraps VDO.Ninja, and issues IFRAME API commands into VDO.Ninja, while also listening to a websocket connection for remote commands.  You can customize the wrapper to allow for very powerful remote control integrations.

You can pass your own VDO.Ninja links to the Companion.Ninja link; just retain the &osc=XXXXXX parameter in the URL for the page you wish to remote control.

You can create multiple Companion.Ninja links, one for each guest even.  The &osc=XXXX value needs to be different per guest, else the commands will be the same for all guests.

This service supports HTTP GET requests and Websockets. The code can be modified to support non-VDO.Ninja domains. See the code for details. This service does not support UDP-packets yet; just TCP HTTPS/WSS.

### Direct integration into VDO.Ninja

While you can use this code to make your own custom IFRAME-based intefaces, support for Companion.Ninja is also built into VDO.Ninja directly, but the commands available are hard coded and the IFRAME API isn't used.  The sample code represents the commands available in the VDO.Ninja v19 release (currently on beta as of August 2nd), so if those are sufficient, you can perhaps just issue commands directly to the osc.vdo.ninja API directly, and just the code provided here as a reference only.

To use the built in integration support, just add &osc=XXXXXX to the VDO.Ninja links, like you would any other parameter.  Only supported on v19 and newer (https://vdo.ninja/beta/?osc=XXXXXX)

### Technical Details of the API

The API is likely to change over time, as this is still early days and user feedback with direct how things evolve.

#### HTTP/GET API

The HTTP API uses GET-requests (not POST/PUT), and is structured in a way to be compatible with existing hotkey control software.

`https://osc.vdo.ninja/{oscid}/{action}/{target}/{value}`

or 

`https://osc.vdo.ninja/{oscid}/{action}/{value}`

or 

`https://osc.vdo.ninja/{oscid}/{action}`


Any field can be replaced with "null", if no value is being passed to it.  

If you are finding there is an issue with cached requests or HTTPS (SSL) is causing problems, you can insetad use:

`http://api.osc.ninja:80/{oscid}/{action}/{target}/{value}`

Keep in mind this has no encryption, and may not be compatible with all websites that enforce/require SSL. 

#### Websocket API

If using the Websocket API, this accepts JSON-based commands

connect to: `wss://osc.vdo.ninja:443`

On connection, send: `{"join": $OSCID }`, where `$OSCID` is your osc ID. 

* be sure to stringify objects as JSON before sending over the websocket connection. ie:  `JSON.stringify(object)`

Once joined, you can then issue commands at will, such as this object

```
{
  "action":"reload",
  "value": "true",
  "target" "null"
}
```

Be sure to implement reconnection logic with the websocket connection, as it will timeout every minute or so by default otherwise.  You will need to rejoin after a timeout.

If you find how often reconnections take place with this API, you can instead use:

`ws://api.osc.ninja:80/{oscid}/{action}/{target}/{value}`

Keep in mind this has no encryption, and may not be compatible with all websites that enforce/require SSL.


