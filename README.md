# OSC.Ninja
Remote control web-based wrapper for OBS.Ninja; now Companion compatible.

### Works the same as VDO.Ninja

OSC.Ninja works the same as VDO.Ninja, using the same domain/service underneath.  The differnce is OSC.Ninja wraps VDO.Ninja, and issues IFRAME API commands into VDO.Ninja, while also listening to a websocket connection for remote commands.  You can customize the wrapper to allow for very powerful remote control integrations.

You can pass your own VDO.Ninja links to the OSC.Ninja link; just retain the &osc=XXXXXX parameter in the URL for the page you wish to remote control.

You can create multiple OSC.Ninja links, one for each guest even.  The &osc=XXXX value needs to be different per guest, else the commands will be the same for all guests.

This service supports HTTP GET requests and Websockets. The code can be modified to support non-VDO.Ninja domains. See the code for details. This service does not support UDP-packets yet; just TCP HTTPS/WSS.

### Direct integration into VDO.Ninja

While you can use this code to make your own custom IFRAME-based intefaces, support for OSC.Ninja is also built into VDO.Ninja directly, but the commands available are hard coded and the IFRAME API isn't used.  The sample code represents the commands available in the VDO.Ninja v19 release (currently on beta as of August 2nd), so if those are sufficient, you can perhaps just issue commands directly to the osc.vdo.ninja API directly, and just the code provided here as a reference only.

To use the built in integration support, just add &osc=XXXXXX to the VDO.Ninja links, like you would any other parameter.  Only supported on v19 and newer (https://vdo.ninja/beta/?osc=XXXXXX)



