# VDO.Ninja PTZ Control Console App

This Python command-line application allows you to control Pan, Tilt, Zoom, Focus, and Exposure functions on VDO.Ninja through its WebSocket API.

## Features

- Connect to VDO.Ninja API using a WebSocket connection
- Control pan, tilt, zoom, focus, and exposure settings
- Support for both relative and absolute adjustments
- Preset positions for quick camera positioning
- Optional targeting of specific guests (when used as a director)

## Requirements

- Python 3.6+
- Required packages:
  - websockets
  - asyncio

## Installation

1. Clone or download this repository
2. Install the required packages:

```bash
pip install -r requirements.txt
```

## Usage

Make sure VDO.Ninja is running in the browser with API enabled:

```
In chrome: https://vdo.ninja/?api=YOUR_API_KEY&ptz&webcam&autostarto
```

The application provides a command-line interface to send PTZ commands:

```bash
python ptz_console.py --api-key YOUR_API_KEY [--target TARGET_ID] COMMAND [ARGUMENTS]
```

### Parameters

- `--api-key`, `-k`: Your VDO.Ninja API key (required)
- `--target`, `-t`: Target guest ID (optional, use to control a specific guest's camera)

### Commands

1. **Zoom Control**:
   ```bash
   python ptz_console.py --api-key YOUR_API_KEY zoom VALUE [--absolute]
   ```
   - `VALUE`: Zoom value (0.0-1.0 for absolute, -1.0-1.0 for relative)
   - `--absolute`, `-a`: Use absolute zoom value instead of relative

2. **Pan Control**:
   ```bash
   python ptz_console.py --api-key YOUR_API_KEY pan VALUE
   ```
   - `VALUE`: Pan value (-1.0 to 1.0, negative values pan left)

3. **Tilt Control**:
   ```bash
   python ptz_console.py --api-key YOUR_API_KEY tilt VALUE
   ```
   - `VALUE`: Tilt value (-1.0 to 1.0, negative values tilt down)

4. **Focus Control**:
   ```bash
   python ptz_console.py --api-key YOUR_API_KEY focus VALUE
   ```
   - `VALUE`: Focus value (0.0-1.0)

5. **Exposure Control**:
   ```bash
   python ptz_console.py --api-key YOUR_API_KEY exposure VALUE
   ```
   - `VALUE`: Exposure value (0.0-1.0)

6. **Preset Positions**:
   ```bash
   python ptz_console.py --api-key YOUR_API_KEY preset NAME
   ```
   - `NAME`: One of: wide, closeup, left, right, center, top, bottom

### Examples

Zoom in slightly (relative):
```bash
python ptz_console.py --api-key abc123 zoom 0.1
```

Set absolute zoom to 75%:
```bash
python ptz_console.py --api-key abc123 zoom 0.75 --absolute
```

Pan to the left:
```bash
python ptz_console.py --api-key abc123 pan -0.3
```

Apply the "closeup" preset:
```bash
python ptz_console.py --api-key abc123 preset closeup
```
## Notes

- Your camera must support PTZ capabilities through the browser's MediaDevices API
- Ensure your VDO.Ninja instance is running a version that supports these camera control commands
- The console app provides detailed logging to help troubleshoot any issues

## Sample usage console output:

Assuming I have `https://vdo.ninja/alpha/?api=steve123&ptz&webcam` opened in Chrome and started:
```
C:\Users\steve\Code\Companion-Ninja\python_sample>python ptz_console.py --api-key steve123 zoom 0.1 --absolute
2025-03-08 14:07:12,304 - INFO - Connected to wss://api.vdo.ninja:443 with API key: steve123
2025-03-08 14:07:12,304 - INFO - Sending command: {'action': 'zoom', 'value': 0.1, 'value2': 'abs'}
2025-03-08 14:07:12,398 - INFO - Response: {"callback":{"action":"zoom","value":0.1,"value2":"abs","result":{"zoom":0.1,"absolute":true}}}
2025-03-08 14:07:13,444 - INFO - Connection closed

C:\Users\steve\Code\Companion-Ninja\python_sample>
```
And the camera changes the zoom to about 10% zoomed in.
