# VDO.Ninja Remote Control API Documentation

## Overview

VDO.Ninja's Remote Control API allows programmatic control of VDO.Ninja sessions via HTTP or WebSocket connections. This powerful API enables integration with stream decks, custom applications, and automation tools for controlling cameras, microphones, layouts, and other features.

## Basic Setup

To enable the API on any VDO.Ninja instance, add the `&api` parameter with a unique API key:

```
https://vdo.ninja/?api=YOUR_UNIQUE_API_KEY&webcam
```

This key must be kept private and will be used to authenticate API requests. The same key must be used when making API calls to control this specific VDO.Ninja instance.

## Connection Methods

The API supports four connection methods:

1. **WebSocket API** (recommended for real-time control)
2. **HTTP GET API** (good for simple controllers and hotkeys)
3. **HTTP POST API** (supports structured payloads and `value2`)
4. **Server-Sent Events** (SSE) for one-way event monitoring

### WebSocket API

Connect to `wss://api.vdo.ninja:443` and authenticate with your API key:

```javascript
const socket = new WebSocket("wss://api.vdo.ninja:443");

socket.onopen = function() {
    // Join with your API key
    socket.send(JSON.stringify({"join": "YOUR_UNIQUE_API_KEY"}));
    
    // After joining, you can send commands
    socket.send(JSON.stringify({
        "action": "mic", 
        "value": false // mute microphone
    }));
};

// Listen for responses and events
socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log("Received:", data);
};
```

### HTTP GET API

Structure: `https://api.vdo.ninja/{apiKey}/{action}/{target}/{value}`

Examples:
```
https://api.vdo.ninja/YOUR_UNIQUE_API_KEY/mic/false       // Mute microphone
https://api.vdo.ninja/YOUR_UNIQUE_API_KEY/camera/toggle   // Toggle camera
```

### HTTP POST API

POST JSON to `https://api.vdo.ninja/{apiKey}` when you need `value2`, structured values, or cleaner automation payloads:

```javascript
fetch("https://api.vdo.ninja/YOUR_UNIQUE_API_KEY", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        action: "ptzZoom",
        target: "1",
        value: 0.5,
        value2: "abs"
    })
});
```

### Server-Sent Events (SSE)

For monitoring events without sending commands:

```javascript
const eventSource = new EventSource(`https://api.vdo.ninja/sse/YOUR_UNIQUE_API_KEY`);
eventSource.onmessage = function(event) {
    console.log(JSON.parse(event.data));
};
```

## API Commands Reference

### Self-Targeted Commands

These commands affect the local VDO.Ninja instance that has the API key enabled.

| Action | Value Options | Description |
|--------|--------------|-------------|
| `mic` | `true`, `false`, `toggle` | Control microphone state |
| `camera` | `true`, `false`, `toggle` | Control camera state |
| `speaker` | `true`, `false`, `toggle` | Control speaker state |
| `volume` | `0` to `200` | Set playback volume (percentage) |
| `bitrate` | Integer (kbps), `-1` for auto | Set video bitrate |
| `record` | `true`, `false` | Control local recording |
| `hangup` | N/A | Disconnect current session |
| `reload` | N/A | Reload the page |
| `sendChat` | Text string | Send a chat message |
| `showChatOverlay` | Text string | Display an overlay-style chat message locally |
| `togglehand` | N/A | Toggle raised hand status |
| `raisehand` | N/A | Alias of `togglehand` |
| `togglescreenshare` | N/A | Toggle screen sharing |
| `forceKeyframe` | N/A | Force video keyframes ("rainbow puke fix") |
| `getDetails` | N/A | Get detailed state information |
| `requestStats` | N/A | Get detailed live stats for the current page, including peer stats |
| `getStats` | Optional stream ID | Get quick stats summary |
| `getGuestList` | N/A | Get list of connected guests with IDs |
| `setBufferDelay` | Milliseconds | Set playback delay for incoming media |
| `activeSpeaker` | `toggle`, `false`, `1`, `2`, `3` | Enable or configure active-speaker mode |
| `tallylight` | `onair`, `active`, `standby`, `off`, or integer | Override tally-light state |
| `aspectRatio` | Decimal or ratio string like `16:9` | Set the local camera aspect ratio constraint |
| `videoConstraint` | Constraint name in `value`, actual value in `value2` | Set a local camera constraint (WebSocket/POST) |

Commands that rely on `value2`, such as `videoConstraint` or absolute PTZ positioning, should use WebSocket or HTTP POST instead of simple GET.

### Layout Control Commands

| Action | Value | Description |
|--------|-------|-------------|
| `layout` | `0` or `false` | Switch to auto-mixer layout |
| `layout` | Integer (`1`, `2`, etc.) | Switch to specific predefined layout |
| `layout` | Layout object/array | Apply custom layout configuration |

### Camera Control (PTZ) Commands

| Action | Value | Description |
|--------|-------|-------------|
| `zoom` | `-1.0` to `1.0` | Adjust zoom level (relative) |
| `zoom` | `0.0` to `1.0` with `value2="abs"` | Set absolute zoom level |
| `focus` | `-1.0` to `1.0` | Adjust focus (relative) |
| `pan` | `-1.0` to `1.0` | Adjust camera pan (negative=left) |
| `tilt` | `-1.0` to `1.0` | Adjust camera tilt (negative=down) |
| `exposure` | `0.0` to `1.0` | Adjust camera exposure |

### Group Communication Commands

| Action | Value | Description |
|--------|-------|-------------|
| `group` | `1` to `8` | Toggle participation in specified group |
| `joinGroup` | `1` to `8` | Join a specific group |
| `leaveGroup` | `1` to `8` | Leave a specific group |
| `viewGroup` | `1` to `8` | Toggle view of specified group |
| `joinViewGroup` | `1` to `8` | View a specific group |
| `leaveViewGroup` | `1` to `8` | Stop viewing a specific group |

### Timer Commands

| Action | Value | Description |
|--------|-------|-------------|
| `startRoomTimer` | Integer (seconds) | Start countdown timer for room |
| `pauseRoomTimer` | N/A | Pause the room timer |
| `stopRoomTimer` | N/A | Stop and reset the room timer |

### Presentation Control

| Action | Value | Description |
|--------|-------|-------------|
| `nextSlide` | N/A | Advance to next slide (for PowerPoint integration) |
| `prevSlide` | N/A | Go to previous slide |
| `soloVideo` | `true`, `false`, `toggle` | Highlight video for all guests |

### Director-Only Guest Commands

These commands target specific guests when you are the director.

| Action | Target | Value | Description |
|--------|--------|-------|-------------|
| `forward` | Guest ID/slot | Room name | Transfer guest to another room |
| `addScene` | Guest ID/slot | Scene ID (1-8) | Toggle guest in/out of scene |
| `muteScene` | Guest ID/slot | Scene ID | Toggle guest's audio in scene |
| `mic` | Guest ID/slot | `true`, `false`, `toggle` | Control guest's microphone |
| `hangup` | Guest ID/slot | N/A | Disconnect a specific guest |
| `soloChat` | Guest ID/slot | N/A | Private chat with guest |
| `soloChatBidirectional` | Guest ID/slot | N/A | Two-way private chat |
| `speaker` | Guest ID/slot | N/A | Toggle guest's speaker |
| `display` | Guest ID/slot | N/A | Toggle guest's display |
| `mirror` / `mirrorGuest` / `remoteMirror` | Guest ID/slot | `true`, `false`, `toggle` | Toggle or set director-enforced mirroring on the guest sender |
| `rotate` | Guest ID/slot | `true`, `false`, `90`, `180`, `270` | Rotate guest video. `true` advances +90 degrees; `false` resets rotation. |
| `channel` / `pgm` | Guest ID/slot | `0`, `1`, `2` | Set guest PGM/mic isolation channel; `0` resets |
| `forceKeyframe` | Guest ID/slot | N/A | Fix video artifacts for guest |
| `soloVideo` | Guest ID/slot | N/A | Highlight specific guest's video |
| `volume` | Guest ID/slot | `0` to `200` | Set guest's microphone volume |
| `sendPinnedDirectorChat` | Guest ID/slot | Text string | Send a pinned overlay chat message to the guest |
| `ptzZoom` / `remoteZoom` | Guest ID/slot | Decimal | Control guest zoom; use `value2="abs"` for absolute moves |
| `ptzFocus` / `remoteFocus` | Guest ID/slot | Decimal | Control guest focus; use `value2="abs"` for absolute moves |
| `ptzPan` / `remotePan` | Guest ID/slot | Decimal | Control guest pan; use `value2="abs"` for absolute moves |
| `ptzTilt` / `remoteTilt` | Guest ID/slot | Decimal | Control guest tilt; use `value2="abs"` for absolute moves |
| `ptzAutofocus` / `remoteAutofocus` / `resetAutofocus` | Guest ID/slot | `true`, `false`, `manual`, `off` | Enable or disable guest autofocus |
| `requestResolution` | Guest ID/slot | `WIDTHxHEIGHT` | Request a specific preview resolution from the guest |
| `requestAspectRatio` | Guest ID/slot | Decimal or ratio string like `16:9` | Request a preview resolution matching an aspect ratio; use `value2` as max dimension |
| `setWidth` | Guest ID/slot | Integer | Request guest capture width |
| `setHeight` | Guest ID/slot | Integer | Request guest capture height |
| `setAspectRatio` | Guest ID/slot | Decimal | Request guest capture aspect ratio |
| `refreshVideo` / `refreshCamera` | Guest ID/slot | N/A | Ask the guest to refresh camera/video tracks |
| `refreshConnection` / `restartConnection` | Guest ID/slot | N/A | Ask the guest to restart the connection |
| `recoverStream` / `refreshAll` | Guest ID/slot | N/A | Ask the guest to recover both media and connection state |
| `mixorder` | Guest ID/slot | `-1` or `1` | Change guest's position in mixer |

`rotate` is a director-side guest command. It is not exposed as a standalone untargeted local command on a guest page using `?push=...&api=...`.
Guest-targeted PTZ now uses the explicit `ptz*` or `remote*` actions above. Plain self-targeted `zoom` / `focus` / `pan` / `tilt` / `exposure` are not the guest-targeted control names.

## Target Parameter Explanation

When using director commands, you can specify targets in two ways:

1. **Slot number**: Simple integers like `1`, `2`, `3` (corresponds to position in room)
2. **Stream ID**: The unique ID for a specific guest (more reliable as slots can change)

Examples:
```javascript
// Target guest in slot 1
{"action": "mic", "target": 1, "value": false}

// Target guest with specific stream ID
{"action": "mic", "target": "abc123xyz", "value": false}
```

## Callbacks and Responses

API commands receive callbacks with the current state after execution:

```javascript
// WebSocket example response when toggling mic
{
  "callback": {
    "action": "mic",
    "value": "toggle",
    "result": false  // Indicates mic is now muted
  }
}
```

## Custom Layout Format

The layout API supports complex scene configurations. Layouts can be arrays of objects with properties:

```javascript
// Simple layout with two videos
{
  "action": "layout",
  "value": [
    {"x": 0, "y": 0, "w": 50, "h": 100, "slot": 0},
    {"x": 50, "y": 0, "w": 50, "h": 100, "slot": 1}
  ]
}
```

Layout object properties:
- `x`, `y`: Position (percentage of canvas)
- `w`, `h`: Width and height (percentage)
- `slot`: Which video slot to display (0-indexed)
- `z`: Z-index for layering (optional)
- `c`: Cover mode (true/false, optional)

## Implementation Examples

### Python Example

```python
import websockets
import asyncio
import json

async def control_camera():
    async with websockets.connect("wss://api.vdo.ninja:443") as websocket:
        # Join with API key
        await websocket.send(json.dumps({"join": "YOUR_API_KEY"}))
        
        # Zoom in camera
        await websocket.send(json.dumps({
            "action": "zoom",
            "value": 0.5,
            "value2": "abs"
        }))
        
        # Wait for response
        response = await websocket.recv()
        print(f"Response: {response}")

asyncio.run(control_camera())
```

### JavaScript HTTP Example

```javascript
// Toggle microphone via HTTP
fetch("https://api.vdo.ninja/YOUR_API_KEY/mic/toggle")
    .then(response => response.text())
    .then(result => console.log("Mic toggled, new state:", result));
```

## Integration with Automation Tools

The API integrates well with:

1. **BitFocus Companion**: Official module available at [github.com/bitfocus/companion-module-vdo-ninja](https://github.com/bitfocus/companion-module-vdo-ninja)
2. **Stream Deck**: Can use HTTP requests for button actions
3. **Node-RED**: Great for complex automation workflows
4. **Home Assistant**: For smart home integration

## Security Considerations

- Keep your API key private
- Consider using unique keys for different productions
- The API has full control over the VDO.Ninja instance it's connected to
- All connections are encrypted over SSL/TLS

## Troubleshooting

- Ensure the API key matches exactly between VDO.Ninja and your requests
- For WebSocket connections, implement reconnection logic (connections timeout after ~1 minute of inactivity)
- When using HTTP API, a `timeout` response means the request couldn't reach the target

## Additional Resources

- Complete API documentation: [github.com/steveseguin/Companion-Ninja](https://github.com/steveseguin/Companion-Ninja)
- Interactive demo: [companion.vdo.ninja](https://companion.vdo.ninja)
- For Python implementations: See the Python sample in the repository

## Advanced Usage: Self-Hosting the API

For production environments, you can self-host the API server:

1. Clone the repository from GitHub
2. Install dependencies with `npm install`
3. Modify the server URL in your VDO.Ninja instances:
   ```javascript
   session.apiserver = "wss://your-custom-domain:443";
   ```
4. Run the server with proper SSL certificates

Note: Self-hosting support is limited and should only be attempted by experienced developers.
