#!/usr/bin/env python3
"""
VDO.Ninja PTZ Control Console App
A command-line Python application to control Pan, Tilt, Zoom, Focus and Exposure of VDO.Ninja cameras
"""

import asyncio
import json
import sys
import websockets
import logging
import argparse
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class PTZController:
    def __init__(self, api_key, api_server="wss://api.vdo.ninja:443"):
        self.api_key = api_key
        self.api_server = api_server
        self.websocket = None
        self.connected = False
        
    async def connect(self):
        """Connect to the WebSocket server"""
        try:
            self.websocket = await websockets.connect(self.api_server)
            # Join with API key
            await self.websocket.send(json.dumps({"join": self.api_key}))
            logging.info(f"Connected to {self.api_server} with API key: {self.api_key}")
            self.connected = True
            return True
        except Exception as e:
            logging.error(f"Connection error: {e}")
            self.connected = False
            if self.websocket:
                await self.websocket.close()
                self.websocket = None
            return False
    
    async def send_command(self, action, value=None, value2=None, target=None):
        """Send a command to the server"""
        if not self.connected:
            if not await self.connect():
                logging.error("Failed to connect. Command not sent.")
                return False
            
        command = {"action": action}
        
        if value is not None:
            command["value"] = value
        
        if value2 is not None:
            command["value2"] = value2
            
        if target is not None:
            command["target"] = target
            
        try:
            logging.info(f"Sending command: {command}")
            await self.websocket.send(json.dumps(command))
            
            # Wait for response
            try:
                response = await asyncio.wait_for(self.websocket.recv(), timeout=2.0)
                logging.info(f"Response: {response}")
            except asyncio.TimeoutError:
                logging.warning("No response received (timeout)")
            
            return True
        except Exception as e:
            logging.error(f"Error sending command: {e}")
            self.connected = False
            return False
    
    async def close(self):
        """Close the connection properly"""
        if self.websocket:
            await self.websocket.close()
            logging.info("Connection closed")
            self.connected = False


async def main():
    parser = argparse.ArgumentParser(description='Control VDO.Ninja camera PTZ functions via WebSocket API')
    parser.add_argument('--api-key', '-k', required=True, help='Your VDO.Ninja API key')
    parser.add_argument('--target', '-t', help='Target guest ID (optional)')
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Zoom commands
    zoom_parser = subparsers.add_parser('zoom', help='Control camera zoom')
    zoom_parser.add_argument('value', type=float, help='Zoom value (0.0-1.0 for absolute, -1.0-1.0 for relative)')
    zoom_parser.add_argument('--absolute', '-a', action='store_true', help='Use absolute zoom value')
    
    # Pan commands
    pan_parser = subparsers.add_parser('pan', help='Control camera pan (left/right)')
    pan_parser.add_argument('value', type=float, help='Pan value (-1.0 to 1.0)')
    
    # Tilt commands
    tilt_parser = subparsers.add_parser('tilt', help='Control camera tilt (up/down)')
    tilt_parser.add_argument('value', type=float, help='Tilt value (-1.0 to 1.0)')
    
    # Focus commands
    focus_parser = subparsers.add_parser('focus', help='Control camera focus')
    focus_parser.add_argument('value', type=float, help='Focus value (0.0-1.0 for absolute, -1.0-1.0 for relative)')
    
    # Exposure commands
    exposure_parser = subparsers.add_parser('exposure', help='Control camera exposure')
    exposure_parser.add_argument('value', type=float, help='Exposure value (0.0-1.0)')
    
    # Preset commands
    preset_parser = subparsers.add_parser('preset', help='Apply camera preset')
    preset_parser.add_argument('name', choices=['wide', 'closeup', 'left', 'right', 'center', 'top', 'bottom'],
                             help='Preset name')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    controller = PTZController(args.api_key)
    await controller.connect()
    
    if args.command == 'zoom':
        if args.absolute:
            await controller.send_command('zoom', value=args.value, value2='abs', target=args.target)
        else:
            await controller.send_command('zoom', value=args.value, target=args.target)
    
    elif args.command == 'pan':
        await controller.send_command('pan', value=args.value, target=args.target)
    
    elif args.command == 'tilt':
        await controller.send_command('tilt', value=args.value, target=args.target)
    
    elif args.command == 'focus':
        await controller.send_command('focus', value=args.value, target=args.target)
    
    elif args.command == 'exposure':
        await controller.send_command('exposure', value=args.value, target=args.target)
    
    elif args.command == 'preset':
        if args.name == 'wide':
            await controller.send_command('zoom', value=0.1, value2='abs', target=args.target)
            await controller.send_command('pan', value=0, target=args.target)
            await controller.send_command('tilt', value=0, target=args.target)
        
        elif args.name == 'closeup':
            await controller.send_command('zoom', value=0.9, value2='abs', target=args.target)
            await controller.send_command('pan', value=0, target=args.target)
            await controller.send_command('tilt', value=0, target=args.target)
        
        elif args.name == 'left':
            await controller.send_command('zoom', value=0.5, value2='abs', target=args.target)
            await controller.send_command('pan', value=-0.5, target=args.target)
            await controller.send_command('tilt', value=0, target=args.target)
        
        elif args.name == 'right':
            await controller.send_command('zoom', value=0.5, value2='abs', target=args.target)
            await controller.send_command('pan', value=0.5, target=args.target)
            await controller.send_command('tilt', value=0, target=args.target)
        
        elif args.name == 'center':
            await controller.send_command('pan', value=0, target=args.target)
            await controller.send_command('tilt', value=0, target=args.target)
        
        elif args.name == 'top':
            await controller.send_command('zoom', value=0.5, value2='abs', target=args.target)
            await controller.send_command('pan', value=0, target=args.target)
            await controller.send_command('tilt', value=0.5, target=args.target)
        
        elif args.name == 'bottom':
            await controller.send_command('zoom', value=0.5, value2='abs', target=args.target)
            await controller.send_command('pan', value=0, target=args.target)
            await controller.send_command('tilt', value=-0.5, target=args.target)
    
    # Wait a moment to ensure the command is sent before disconnecting
    await asyncio.sleep(1)
    await controller.close()

if __name__ == "__main__":
    asyncio.run(main())
