# VDO.Ninja IFRAME API: Transmitting Drawing Data Between Clients

This guide explains how to use the VDO.Ninja IFRAME API to send drawing data (or any custom data) between clients using peer-to-peer (P2P) data channels.

## Understanding the Data Channel

VDO.Ninja allows you to send arbitrary data between connected clients using its P2P data channels. This feature enables applications like:

- Custom drawing/annotation tools
- Chat systems
- Control signals
- Sensor data exchange
- Any other custom data payloads

The creators of VDO.Ninja use VDO.Ninja's data-channel functionality in many of their other applications and services, including Social Stream Ninja that processes hundreds of messages per minute per peer connection.



## Basic Setup

First, set up your VDO.Ninja iframe as described in the basic documentation:

```javascript
// Create the iframe element
var iframe = document.createElement("iframe");

// Set necessary permissions
iframe.allow = "camera;microphone;fullscreen;display-capture;autoplay;";

// Set the source URL (your VDO.Ninja room)
iframe.src = "https://vdo.ninja/?room=your-room-name&cleanoutput";

// Add the iframe to your page
document.getElementById("container").appendChild(iframe);
```

## Setting Up Event Listeners

To receive data from other clients, set up an event listener for messages from the iframe:

```javascript
// Set up event listener (cross-browser compatible)
var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
var eventer = window[eventMethod];
var messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

// Connected peers storage
var connectedPeers = {};

// Add the event listener
eventer(messageEvent, function(e) {
    // Make sure the message is from our VDO.Ninja iframe
    if (e.source != iframe.contentWindow) return;
    
    // Process connection events to track connected peers
    if ("action" in e.data) {
        if (e.data.action === "guest-connected" && e.data.streamID) {
            // Store connected peer information
            connectedPeers[e.data.streamID] = e.data.value?.label || "Guest";
            console.log("Guest connected:", e.data.streamID, "Label:", connectedPeers[e.data.streamID]);
        } 
        else if (e.data.action === "push-connection" && e.data.value === false && e.data.streamID) {
            // Remove disconnected peers
            console.log("Guest disconnected:", e.data.streamID);
            delete connectedPeers[e.data.streamID];
        }
    }
    
    // Handle received data
    if ("dataReceived" in e.data) {
        // Process any custom data received from peers
        console.log("Data received:", e.data.dataReceived);
        
        // If our custom data format is detected
        if ("overlayNinja" in e.data.dataReceived) {
            processReceivedData(e.data.dataReceived.overlayNinja, e.data.UUID);
        }
    }
}, false);

function processReceivedData(data, senderUUID) {
    // Process the data based on your application's needs
    console.log("Processing data from UUID:", senderUUID, "Data:", data);
    
    // Example: Handle drawing data
    if (data.drawingData) {
        updateDrawingCanvas(data.drawingData);
    }
}
```

## Sending Data to Peers

### Sending to All Connected Peers

Use this approach to broadcast data to all connected peers:

```javascript
function sendDataToAllPeers(data) {
    // Create the data structure
    var payload = {
        drawingData: data  // Your custom drawing data
    };
    
    // Send to all peers
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: payload },
        type: "pcs"  // Use peer connection for reliability
    }, "*");
}
```

### Sending to a Specific Peer by UUID

Use this approach to send data to a specific peer identified by UUID:

```javascript
function sendDataToPeer(data, targetUUID) {
    // Create the data structure
    var payload = {
        drawingData: data  // Your custom drawing data
    };
    
    // Send to specific UUID
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: payload },
        type: "pcs",
        UUID: targetUUID
    }, "*");
}
```

### Sending to Peers with Specific Labels

Use this approach to send data to all peers with a specific label:

```javascript
function sendDataByLabel(data, targetLabel) {
    // Create the data structure
    var payload = {
        drawingData: data  // Your custom drawing data
    };
    
    // Iterate through connected peers to find those with matching label
    var keys = Object.keys(connectedPeers);
    for (var i = 0; i < keys.length; i++) {
        try {
            var UUID = keys[i];
            var label = connectedPeers[UUID];
            if (label === targetLabel) {
                // Send to this specific peer
                iframe.contentWindow.postMessage({
                    sendData: { overlayNinja: payload },
                    type: "pcs",
                    UUID: UUID
                }, "*");
            }
        } catch (e) {
            console.error("Error sending to peer:", e);
        }
    }
}
```

### Sending to a Peer by StreamID

Use this approach when you know the streamID but not the UUID:

```javascript
function sendDataByStreamID(data, streamID) {
    // Create the data structure
    var payload = {
        drawingData: data  // Your custom drawing data
    };
    
    // Send to specific streamID
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: payload },
        type: "pcs",
        streamID: streamID
    }, "*");
}
```

## Drawing-Specific Implementation

For transmitting drawing data specifically, you'll need to:

1. Create a drawing canvas on your page
2. Capture drawing events
3. Format the data appropriately
4. Send the data to peers
5. Process and render received drawing data

Here's a simplified example:

```javascript
// 1. Set up a drawing canvas
const canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 480;
document.getElementById('drawing-container').appendChild(canvas);
const ctx = canvas.getContext('2d');

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentPath = [];

// 2. Capture drawing events
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    
    // Start a new path
    currentPath = [];
    // Normalize coordinates (0-1 range)
    const point = {
        x: lastX / canvas.width,
        y: lastY / canvas.height
    };
    currentPath.push(point);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    
    // Draw locally
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    
    // Store normalized point
    const point = {
        x: e.offsetX / canvas.width,
        y: e.offsetY / canvas.height
    };
    currentPath.push(point);
    
    [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener('mouseup', () => {
    if (isDrawing) {
        isDrawing = false;
        
        // 3 & 4. Format and send the path data
        if (currentPath.length > 1) {
            // Send the complete path
            sendDrawingData(currentPath);
        }
        
        // Reset current path
        currentPath = [];
    }
});

// Send drawing data to all peers
function sendDrawingData(pathPoints) {
    // Format the data as a path
    const drawingData = {
        t: 'path',  // type: path
        p: pathPoints
    };
    
    // Send to all peers
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: { drawingData: drawingData } },
        type: "pcs"
    }, "*");
}

// 5. Process received drawing data
function processReceivedData(data, senderUUID) {
    if (data.drawingData && data.drawingData.t === 'path') {
        const pathPoints = data.drawingData.p;
        
        // Render the received path
        if (pathPoints && pathPoints.length > 1) {
            ctx.beginPath();
            
            // Convert normalized coordinates back to canvas coordinates
            const startX = pathPoints[0].x * canvas.width;
            const startY = pathPoints[0].y * canvas.height;
            ctx.moveTo(startX, startY);
            
            for (let i = 1; i < pathPoints.length; i++) {
                const x = pathPoints[i].x * canvas.width;
                const y = pathPoints[i].y * canvas.height;
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
        }
    }
}
```

## Advanced Drawing Commands

You can implement special drawing commands like clear, undo, etc.:

```javascript
// Clear the drawing canvas
function clearDrawing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Send clear command to all peers
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: { drawingData: "clear" } },
        type: "pcs"
    }, "*");
}

// Undo last drawing action
function undoLastDrawing() {
    // Local undo logic...
    
    // Send undo command to all peers
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: { drawingData: "undo" } },
        type: "pcs"
    }, "*");
}
```

## Using VDO.Ninja's Built-in Drawing System

VDO.Ninja has a built-in drawing system you can leverage if you prefer not to implement your own:

```javascript
// Send drawing data using VDO.Ninja's built-in format
function sendVDONinjaDrawing(drawingData) {
    iframe.contentWindow.postMessage({
        draw: drawingData,  // Can be an object with drawing data or commands like "clear", "undo"
        type: "pcs",
        UUID: targetUUID  // Optional: specific target
    }, "*");
}

// Clear VDO.Ninja's drawing
function clearVDONinjaDrawing() {
    iframe.contentWindow.postMessage({
        draw: "clear",
        type: "pcs"
    }, "*");
}

// Undo last drawing action in VDO.Ninja
function undoVDONinjaDrawing() {
    iframe.contentWindow.postMessage({
        draw: "undo",
        type: "pcs"
    }, "*");
}
```

## Complete Example: Drawing Application

Here's a more complete example of a drawing application using the data channel:

```javascript
// Create interface elements
const container = document.createElement('div');
container.id = 'app-container';
document.body.appendChild(container);

// Create VDO.Ninja iframe
const iframe = document.createElement('iframe');
iframe.allow = "camera;microphone;fullscreen;display-capture;autoplay;";
iframe.src = "https://vdo.ninja/?room=drawing-demo&cleanoutput";
iframe.style.width = "640px";
iframe.style.height = "360px";
container.appendChild(iframe);

// Create drawing canvas
const canvasContainer = document.createElement('div');
canvasContainer.style.position = 'relative';
container.appendChild(canvasContainer);

const canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 360;
canvas.style.border = '1px solid black';
canvasContainer.appendChild(canvas);
const ctx = canvas.getContext('2d');
ctx.strokeStyle = 'red';
ctx.lineWidth = 3;
ctx.lineCap = 'round';

// Create controls
const controlsDiv = document.createElement('div');
controlsDiv.style.margin = '10px 0';
container.appendChild(controlsDiv);

const clearBtn = document.createElement('button');
clearBtn.textContent = 'Clear';
clearBtn.onclick = clearDrawing;
controlsDiv.appendChild(clearBtn);

const undoBtn = document.createElement('button');
undoBtn.textContent = 'Undo';
undoBtn.onclick = undoLastDrawing;
controlsDiv.appendChild(undoBtn);

// Track connected peers
const connectedPeers = {};
const drawingHistory = [];
let currentPath = [];
let isDrawing = false;

// Set up event handlers for the canvas
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDrawing);
canvas.addEventListener('mouseout', endDrawing);

function startDrawing(e) {
    isDrawing = true;
    const x = e.offsetX / canvas.width;
    const y = e.offsetY / canvas.height;
    currentPath = [{ x, y }];
    
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
}

function draw(e) {
    if (!isDrawing) return;
    
    const x = e.offsetX / canvas.width;
    const y = e.offsetY / canvas.height;
    currentPath.push({ x, y });
    
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
}

function endDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (currentPath.length > 1) {
        // Save path to history
        drawingHistory.push(currentPath);
        
        // Send path to peers
        sendDrawingData(currentPath);
    }
    
    currentPath = [];
}

function clearDrawing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory.length = 0;
    
    // Send clear command
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: { drawingData: "clear" } },
        type: "pcs"
    }, "*");
}

function undoLastDrawing() {
    if (drawingHistory.length === 0) return;
    
    // Remove the last path
    drawingHistory.pop();
    
    // Redraw everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingHistory.forEach(path => {
        if (path.length > 1) {
            ctx.beginPath();
            ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
            
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
            }
            
            ctx.stroke();
        }
    });
    
    // Send undo command
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: { drawingData: "undo" } },
        type: "pcs"
    }, "*");
}

function sendDrawingData(pathPoints) {
    const drawingData = {
        t: 'path',
        p: pathPoints,
        c: 'red',  // Color
        w: 3       // Width
    };
    
    iframe.contentWindow.postMessage({
        sendData: { overlayNinja: { drawingData: drawingData } },
        type: "pcs"
    }, "*");
}

// Set up the event listener
const eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
const eventer = window[eventMethod];
const messageEvent = eventMethod === "attachEvent" ? "onmessage" : "message";

eventer(messageEvent, function(e) {
    // Make sure the message is from our VDO.Ninja iframe
    if (e.source != iframe.contentWindow) return;
    
    // Process connection events
    if ("action" in e.data) {
        if (e.data.action === "guest-connected" && e.data.streamID) {
            connectedPeers[e.data.streamID] = e.data.value?.label || "Guest";
            console.log("Guest connected:", e.data.streamID, "Label:", connectedPeers[e.data.streamID]);
            
            // Send current drawing state to new peer
            if (drawingHistory.length > 0) {
                iframe.contentWindow.postMessage({
                    sendData: { overlayNinja: { drawingHistory: drawingHistory } },
                    type: "pcs",
                    UUID: e.data.streamID
                }, "*");
            }
        } 
        else if (e.data.action === "push-connection" && e.data.value === false && e.data.streamID) {
            console.log("Guest disconnected:", e.data.streamID);
            delete connectedPeers[e.data.streamID];
        }
    }
    
    // Handle received data
    if ("dataReceived" in e.data) {
        if ("overlayNinja" in e.data.dataReceived) {
            const data = e.data.dataReceived.overlayNinja;
            
            // Process drawing data
            if (data.drawingData) {
                if (data.drawingData === "clear") {
                    // Clear command
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawingHistory.length = 0;
                }
                else if (data.drawingData === "undo") {
                    // Undo command
                    if (drawingHistory.length > 0) {
                        drawingHistory.pop();
                        
                        // Redraw everything
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        drawingHistory.forEach(path => {
                            if (path.length > 1) {
                                ctx.beginPath();
                                ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
                                
                                for (let i = 1; i < path.length; i++) {
                                    ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
                                }
                                
                                ctx.stroke();
                            }
                        });
                    }
                }
                else if (data.drawingData.t === 'path') {
                    // New path
                    const pathPoints = data.drawingData.p;
                    
                    // Add to history
                    drawingHistory.push(pathPoints);
                    
                    // Draw it
                    if (pathPoints && pathPoints.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(pathPoints[0].x * canvas.width, pathPoints[0].y * canvas.height);
                        
                        for (let i = 1; i < pathPoints.length; i++) {
                            ctx.lineTo(pathPoints[i].x * canvas.width, pathPoints[i].y * canvas.height);
                        }
                        
                        ctx.stroke();
                    }
                }
            }
            
            // Handle initial state sync
            if (data.drawingHistory) {
                // Clear current state
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Apply all paths from history
                data.drawingHistory.forEach(path => {
                    if (path.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(path[0].x * canvas.width, path[0].y * canvas.height);
                        
                        for (let i = 1; i < path.length; i++) {
                            ctx.lineTo(path[i].x * canvas.width, path[i].y * canvas.height);
                        }
                        
                        ctx.stroke();
                    }
                });
                
                // Update local history
                drawingHistory.length = 0;
                drawingHistory.push(...data.drawingHistory);
            }
        }
    }
}, false);
```

## Best Practices

1. **Data Structure**: Use a clear, consistent data structure for your payloads
2. **Normalization**: Normalize canvas coordinates (0-1 range) to ensure consistent display across different screen sizes
3. **Throttling**: Consider throttling frequent events like mouse movements to reduce data transmission
4. **Error Handling**: Always include try/catch blocks when sending or processing data
5. **State Synchronization**: When new peers join, send them the current state
6. **UUID vs StreamID**: Use UUID for reliable targeting; StreamIDs change when connections restart
7. **Connection Status**: Monitor connection and disconnection events to maintain a list of active peers

## Common Types of Data to Send

- **Drawing Paths**: Arrays of points representing drawing strokes
- **Commands**: Clear, undo, change color, change brush size
- **Annotations**: Text or shapes to overlay on videos
- **Control Signals**: Camera directions, audio levels, recording commands
- **Chat Messages**: Text messages between users
- **Sensor Data**: Device orientation, location, acceleration

## Troubleshooting

- **Data Not Arriving**: Check that you're using the correct UUID or streamID
- **Timing Issues**: Ensure your iframe is fully loaded before sending messages
- **Cross-Origin Issues**: Make sure your security settings allow communication
- **Format Errors**: Verify your data structure matches what receivers expect
- **Performance Problems**: Large data payloads can cause lag; consider optimizing

By following this guide, you should be able to implement custom drawing tools or any other data-sharing features using VDO.Ninja's P2P data channels.