# VDO.Ninja PTZ Control Application

This Python application provides a graphical user interface to control Pan, Tilt, Zoom, Focus, and Exposure functions on VDO.Ninja through its WebSocket API.

## Features

- Connect to VDO.Ninja API using a WebSocket connection
- Control pan, tilt, zoom, focus, and exposure settings
- Support for both relative and absolute adjustments
- Preset positions for quick camera positioning
- Optional targeting of specific guests (when used as a director)
- Automatic reconnection when connection is lost

## Requirements

- Python 3.6+
- Required packages:
  - websockets
  - asyncio
  - tkinter (typically included with Python)

## Installation

1. Clone or download this repository
2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Usage

1. Run the application:

```bash
python ptz_control_app.py
```

2. Enter your VDO.Ninja API key
   - This is the same value you use with the `&api=XXXXX` parameter in your VDO.Ninja URL
   
3. (Optional) Enter a target guest ID if you want to control a specific guest's camera
   - You can use either the guest slot number (1-99) or the guest's stream ID
   - Leave empty to control your own camera

4. Click "Connect" to establish the WebSocket connection

5. Use the controls to adjust camera settings:
   - Zoom: Use the buttons for relative zoom or the slider for absolute zoom level
   - Pan/Tilt: Use the directional buttons to adjust camera position
   - Focus: Use the buttons for relative focus or the slider for absolute focus
   - Exposure: Use the slider to adjust the exposure level

6. Use the Presets tab to quickly position the camera to predefined settings

## Notes

- Your camera must support PTZ capabilities through the browser's MediaDevices API
- Ensure your VDO.Ninja instance is running version that supports these camera control commands
- Connection status is displayed in the status bar at the bottom of the application

## Troubleshooting

- If controls are not working, check that your camera supports the requested functions
- Verify that your API key is correct
- Check that the WebSocket connection is established (status bar should show "Connected")
- Look for error messages in the console output

## License

This project is licensed under the MIT License - see the LICENSE file for details.
