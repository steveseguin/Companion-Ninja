# OSC.Ninja
Remote control web-based wrapper for OBS.Ninja; now Companion compatible.

### Works the same as VDO.Ninja

OSC.Ninja works the same as VDO.Ninja, using the same domain/service underneath.  The differnce is OSC.Ninja wraps VDO.Ninja, and issues IFRAME API commands into VDO.Ninja, while also listening to a websocket connection for remote commands.

This service supports HTTP GET requests and Websockets. The code can be modified to support non-VDO.Ninja domains. See the code for details.

This service does not support UDP-packets yet; just TCP HTTPS/WSS.


