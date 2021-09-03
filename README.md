# Companion Ninja (aka, OSC.Ninja)
Remote control web-based wrapper for OBS.Ninja; now Companion compatible.

### Works the same as VDO.Ninja

Companion.Ninja works the same as VDO.Ninja, using the same domain/service underneath.  The differnce is Companion.Ninja wraps VDO.Ninja, and issues IFRAME API commands into VDO.Ninja, while also listening to a websocket connection for remote commands.  You can customize the wrapper to allow for very powerful remote control integrations.

You can pass your own VDO.Ninja links to the Companion.Ninja link; just retain the &osc=XXXXXX parameter in the URL for the page you wish to remote control.

You can create multiple Companion.Ninja links, one for each guest even.  The &osc=XXXX value needs to be different per guest, else the commands will be the same for all guests.

This service supports HTTP GET requests and Websockets. The code can be modified to support non-VDO.Ninja domains. See the code for details. This service does not support UDP-packets yet; just TCP HTTPS/WSS.

### Direct integration into VDO.Ninja

While you can use this code to make your own custom IFRAME-based intefaces, support for Companion.Ninja is also built into VDO.Ninja directly, but the commands available are hard coded and the IFRAME API isn't used.  The sample code represents the commands available in the VDO.Ninja v19 release (currently on beta as of August 2nd), so if those are sufficient, you can perhaps just issue commands directly to the api.vdo.ninja API directly, and just the code provided here as a reference only.

To use the built in integration support, just add &osc=XXXXXX to the VDO.Ninja links, like you would any other parameter.  Only supported on v19 and newer (https://vdo.ninja?osc=XXXXXX)

### Technical Details of the API

The API is likely to change over time, as this is still early days and user feedback with direct how things evolve.

#### HTTP/GET API

The HTTP API uses GET-requests (not POST/PUT), and is structured in a way to be compatible with existing hotkey control software.

`https://api.vdo.ninja/{oscid}/{action}/{target}/{value}`

or 

`https://api.vdo.ninja/{oscid}/{action}/{value}`

or 

`https://api.vdo.ninja/{oscid}/{action}`


Any field can be replaced with "null", if no value is being passed to it.  

#### Websocket API

If using the Websocket API, this accepts JSON-based commands

connect to: `wss://api.vdo.ninja:443`

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

#### API Commands

The API and its commands are currently in a DRAFT form, and as such, may/will undergo change.

##### HTTP-GET based requests

There's a few different ways to configure the HTTP requests:

```"https://osc.vdo.ninja/"+oscid+"/"+action+"/"+target+"/"+value;```

```"https://osc.vdo.ninja/"+oscid+"/"+action+"/"+value;```

```"https://osc.vdo.ninja/"+oscid+"/"+action;```

Setting `null` works if an element needs to be left empty; double slashes will cause issues though.


Action | Target | Value | Details
--- | --- | --- | --- 
speaker | null | true | Unmute the Local Speaker
speaker | null | false | Mute the Local Speaker
speaker | null | toggle | Toggle the state of the local Speaker
mic | null | true | Unmute the local Microphone
mic | null | false | Mute the local Microphone
mic | null | toggle | Toggle the state of the local Microphone
camera | null | true | Unmute local Camera
camera | null | false | Mute local Camera
camera | null | toggle | Toggle the state of the local Camera 
volume | null | true | Mutes all local audio tracks by setting the volume to 0%
volume | null | false | Sets the playback volume of all audio tracks to 100%
volume | null | {integer value between 0 and 100} | Sets the playback volume of all local playback audio
sendChat | null | {some chat message} | Sends a chat message to everyone connected. Better suited for the websocket API over the HTTP one.
record | null | true | Start recording the local video stream to disk; will probably create a popup currently
record | null | false | Stops  recording the local video stream
reload | null | null | Reload the current page
hangup | null | null | Hang up the current connection. For the director, this just stops the mic and camera mainly. 
bitrate | null | true | Unlock/reset bitrate of all currently incoming video
bitrate | null | false | Pause all currently incoming video streams (bitrate to 0)
bitrate | null | {some integer} | Set video bitrate of all incoming video streams to target bitrate in kilobits per second.
panning | null | true | Centers the pan
panning | null | false | Centers the pan
panning | null | {an integer between 0 and 180} | Sets the stereo panning of all incoming audio streams; left to right, with 90 being center.
togglehand | null | null | Toggles whether your hand is raised or not
togglescreenshare | null | null | Toggles screen sharing on or off; will still ask you to select the screen though.

#### Commands on vdo.ninja/beta (upcoming changes)
Action | Target | Value | Details
--- | --- | --- | --- 
forward | {guest slot or stream ID} | {destination room} | Transfer guest to specified room
addScene | {guest slot or stream ID} | {scene ID; 0 to 8, or an active custom scene name} | Toggle guest in/out of specified scene
muteScene | {guest slot or stream ID} |  {scene ID; 0 to 8, or an active custom scene name} | Toggle guest's mic audio in scenes
mic | {guest slot or stream ID} | null | Toggle the mic of a specific guest
hangup | {guest slot or stream ID} | null | Hangup a specific guest
soloChat | {guest slot or stream ID} | null | Toggle solo chat with a specific guest
speaker | {guest slot or stream ID} | null | Toggle speaker with a specific guest
display | {guest slot or stream ID} | null | Toggle whether a specific guest can see any video or not
forceKeyframe | {guest slot or stream ID} | null | Trigger a keyframe for active scenes, wrt to a guest; helps resolve rainbow puke
soloVideo | {guest slot or stream ID} | null | Toggle whether a video is highlighted everywhere
volume | {guest slot or stream ID} | {0 to 100} | Set the microphone volume of a specific remote guest


