# Open Interpreter Web GUI

A full-featured web interface for Open Interpreter with support for every single setting and configuration option.

## Features

### 💬 Chat Interface
- Real-time streaming chat with the AI
- Code execution with syntax highlighting
- Message history with markdown support
- File upload support
- Quick actions for common settings (Auto Run, Verbose, Debug)

### ⚙️ Complete Settings Control
- **LLM Configuration**: Model selection, temperature, API keys, base URLs, token limits
- **Execution Settings**: Auto-run, verbose, debug, offline mode, output limits, safe mode
- **Display Settings**: Image handling, multi-line input, text display options
- **Conversation Settings**: History management, contribution settings
- **Loop Settings**: Loop mode with custom messages and breakers
- **Advanced Settings**: Telemetry, OS mode, TTS, computer API, skills management

### 📜 Conversation History
- Browse all saved conversations
- Load previous conversations
- Delete individual or all conversations
- Preview conversation content

### 📚 Documentation
- Built-in documentation
- Getting started guide
- Feature overview
- Keyboard shortcuts
- Security notices

## Installation

The web GUI is included with Open Interpreter. No additional installation required.

## Usage

### Start the Web GUI

```bash
# Default (runs on http://0.0.0.0:8000)
interpreter-gui

# Custom host and port
interpreter-gui --host 127.0.0.1 --port 5000

# With initial settings
interpreter-gui --model gpt-4o --auto-run --verbose
```

### Command-line Options

```
--host HOST         Host address to bind to (default: 0.0.0.0)
--port PORT         Port number to listen on (default: 8000)
--model MODEL       LLM model to use (e.g., gpt-4o)
--api-key KEY       API key for the LLM service
--auto-run          Enable auto-run mode
--verbose           Enable verbose output
--debug             Enable debug mode
```

### Using in Python

```python
from interpreter import interpreter
from interpreter.web_gui import start_web_gui

# Start with default interpreter
start_web_gui()

# Or configure the interpreter first
interpreter.llm.model = "gpt-4o"
interpreter.auto_run = True
start_web_gui(interpreter=interpreter, port=8000)
```

## Interface Overview

### Chat Page
The main interface for interacting with Open Interpreter:
- Send messages to the AI
- View streaming responses
- Execute code with confirmation (unless auto-run is enabled)
- Upload files for processing
- Toggle quick settings

### Settings Page
Complete control over all Open Interpreter settings:
- Configure your LLM (model, API keys, parameters)
- Set execution behavior
- Customize display options
- Manage conversation history
- Configure loop mode
- Access advanced features

### History Page
Manage your conversation history:
- View all saved conversations
- Load previous conversations
- Delete unwanted conversations
- Search through conversation previews

### Documentation Page
- Learn about Open Interpreter features
- View keyboard shortcuts
- Read security notices
- Access external resources

## Keyboard Shortcuts

- `Ctrl+Enter` - Send message
- `Ctrl+N` - New chat
- `Ctrl+K` - Clear chat
- `Ctrl+S` - Save settings

## Security

⚠️ **Important Security Notice**

Open Interpreter executes code on your machine. When using the web GUI:

1. Always review code before execution (use safe mode)
2. Be cautious with auto-run mode
3. Don't expose the web interface to untrusted networks without proper authentication
4. Use HTTPS in production environments
5. Keep your API keys secure

## Architecture

The web GUI consists of:

- **Frontend**: Modern HTML/CSS/JavaScript interface
- **Backend**: FastAPI server with WebSocket support
- **Integration**: Direct integration with Open Interpreter core

### Technology Stack

- FastAPI for the web server
- WebSockets for real-time communication
- HTML/CSS/JavaScript for the frontend
- No additional dependencies beyond Open Interpreter core

## Development

### File Structure

```
interpreter/web_gui/
├── __init__.py          # Module initialization
├── server.py            # FastAPI server implementation
├── cli.py               # Command-line interface
├── templates/
│   └── index.html       # Main HTML template
└── static/
    ├── css/
    │   └── style.css    # Styling
    └── js/
        └── app.js       # Frontend JavaScript
```

### Extending the GUI

To add new features:

1. Update the HTML template in `templates/index.html`
2. Add styles to `static/css/style.css`
3. Implement frontend logic in `static/js/app.js`
4. Add backend endpoints in `server.py`

## Troubleshooting

### GUI won't start
- Check if the port is already in use
- Verify all dependencies are installed: `pip install -e .`
- Check for error messages in the console

### WebSocket connection fails
- Ensure your firewall allows the connection
- Check browser console for errors
- Verify the WebSocket URL is correct

### Settings not saving
- Check file permissions for the conversation history directory
- Verify the settings API endpoint is responding

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This web GUI is part of Open Interpreter and follows the same AGPL license.
