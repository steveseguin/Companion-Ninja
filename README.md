# Companion Ninja 
Remote control VDO.Ninja using an HTTP or Websocket interface; now Companion compatible.

### Direct integration into VDO.Ninja

Support for Companion.Ninja is now built into VDO.Ninja (v19), with a set of hard-coded commands. The available API commands and their related options are listed further down. The index.html file contains sample code with an interactive layer, where you can press buttons to send commands to VDO.Ninja.  HTTP and Websocket methods of sending commands are provided as examples.  Details of those two methods are also below.

To use the integrated command set and API, just add &api=XXXXXX to the VDO.Ninja link you wish to remotely control, like you would any other parameter. ie: https://vdo.ninja?api=XXXXXX   The API value needs to match the value used by Companion Ninja and should be kept private. Then just send commands however you may wish.

Note: This API should also work with the vdo.ninja/beta/mixer?api=XXXXX page.

### Companion Plugin

A fantastic user in the community also has made a BitFocus-Companion module for this VDO.Ninja API.  If you wish to avoid doing custom API calls, definitely give the module a go.

https://github.com/bitfocus/companion-module-vdo-ninja

### Customized IFRAME API Integration

You can also use the Companion Ninja service with your own custom set of commands if desired. You would wrap VDO.Ninja into an IFRAME, and use the parent-window to relay commands to VDO.Ninja and Companion Ninja. You can speak to VDO.Ninja via the IFRAME API in that case, to have access to the more exhaustive set of remote control options.

An example of this approach can be found here:

https://github.com/steveseguin/Companion-Ninja/blob/main/iframe_api_customizable_example.html

Also note, the IFRAME API used by VDO.Ninja (v19.1) is also largely backwards compatible with the Companion Ninja API. You can find the IFRAME developer sandbox here: https://vdo.ninja/beta/iframe to get a sense of what is available.

### Technical Details of the API

The API is likely to change over time, as this is still early days and user feedback with direct how things evolve.  More commands added on request.

#### HTTP/GET API (/w SSL)

The HTTP API uses GET-requests (not POST/PUT), and is structured in a way to be compatible with existing hotkey control software. 

`https://api.vdo.ninja/{apiID}/{action}/{target}/{value}`

or 

`https://api.vdo.ninja/{apiID}/{action}/{value}`

or 

`https://api.vdo.ninja/{apiID}/{action}`


Any field can be replaced with "null", if no value is being passed to it. Double slashes will cause issues though, so avoid those.

#### HTTP/POST API

You can also POST JSON to:

`https://api.vdo.ninja/{apiID}`

This supports structured payloads and the optional `value2` field, which is useful for absolute PTZ moves and generic constraint setting.

```json
{
  "action": "ptzZoom",
  "target": "1",
  "value": 0.5,
  "value2": "abs"
}
```

#### Websocket API

If using the Websocket API, this accepts JSON-based commands

connect to: `wss://api.vdo.ninja:443`

On connection, send: `{"join": $apiID }`, where `$apiID` is your api ID. 

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


#### Server Side Events

If you want to simply listen to events, using SSE connections, you can do so using the `https://api.vdo.ninja/sse/APIKEYHERE` endpoint.

Sample Javascript code is below:
```
const apiID = "APIKEYHERE";
const eventSource = new EventSource(`https://api.vdo.ninja/sse/${apiID}`);
eventSource.onmessage = function(event) {
 console.log(JSON.parse(event.data));
};
eventSource.onerror = function(error) {
  console.error('SSE connection error:', error);
  eventSource.close();
};
```

#### API Commands

The API and its commands are currently in a DRAFT form, and as such, may/will undergo change.


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
volume | null | {integer value between 0 and 200} | Sets the playback volume of all local playback audio
sendChat | null | {some chat message} | Sends a chat message to everyone connected. Better suited for the websocket API over the HTTP one.
showChatOverlay | null | {some chat message} | Displays an overlay-style chat message locally
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
raisehand | null | null | Alias of togglehand
togglescreenshare | null | null | Toggles screen sharing on or off; will still ask you to select the screen though.
forceKeyframe | null | null | Forces the publisher of a stream to issue keyframes to all viewers; "rainbow puke fix"
group | null | {an integer between 1 and 8} | Toggle the director of a room in/out of a specified group room (vdo.ninja +v22). Useful for Comms app, etc
joinGroup | null | {an integer between 1 and 8} | Have the director of a room join a specified group room (vdo.ninja +v22.12)
leaveGroup | null | {an integer between 1 and 8} | Have the director of a room leave a specified group room (vdo.ninja +v22.12)
viewGroup | null | {an integer between 1 and 8} | Toggle the director of a room's preview of a specific group (vdo.ninja +v22). Useful for Comms app, etc
joinViewGroup | null | {an integer between 1 and 8} | Have the director of a room preview a specific group (vdo.ninja +v22.12)
leaveViewGroup | null | {an integer between 1 and 8} | Have the director of a room un-preview a specific group (vdo.ninja +v22.12)
getDetails | null | null | Will return a JSON object containing broad general details of the client. Remote guest entries include `streamID` and, on current VDO.Ninja, the live peer `UUID`.
requestStats | null | null | Returns detailed live stats for the page, including peer stats
getStats | Optional stream ID of inbound target | null | Will return a JSON object containing inbound/outbound stats, including bitrates
nextSlide | null | null | Next PowerPoint slide. See https://github.com/steveseguin/powerpoint_remote for setup  (vdo.ninja +v22.12)
prevSlide | null | null | Previous PowerPoint slide. See https://github.com/steveseguin/powerpoint_remote for setup  (vdo.ninja +v22.12)
soloVideo | null | toggle | Toggle the Highlight of video for all guests (if a director)  (vdo.ninja +v23)
soloVideo | null | true | Highlight your video for all guests (if a director)  (vdo.ninja +v23)
soloVideo | null | false | Un-highlight your video for all guests (if a director)  (vdo.ninja +v23)
muteAllGuests | null | true, false, or toggle | Mute, unmute, or toggle all non-director guests using the same director UI path as the mute-all button
stopRoomTimer | null | null | Stop the timer for everyone in the room (if a director)  (vdo.ninja +v23.9)
startRoomTimer | null | Integer to count down from | Value to count down from is in seconds in the room; applies to everyone in a room (if a director)  (vdo.ninja +v23.9)
PauseRoomTimer | null | null | Pause the timer for all everyone in the room (if a director)  (vdo.ninja +v23.9)
getGuestList | null | null | Returns an object containing the guest slots positional values, so "1", "2", etc. Each is a key that contains the stream ID and label for that guest as well.
setBufferDelay | stream ID, UUID, or null | buffer delay in milliseconds | Sets the playback delay of an incoming video/audio stream (+v24.8)
activeSpeaker | null | "toggle", false, null, 1, 2, 3 | Will enable the active speaker mode. If not first enabled by URL, it will enable audio-effects to make it work
tallylight | null | "onair", "active", "standby", "off", or integer | Overrides tally-light state
aspectRatio | null | decimal value or ratio string like 16:9 | Sets the local camera aspect ratio constraint
videoConstraint | constraint name | constraint value in value2 | Sets a local camera constraint; use WebSocket or HTTP POST when passing value2
zoom | null | decimal value (relative) | Adjusts camera zoom level; positive values zoom in, negative values zoom out (+v25)
zoom | null | decimal value | With value2="abs" or "true", sets absolute zoom level between 0-1 (+v25)
focus | null | decimal value | Adjusts camera focus; positive values focus farther, negative values focus closer (+v25)
pan | null | decimal value | Adjusts camera pan position; positive values pan right, negative values pan left (+v25)
tilt | null | decimal value | Adjusts camera tilt position; positive values tilt up, negative values tilt down (+v25)
exposure | null | decimal value 0-1 | Sets the camera exposure level as a value between 0 (dark) and 1 (bright) (+v25)

layout | null | {** see below}

#### Camera Control Commands (PTZ)

The camera control commands allow remote adjustment of compatible cameras with pan, tilt, zoom, focus, and exposure capabilities. These commands support both relative and absolute adjustments:

- **Relative adjustments**: Pass a positive or negative value to incrementally adjust the setting (e.g., `{"action":"zoom", "value":0.1}` to zoom in slightly)
- **Absolute adjustments**: For zoom, you can set an absolute position by including `"value2":"abs"` (e.g., `{"action":"zoom", "value":0.5, "value2":"abs"}` to set zoom to 50%)

These commands also support MIDI control through two methods:
1. **Note-based control**: Uses C5-G5 notes with velocity values 0-127
2. **CC-based control**: Uses Control Change messages with CC#20-25 for various camera parameters

When using the HTTP API, the format would be: `https://api.vdo.ninja/{apiID}/zoom/0.1` for a relative zoom in adjustment.

#### Custom layout switching **

You can create an array of layouts, set them via the URL parameters in VDO.Ninja, and then switch between them remotely using the API.  

The value passed to the API can either be a number, representing the position in the array of the layout you want to activate, or it can be a single layout object.

```{action: "layout", value:3}```
or
```{action: "layout", value:[{"x":0,"y":0,"w":100,"h":100,"slot":0}]}```

```
layout 0 is the auto mixer
layout 1 is the first custom layout
layout 2 is the second custom layout
etc
```

If using the mixer app, the layout objects are controlled via the mixer app itself, so you don't need to pass an object in that case to the URL.

```?layouts=[[{"x":0,"y":0,"w":100,"h":100,"slot":0}],[{"x":0,"y":0,"w":100,"h":100,"slot":1}],[{"x":0,"y":0,"w":100,"h":100,"slot":2}],[{"x":0,"y":0,"w":100,"h":100,"slot":3}],[{"x":0,"y":0,"w":50,"h":100,"c":false,"slot":0},{"x":50,"y":0,"w":50,"h":100,"c":false,"slot":1}],[{"x":0,"y":0,"w":100,"h":100,"z":0,"c":false,"slot":1},{"x":70,"y":70,"w":30,"h":30,"z":1,"c":true,"slot":0}],[{"x":0,"y":0,"w":50,"h":50,"c":true,"slot":0},{"x":50,"y":0,"w":50,"h":50,"c":true,"slot":1},{"x":0,"y":50,"w":50,"h":50,"c":true,"slot":2},{"x":50,"y":50,"w":50,"h":50,"c":true,"slot":3}],[{"x":0,"y":16.667,"w":66.667,"h":66.667,"c":true,"slot":0},{"x":66.667,"y":0,"w":33.333,"h":33.333,"c":true,"slot":1},{"x":66.667,"y":33.333,"w":33.333,"h":33.333,"c":true,"slot":2},{"x":66.667,"y":66.667,"w":33.333,"h":33.333,"c":true,"slot":3}]]```

Some of these layout features are only available with Version 22 of VDO.Ninja; specifically the &layouts= parameter is available on v22.5 or newer only.

See https://docs.vdo.ninja/advanced-settings/director-parameters/and-layouts for details and better documentation on this layout function.




#### Commands that target remote guests as a director (available on vdo.ninja v19)

The guest slot (1 to 99), guest stream ID, or current peer UUID can be used as a target. Slot and stream-ID targeting remain supported; UUID targeting is additive for controllers that read it from `getDetails`.

Most legacy actions still toggle when no explicit state is supplied. Scene commands now also support explicit state via `value2=true` or `value2=false`; existing `addScene` calls without `value2` and legacy `addScene2` through `addScene8` behavior are unchanged.

Action | Target | Value | Details
--- | --- | --- | --- 
forward | {guest slot, stream ID, or UUID} | {destination room} | Transfer guest to specified room
addScene | {guest slot, stream ID, or UUID} | {scene ID; 0 to 8, or an active custom scene name} | Toggle guest in/out of specified scene. With WebSocket/POST, include `value2=true` or `value2=false` to force scene membership.
setScene | {guest slot, stream ID, or UUID} | {scene ID; 0 to 8, or an active custom scene name} | Explicit scene-state helper; include `value2=true` to add or `value2=false` to remove. Missing `value2` falls back to existing toggle behavior.
activateQueuedGuest / removeQueue / removeQueuedGuest | {guest slot, stream ID, or UUID} | null | Activates a held/queued guest using the same director UI path as the visible Activate Guest control.
setslot | {guest slot, stream ID, or UUID} | Destination slot number, or `0` to unset | Assign a guest to a mixer slot using the existing director slot UI path
muteScene | {guest slot, stream ID, or UUID} |  {scene ID; 0 to 8, or an active custom scene name} | Toggle guest's mic audio in scenes
group | {guest slot or stream ID} | {group ID; 1 to 8} | Toggle guest in/out of specified group; default group 1
mic | {guest slot or stream ID} | null | Toggle the mic of a specific guest
hangup | {guest slot or stream ID} | null | Hangup a specific guest
soloChat | {guest slot or stream ID} | null | Toggle solo chat with a specific guest
soloChatBidirectional | {guest slot or stream ID} | null | Toggle two-way solo chat with a specific guest
speaker | {guest slot or stream ID} | null | Toggle speaker with a specific guest
display | {guest slot or stream ID} | null | Toggle whether a specific guest can see any video or not
mirror / mirrorGuest / remoteMirror | {guest slot or stream ID} | true, false, or toggle | Toggle or set director-enforced mirroring on a specific guest
rotate | {guest slot or stream ID} | true, false, 90, 180, or 270 | Rotate a guest's video; `true` advances +90 degrees, `false` resets rotation
channel / pgm | {guest slot or stream ID} | 0, 1, or 2 | Set the PGM/mic isolation channel for a specific guest; 0 resets
sendDirectorChat | {guest slot or stream ID} | {some chat message} | Sents a chat message to a guest and overlays it on their screen
sendPinnedDirectorChat | {guest slot or stream ID} | {some chat message} | Sends a pinned overlay chat message to a guest
forceKeyframe | {guest slot or stream ID} | null | Trigger a keyframe for active scenes, wrt to a guest; helps resolve rainbow puke
soloVideo | {guest slot or stream ID} | null | Toggle whether a video is highlighted everywhere
volume | {guest slot or stream ID} | {0 to 200} | Set the microphone volume of a specific remote guest
stopRoomTimer | {guest slot or stream ID} | null | Stop the timer for the specific guest (+v23.9)
startRoomTimer | {guest slot or stream ID} | Integer to count down from | Value to count down from is in seconds (+v23.9)
PauseRoomTimer | {guest slot or stream ID} | null | Pause the timer for the specific guest (+v23.9)
ptzZoom / remoteZoom | {guest slot or stream ID} | decimal value | Control guest zoom; add value2="abs" for absolute value (+v25)
ptzFocus / remoteFocus | {guest slot or stream ID} | decimal value | Control guest focus; add value2="abs" for absolute value (+v25)
ptzPan / remotePan | {guest slot or stream ID} | decimal value | Control guest pan; add value2="abs" for absolute value (+v25)
ptzTilt / remoteTilt | {guest slot or stream ID} | decimal value | Control guest tilt; add value2="abs" for absolute value (+v25)
ptzAutofocus / remoteAutofocus / resetAutofocus | {guest slot or stream ID} | true, false, manual, or off | Enable or disable guest autofocus
requestResolution | {guest slot or stream ID} | WIDTHxHEIGHT | Request a specific preview resolution from the guest
requestAspectRatio | {guest slot or stream ID} | decimal or ratio string like 16:9 | Request a preview resolution matching an aspect ratio; use value2 as max dimension
setWidth | {guest slot or stream ID} | integer | Request guest capture width
setHeight | {guest slot or stream ID} | integer | Request guest capture height
setAspectRatio | {guest slot or stream ID} | decimal | Request guest capture aspect ratio
refreshVideo / refreshCamera | {guest slot or stream ID} | null | Ask the guest to refresh camera/video tracks
refreshConnection / restartConnection | {guest slot or stream ID} | null | Ask the guest to restart the connection
recoverStream / refreshAll | {guest slot or stream ID} | null | Ask the guest to recover both media and connection state
mixorder | {guest slot or stream ID} | -1 or 1 | Control guest's mixer order in the director's control center (+v27)

`rotate` is available only as a targeted guest-control action for a director or co-director. It is not a standalone untargeted local command on a guest page using `?push=...&api=...`.
Guest-targeted PTZ now uses the explicit `ptz*` or `remote*` actions above. Plain self-targeted `zoom` / `focus` / `pan` / `tilt` / `exposure` are not the guest-targeted control names. The guest publisher should load with `&ptz` and approve the browser PTZ prompt for camera permission.

Slot note: `setslot` values are user-facing destination slot numbers (`1`, `2`, `3`, etc.; `0` unsets). Layout objects still use the existing VDO.Ninja layout convention where a layout item `slot: 0` maps to mixer slot 1.

Mode note: `setslot` requires slot controls to be enabled on the director page. Use `&slotmode=1` on a director URL, or use the mixer app path (`/mixer?director=ROOM&api=KEY`). Current VDO.Ninja includes the local page's `slotmode`, `ptz`, `ptzSlider`, and `remote` flags on the local stream entry returned by `getDetails`.

PTZ note: local camera PTZ commands require the controlled camera page to load with `&ptz` and approve the browser PTZ permission prompt. Guest PTZ commands require the guest publisher to load with `&ptz`; the director or mixer page can then send guest-targeted `ptz*` commands.

### Callbacks / State Responses

Start with Version 22 of VDO.Ninja, the API requestes will have a response reflecting the state of the request.

For example, if toggling a mic of a guest, the response of the HTTP API request will be `true` or `false`, based on whether the mic is now muted or not. If the request is an object, such as when using `getDetails`, you'll get a JSON response instead of basic text.  There's also `getGuestList`, which can be useful for getting a set of possible guest slot positional values, along with its corresponding stream ID and label.

Basic text/word responses are such things as `true`, `false`, `null`, `fail`, {`somevalue`}, or `timeout`. Timeout occurs if there's no listener or no response to a request; the system will stop the callback and fail to a timeout after 1-second.

![image](https://user-images.githubusercontent.com/2575698/172721874-ac13f5c7-330d-4b9d-a605-40a20f63a57d.png)

![image](https://user-images.githubusercontent.com/2575698/172721854-0a8fe712-aaf9-4128-bbb7-0f3de7ca0d3e.png)

If the request was made via Websockets, instead of the HTTP request, you'll get a JSON object back that contains the same data, along with the original request, including custom data fields. These custom data fields, such as `data.cid = 3124`, can be used to link requests with the callback, if precision with the requests is needed.

There is no time-out when using Websockets; the callback can happen seconds or minutes later even, although normally a response should be expected in under a second as well.

Current VDO.Ninja also pushes `details` updates after some controller-visible state changes, such as queue activation and buffer or volume updates. Treat `details` updates as state refresh hints and use `getDetails` when a full snapshot is needed.


![image](https://user-images.githubusercontent.com/2575698/172722028-860dd0b9-b73c-4ef9-8d22-b909bd79c88b.png)
