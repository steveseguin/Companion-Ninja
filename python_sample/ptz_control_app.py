#!/usr/bin/env python3
"""
VDO.Ninja PTZ Control App
A Python application to control Pan, Tilt, Zoom, Focus and Exposure of VDO.Ninja cameras via WebSocket API
"""

import asyncio
import json
import sys
import tkinter as tk
from tkinter import ttk, messagebox
import websockets
import threading
import time
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class PTZController:
    def __init__(self, api_key, api_server="wss://api.vdo.ninja:443"):
        self.api_key = api_key
        self.api_server = api_server
        self.websocket = None
        self.connected = False
        self.reconnect_flag = True
        self._lock = threading.Lock()
        
        # Start connection thread
        self.connection_thread = threading.Thread(target=self._maintain_connection)
        self.connection_thread.daemon = True
        self.connection_thread.start()
        
    def _maintain_connection(self):
        """Background thread to maintain WebSocket connection"""
        while self.reconnect_flag:
            if not self.connected:
                asyncio.run(self._connect())
            time.sleep(5)  # Check connection every 5 seconds
    
    async def _connect(self):
        """Connect to the WebSocket server"""
        try:
            self.websocket = await websockets.connect(self.api_server)
            # Join with API key
            await self.websocket.send(json.dumps({"join": self.api_key}))
            logging.info(f"Connected to {self.api_server} with API key: {self.api_key}")
            self.connected = True
            
            # Listen for messages
            await self._listen_for_messages()
        except Exception as e:
            logging.error(f"Connection error: {e}")
            self.connected = False
            if self.websocket:
                await self.websocket.close()
                self.websocket = None
    
    async def _listen_for_messages(self):
        """Listen for messages from the server"""
        try:
            while True:
                message = await self.websocket.recv()
                try:
                    data = json.loads(message)
                    logging.info(f"Received: {data}")
                except json.JSONDecodeError:
                    logging.error(f"Invalid JSON received: {message}")
        except websockets.exceptions.ConnectionClosed:
            logging.warning("Connection closed")
            self.connected = False
        except Exception as e:
            logging.error(f"Error in message listener: {e}")
            self.connected = False
    
    def send_command(self, action, value=None, value2=None, target=None):
        """Send a command to the server"""
        command = {"action": action}
        
        if value is not None:
            command["value"] = value
        
        if value2 is not None:
            command["value2"] = value2
            
        if target is not None:
            command["target"] = target
            
        # Use asyncio to send the command
        asyncio.run(self._send_command_async(command))
    
    async def _send_command_async(self, command):
        """Async method to send commands"""
        try:
            if not self.connected or not self.websocket:
                logging.warning("Not connected. Attempting to reconnect...")
                await self._connect()
                if not self.connected:
                    logging.error("Failed to connect. Command not sent.")
                    return
            
            logging.info(f"Sending command: {command}")
            with self._lock:  # Ensure thread safety when sending
                await self.websocket.send(json.dumps(command))
        except Exception as e:
            logging.error(f"Error sending command: {e}")
            self.connected = False
    
    def close(self):
        """Close the connection properly"""
        self.reconnect_flag = False
        if self.websocket:
            asyncio.run(self.websocket.close())
        logging.info("Connection closed")


class PTZApp(tk.Tk):
    def __init__(self):
        super().__init__()
        
        self.title("VDO.Ninja PTZ Controller")
        self.geometry("600x520")
        self.resizable(True, True)
        
        self.controller = None
        self.target_guest = None
        
        self._create_ui()
    
    def _create_ui(self):
        # Connection frame
        connection_frame = ttk.LabelFrame(self, text="Connection")
        connection_frame.pack(fill="x", padx=10, pady=10)
        
        ttk.Label(connection_frame, text="API Key:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.api_key_entry = ttk.Entry(connection_frame, width=30)
        self.api_key_entry.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        
        ttk.Label(connection_frame, text="Target Guest ID (optional):").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.target_entry = ttk.Entry(connection_frame, width=30)
        self.target_entry.grid(row=1, column=1, padx=5, pady=5, sticky="ew")
        
        self.connect_button = ttk.Button(connection_frame, text="Connect", command=self._connect)
        self.connect_button.grid(row=0, column=2, rowspan=2, padx=5, pady=5)
        
        # Tabs for different controls
        self.tabs = ttk.Notebook(self)
        self.tabs.pack(fill="both", expand=True, padx=10, pady=10)
        
        # PTZ Control Tab
        ptz_frame = ttk.Frame(self.tabs)
        self.tabs.add(ptz_frame, text="PTZ Controls")
        
        # Zoom control
        zoom_frame = ttk.LabelFrame(ptz_frame, text="Zoom Control")
        zoom_frame.pack(fill="x", padx=10, pady=10)
        
        ttk.Button(zoom_frame, text="Zoom In (+10%)", command=lambda: self._send_zoom(0.1)).grid(row=0, column=0, padx=5, pady=5)
        ttk.Button(zoom_frame, text="Zoom Out (-10%)", command=lambda: self._send_zoom(-0.1)).grid(row=0, column=1, padx=5, pady=5)
        
        ttk.Label(zoom_frame, text="Absolute Zoom:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.zoom_scale = ttk.Scale(zoom_frame, from_=0, to=1, orient="horizontal", command=self._send_absolute_zoom)
        self.zoom_scale.set(0.5)  # Default to middle position
        self.zoom_scale.grid(row=1, column=1, padx=5, pady=5, sticky="ew")
        
        # Pan/Tilt control
        pt_frame = ttk.LabelFrame(ptz_frame, text="Pan/Tilt Control")
        pt_frame.pack(fill="x", padx=10, pady=10)
        
        # Direction pad
        ttk.Button(pt_frame, text="↑", width=3, command=lambda: self._send_tilt(0.1)).grid(row=0, column=1, padx=5, pady=5)
        ttk.Button(pt_frame, text="←", width=3, command=lambda: self._send_pan(-0.1)).grid(row=1, column=0, padx=5, pady=5)
        ttk.Button(pt_frame, text="→", width=3, command=lambda: self._send_pan(0.1)).grid(row=1, column=2, padx=5, pady=5)
        ttk.Button(pt_frame, text="↓", width=3, command=lambda: self._send_tilt(-0.1)).grid(row=2, column=1, padx=5, pady=5)
        
        # Home position
        ttk.Button(pt_frame, text="Home", command=self._center_ptz).grid(row=1, column=1, padx=5, pady=5)
        
        # Focus control
        focus_frame = ttk.LabelFrame(ptz_frame, text="Focus Control")
        focus_frame.pack(fill="x", padx=10, pady=10)
        
        ttk.Button(focus_frame, text="Focus Near (-10%)", command=lambda: self._send_focus(-0.1)).grid(row=0, column=0, padx=5, pady=5)
        ttk.Button(focus_frame, text="Focus Far (+10%)", command=lambda: self._send_focus(0.1)).grid(row=0, column=1, padx=5, pady=5)
        
        ttk.Label(focus_frame, text="Absolute Focus:").grid(row=1, column=0, padx=5, pady=5, sticky="w")
        self.focus_scale = ttk.Scale(focus_frame, from_=0, to=1, orient="horizontal", command=self._send_absolute_focus)
        self.focus_scale.set(0.5)  # Default to middle position
        self.focus_scale.grid(row=1, column=1, padx=5, pady=5, sticky="ew")
        
        # Exposure control
        exposure_frame = ttk.LabelFrame(ptz_frame, text="Exposure Control")
        exposure_frame.pack(fill="x", padx=10, pady=10)
        
        ttk.Label(exposure_frame, text="Exposure:").grid(row=0, column=0, padx=5, pady=5, sticky="w")
        self.exposure_scale = ttk.Scale(exposure_frame, from_=0, to=1, orient="horizontal", command=self._send_exposure)
        self.exposure_scale.set(0.5)  # Default to middle position
        self.exposure_scale.grid(row=0, column=1, padx=5, pady=5, sticky="ew")
        
        # Presets Tab
        presets_frame = ttk.Frame(self.tabs)
        self.tabs.add(presets_frame, text="Presets")
        
        # Create some preset buttons
        preset_values = [
            ("Wide Angle", lambda: self._send_preset(zoom=0.1, pan=0, tilt=0)),
            ("Close Up", lambda: self._send_preset(zoom=0.9, pan=0, tilt=0)),
            ("Left Side", lambda: self._send_preset(zoom=0.5, pan=-0.5, tilt=0)),
            ("Right Side", lambda: self._send_preset(zoom=0.5, pan=0.5, tilt=0)),
            ("Top View", lambda: self._send_preset(zoom=0.5, pan=0, tilt=0.5)),
            ("Bottom View", lambda: self._send_preset(zoom=0.5, pan=0, tilt=-0.5)),
        ]
        
        row = 0
        for preset_name, preset_func in preset_values:
            ttk.Button(presets_frame, text=preset_name, command=preset_func).grid(
                row=row, column=0, padx=10, pady=10, sticky="ew")
            row += 1
        
        # Status bar
        self.status_var = tk.StringVar()
        self.status_var.set("Not connected")
        self.status_bar = ttk.Label(self, textvariable=self.status_var, relief="sunken", anchor="w")
        self.status_bar.pack(side="bottom", fill="x", padx=10, pady=5)
        
        # Disable control elements until connected
        self._set_controls_state("disabled")
    
    def _connect(self):
        api_key = self.api_key_entry.get().strip()
        if not api_key:
            messagebox.showerror("Error", "Please enter an API Key")
            return
        
        try:
            self.controller = PTZController(api_key)
            self.target_guest = self.target_entry.get().strip() or None
            
            self.status_var.set(f"Connected to API with key: {api_key}")
            self.connect_button.configure(text="Disconnect", command=self._disconnect)
            self._set_controls_state("normal")
            
        except Exception as e:
            messagebox.showerror("Connection Error", str(e))
            self.status_var.set(f"Connection error: {str(e)}")
    
    def _disconnect(self):
        if self.controller:
            self.controller.close()
            self.controller = None
        
        self.status_var.set("Disconnected")
        self.connect_button.configure(text="Connect", command=self._connect)
        self._set_controls_state("disabled")
    
    def _set_controls_state(self, state):
        """Enable or disable all control elements"""
        for tab in range(self.tabs.index("end")):
            for child in self.tabs.winfo_children()[tab].winfo_children():
                for widget in child.winfo_children():
                    if isinstance(widget, (ttk.Button, ttk.Scale)):
                        widget.configure(state=state)
    
    def _send_zoom(self, value):
        """Send relative zoom command"""
        if self.controller:
            self.controller.send_command("zoom", value=value, target=self.target_guest)
            self.status_var.set(f"Sent zoom command: {value}")
    
    def _send_absolute_zoom(self, value):
        """Send absolute zoom command"""
        if self.controller:
            # Scale ranges from 0 to 1
            value = float(value)
            self.controller.send_command("zoom", value=value, value2="abs", target=self.target_guest)
            self.status_var.set(f"Sent absolute zoom command: {value}")
    
    def _send_pan(self, value):
        """Send pan command"""
        if self.controller:
            self.controller.send_command("pan", value=value, target=self.target_guest)
            self.status_var.set(f"Sent pan command: {value}")
    
    def _send_tilt(self, value):
        """Send tilt command"""
        if self.controller:
            self.controller.send_command("tilt", value=value, target=self.target_guest)
            self.status_var.set(f"Sent tilt command: {value}")
    
    def _send_focus(self, value):
        """Send relative focus command"""
        if self.controller:
            self.controller.send_command("focus", value=value, target=self.target_guest)
            self.status_var.set(f"Sent focus command: {value}")
    
    def _send_absolute_focus(self, value):
        """Send absolute focus command"""
        if self.controller:
            # Scale ranges from 0 to 1
            value = float(value)
            self.controller.send_command("focus", value=value, target=self.target_guest)
            self.status_var.set(f"Sent absolute focus command: {value}")
    
    def _send_exposure(self, value):
        """Send exposure command"""
        if self.controller:
            # Scale ranges from 0 to 1
            value = float(value)
            self.controller.send_command("exposure", value=value, target=self.target_guest)
            self.status_var.set(f"Sent exposure command: {value}")
    
    def _center_ptz(self):
        """Center the PTZ camera"""
        if self.controller:
            # Set pan and tilt to 0 (center)
            self.controller.send_command("pan", value=0, target=self.target_guest)
            self.controller.send_command("tilt", value=0, target=self.target_guest)
            self.status_var.set("Centered PTZ camera")
    
    def _send_preset(self, zoom, pan, tilt):
        """Send preset position commands"""
        if self.controller:
            # Send all commands in sequence
            self.controller.send_command("zoom", value=zoom, value2="abs", target=self.target_guest)
            self.controller.send_command("pan", value=pan, target=self.target_guest)
            self.controller.send_command("tilt", value=tilt, target=self.target_guest)
            self.status_var.set(f"Applied preset: zoom={zoom}, pan={pan}, tilt={tilt}")
    
    def on_closing(self):
        """Handle window closing"""
        if self.controller:
            self.controller.close()
        self.destroy()


if __name__ == "__main__":
    app = PTZApp()
    app.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.mainloop()
