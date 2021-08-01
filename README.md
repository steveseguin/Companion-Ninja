# OSC.Ninja
Remote control web-based wrapper for OBS.Ninja; now Companion compatible.

### Works the same as VDO.Ninja

OSC.Ninja works the same as VDO.Ninja, using the same domain/service underneath.  The differnce is OSC.Ninja wraps VDO.Ninja, and issues IFRAME API commands into VDO.Ninja, while also listening to a websocket connection for remote commands.

You can pass your own VDO.Ninja links to the OSC.Ninja link; just retain the &osc=XXXXXX parameter in the URL for the page you wish to remote control.

You can create multiple OSC.Ninja links, one for each guest even.  The &osc=XXXX value needs to be different per guest, else the commands will be the same for all guests.

This service supports HTTP GET requests and Websockets. The code can be modified to support non-VDO.Ninja domains. See the code for details. This service does not support UDP-packets yet; just TCP HTTPS/WSS.


