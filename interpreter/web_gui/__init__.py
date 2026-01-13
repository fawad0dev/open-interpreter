"""
Open Interpreter Web GUI Module

This module provides a full-featured web interface for Open Interpreter
with support for all settings and configuration options.
"""

from .server import WebGUIServer, start_web_gui

__all__ = ["WebGUIServer", "start_web_gui"]
