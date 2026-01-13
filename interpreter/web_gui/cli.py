#!/usr/bin/env python3
"""
Command-line interface to start the Open Interpreter Web GUI
"""

import sys
import argparse
from interpreter.web_gui import start_web_gui
from interpreter import interpreter


def main():
    """Main entry point for the web GUI CLI"""
    parser = argparse.ArgumentParser(
        description="Open Interpreter Web GUI - A full-featured web interface"
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host address to bind to (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port number to listen on (default: 8000)"
    )
    parser.add_argument(
        "--model",
        type=str,
        help="LLM model to use (e.g., gpt-4o, gpt-3.5-turbo)"
    )
    parser.add_argument(
        "--api-key",
        type=str,
        help="API key for the LLM service"
    )
    parser.add_argument(
        "--auto-run",
        action="store_true",
        help="Enable auto-run mode (execute code without confirmation)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Enable debug mode"
    )
    
    args = parser.parse_args()
    
    # Configure the interpreter with CLI arguments
    if args.model:
        interpreter.llm.model = args.model
    if args.api_key:
        interpreter.llm.api_key = args.api_key
    if args.auto_run:
        interpreter.auto_run = True
    if args.verbose:
        interpreter.verbose = True
    if args.debug:
        interpreter.debug = True
    
    # Start the web GUI
    try:
        start_web_gui(interpreter=interpreter, host=args.host, port=args.port)
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down Open Interpreter Web GUI...")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error starting web GUI: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
