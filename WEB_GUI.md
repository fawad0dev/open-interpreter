# 🌐 Open Interpreter Web GUI

A modern, full-featured web interface for Open Interpreter with complete support for **every single setting and configuration option**.

## 🎯 Features

### 💬 Interactive Chat Interface
- **Real-time streaming** responses from the AI
- **Code execution** with syntax highlighting  
- **Message history** with markdown support
- **File upload** capability
- Quick toggle actions for common settings

### ⚙️ Comprehensive Settings Management

#### LLM Configuration
- Model selection (GPT-4, GPT-3.5, Claude, local models, etc.)
- Temperature control
- API key management
- Custom API base URLs
- Token limits (max tokens, context window)

#### Execution Settings
- Auto-run mode (execute without confirmation)
- Verbose output
- Debug mode
- Offline mode
- Max output length
- Safe mode (off/ask/auto)

#### Display Settings
- Image handling (shrink images)
- Multi-line input
- Plain text display
- Active line highlighting

#### Conversation Settings
- Save conversation history
- Custom conversation filenames
- Contribution settings for AI improvement

#### Loop Settings
- Enable/disable loop mode
- Custom loop messages
- Configurable loop breakers

#### Advanced Settings
- Telemetry control
- OS control mode
- Text-to-speech (TTS)
- Computer API integration
- Skills management with custom paths
- Custom instructions
- System message override

### 📜 Conversation History Management
- Browse all saved conversations
- Load previous conversations
- Delete individual or all conversations
- Preview conversation content

### 📚 Built-in Documentation
- Getting started guide
- Feature overview
- Keyboard shortcuts reference
- Security notices
- External links (GitHub, Discord, Official Docs)

## 🚀 Quick Start

### Installation

The web GUI is included with Open Interpreter. No additional installation needed!

```bash
pip install open-interpreter
```

### Starting the GUI

```bash
# Default (runs on http://0.0.0.0:8000)
interpreter-gui

# Custom host and port
interpreter-gui --host 127.0.0.1 --port 5000

# With initial settings
interpreter-gui --model gpt-4o --api-key YOUR_KEY --auto-run
```

### Command-line Options

```
--host HOST         Host address (default: 0.0.0.0)
--port PORT         Port number (default: 8000)
--model MODEL       LLM model (e.g., gpt-4o, gpt-3.5-turbo)
--api-key KEY       API key for LLM service
--auto-run          Enable auto-run mode
--verbose           Enable verbose output
--debug             Enable debug mode
```

### Using in Python

```python
from interpreter import interpreter
from interpreter.web_gui import start_web_gui

# Start with default settings
start_web_gui()

# Or configure first
interpreter.llm.model = "gpt-4o"
interpreter.llm.api_key = "your-api-key"
interpreter.auto_run = True
start_web_gui(interpreter=interpreter, port=8000)
```

## 📸 Screenshots

### Chat Interface
![Chat Interface](https://github.com/user-attachments/assets/91dc7ad5-342b-45b5-af4f-b7007b96c241)

### Settings Page
![Settings Page](https://github.com/user-attachments/assets/a3cd8871-4f6f-425a-b8f6-e3e51826e5e1)

### Documentation Page
![Documentation](https://github.com/user-attachments/assets/fd11f55b-32d4-41c3-b2df-3d3cbca490bb)

## ⌨️ Keyboard Shortcuts

- `Ctrl+Enter` - Send message
- `Ctrl+N` - New chat
- `Ctrl+K` - Clear chat
- `Ctrl+S` - Save settings

## 🏗️ Architecture

### Technology Stack
- **Backend**: FastAPI with WebSocket support
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework dependencies)
- **Integration**: Direct integration with Open Interpreter core

### File Structure
```
interpreter/web_gui/
├── __init__.py              # Module initialization
├── server.py                # FastAPI server
├── cli.py                   # Command-line interface
├── README.md                # This file
├── templates/
│   └── index.html          # Main HTML template
└── static/
    ├── css/
    │   └── style.css       # Styling
    └── js/
        └── app.js          # Frontend JavaScript
```

## 🔒 Security

⚠️ **Important Security Notice**

Open Interpreter executes code on your machine. When using the web GUI:

1. **Review code before execution** - Use safe mode by default
2. **Be cautious with auto-run** - Only enable for trusted use cases
3. **Secure your network** - Don't expose to untrusted networks without authentication
4. **Use HTTPS in production** - Protect data in transit
5. **Keep API keys secure** - Never share or commit API keys

## 🤝 Contributing

Contributions are welcome! To add new features:

1. Update `templates/index.html` for UI changes
2. Add styles to `static/css/style.css`
3. Implement frontend logic in `static/js/app.js`
4. Add backend endpoints in `server.py`

## 📝 License

This web GUI is part of Open Interpreter and follows the same AGPL-3.0 license.

## 🔗 Links

- [GitHub Repository](https://github.com/OpenInterpreter/open-interpreter)
- [Official Documentation](https://docs.openinterpreter.com)
- [Discord Community](https://discord.gg/Hvz9Axh84z)

## 🐛 Troubleshooting

### GUI won't start
- Check if port is already in use
- Verify dependencies: `pip install -e .`
- Check console for error messages

### WebSocket connection fails
- Check firewall settings
- Verify WebSocket URL in browser console
- Ensure server is running

### Settings not saving
- Check file permissions for conversation history directory
- Verify API endpoint is responding

---

Made with ❤️ for the Open Interpreter community
