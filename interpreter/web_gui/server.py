"""
Web GUI Server for Open Interpreter
This module provides a FastAPI-based web interface with full support for all Open Interpreter features.
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from starlette.middleware.cors import CORSMiddleware

from ..core.core import OpenInterpreter
from ..terminal_interface.utils.local_storage_path import get_storage_path


class WebGUIServer:
    def __init__(self, interpreter: Optional[OpenInterpreter] = None):
        """Initialize the web GUI server"""
        self.app = FastAPI(title="Open Interpreter Web GUI", version="0.4.3")
        self.interpreter = interpreter or OpenInterpreter()
        self.active_connections: List[WebSocket] = []
        self.current_settings = self._get_default_settings()
        
        # Setup middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Setup routes
        self._setup_routes()
        
        # Setup static files
        static_path = Path(__file__).parent / "static"
        templates_path = Path(__file__).parent / "templates"
        
        if static_path.exists():
            self.app.mount("/static", StaticFiles(directory=str(static_path)), name="static")
        
        self.templates_path = templates_path
    
    def _get_default_settings(self) -> Dict[str, Any]:
        """Get default settings from the interpreter"""
        return {
            # LLM settings
            "model": self.interpreter.llm.model,
            "temperature": self.interpreter.llm.temperature,
            "api_key": self.interpreter.llm.api_key or "",
            "api_base": self.interpreter.llm.api_base or "",
            "max_tokens": self.interpreter.llm.max_tokens,
            "context_window": self.interpreter.llm.context_window,
            
            # Execution settings
            "auto_run": self.interpreter.auto_run,
            "verbose": self.interpreter.verbose,
            "debug": self.interpreter.debug,
            "offline": self.interpreter.offline,
            "max_output": self.interpreter.max_output,
            "safe_mode": self.interpreter.safe_mode,
            
            # Display settings
            "shrink_images": self.interpreter.shrink_images,
            "multi_line": self.interpreter.multi_line,
            "plain_text_display": self.interpreter.plain_text_display,
            "highlight_active_line": self.interpreter.highlight_active_line,
            
            # Conversation settings
            "conversation_history": self.interpreter.conversation_history,
            "conversation_filename": self.interpreter.conversation_filename or "",
            "contribute_conversation": self.interpreter.contribute_conversation,
            
            # Loop settings
            "loop": self.interpreter.loop,
            "loop_message": self.interpreter.loop_message,
            "loop_breakers": self.interpreter.loop_breakers,
            
            # Advanced settings
            "disable_telemetry": self.interpreter.disable_telemetry,
            "os": self.interpreter.os,
            "speak_messages": self.interpreter.speak_messages,
            "sync_computer": self.interpreter.sync_computer,
            "import_computer_api": self.interpreter.computer.import_computer_api,
            "import_skills": self.interpreter.computer.import_skills,
            "skills_path": self.interpreter.computer.skills.path if hasattr(self.interpreter.computer, 'skills') else "",
            "custom_instructions": self.interpreter.custom_instructions,
            "system_message": self.interpreter.system_message,
        }
    
    def _apply_settings(self, settings: Dict[str, Any]):
        """Apply settings to the interpreter"""
        # LLM settings
        if "model" in settings:
            self.interpreter.llm.model = settings["model"]
        if "temperature" in settings:
            self.interpreter.llm.temperature = settings["temperature"]
        if "api_key" in settings and settings["api_key"]:
            self.interpreter.llm.api_key = settings["api_key"]
        if "api_base" in settings and settings["api_base"]:
            self.interpreter.llm.api_base = settings["api_base"]
        if "max_tokens" in settings:
            self.interpreter.llm.max_tokens = settings["max_tokens"]
        if "context_window" in settings:
            self.interpreter.llm.context_window = settings["context_window"]
        
        # Execution settings
        if "auto_run" in settings:
            self.interpreter.auto_run = settings["auto_run"]
        if "verbose" in settings:
            self.interpreter.verbose = settings["verbose"]
        if "debug" in settings:
            self.interpreter.debug = settings["debug"]
        if "offline" in settings:
            self.interpreter.offline = settings["offline"]
        if "max_output" in settings:
            self.interpreter.max_output = settings["max_output"]
        if "safe_mode" in settings:
            self.interpreter.safe_mode = settings["safe_mode"]
        
        # Display settings
        if "shrink_images" in settings:
            self.interpreter.shrink_images = settings["shrink_images"]
        if "multi_line" in settings:
            self.interpreter.multi_line = settings["multi_line"]
        if "plain_text_display" in settings:
            self.interpreter.plain_text_display = settings["plain_text_display"]
        if "highlight_active_line" in settings:
            self.interpreter.highlight_active_line = settings["highlight_active_line"]
        
        # Conversation settings
        if "conversation_history" in settings:
            self.interpreter.conversation_history = settings["conversation_history"]
        if "conversation_filename" in settings:
            self.interpreter.conversation_filename = settings["conversation_filename"] or None
        if "contribute_conversation" in settings:
            self.interpreter.contribute_conversation = settings["contribute_conversation"]
        
        # Loop settings
        if "loop" in settings:
            self.interpreter.loop = settings["loop"]
        if "loop_message" in settings:
            self.interpreter.loop_message = settings["loop_message"]
        if "loop_breakers" in settings:
            self.interpreter.loop_breakers = settings["loop_breakers"]
        
        # Advanced settings
        if "disable_telemetry" in settings:
            self.interpreter.disable_telemetry = settings["disable_telemetry"]
        if "os" in settings:
            self.interpreter.os = settings["os"]
        if "speak_messages" in settings:
            self.interpreter.speak_messages = settings["speak_messages"]
        if "sync_computer" in settings:
            self.interpreter.sync_computer = settings["sync_computer"]
        if "import_computer_api" in settings:
            self.interpreter.computer.import_computer_api = settings["import_computer_api"]
        if "import_skills" in settings:
            self.interpreter.computer.import_skills = settings["import_skills"]
        if "skills_path" in settings and settings["skills_path"]:
            self.interpreter.computer.skills.path = settings["skills_path"]
        if "custom_instructions" in settings:
            self.interpreter.custom_instructions = settings["custom_instructions"]
        if "system_message" in settings:
            self.interpreter.system_message = settings["system_message"]
        
        self.current_settings = settings
    
    def _setup_routes(self):
        """Setup all API routes"""
        
        @self.app.get("/", response_class=HTMLResponse)
        async def root():
            """Serve the main HTML page"""
            index_path = self.templates_path / "index.html"
            if index_path.exists():
                return FileResponse(str(index_path))
            return HTMLResponse("<h1>Open Interpreter Web GUI</h1><p>Template not found</p>")
        
        @self.app.websocket("/ws")
        async def websocket_endpoint(websocket: WebSocket):
            """WebSocket endpoint for real-time communication"""
            await websocket.accept()
            self.active_connections.append(websocket)
            
            try:
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    
                    if message["type"] == "chat":
                        await self._handle_chat_message(websocket, message)
                    elif message["type"] == "execute":
                        await self._handle_execute_code(websocket, message)
                    elif message["type"] == "update_settings":
                        self._apply_settings(message["settings"])
                        await websocket.send_json({"type": "status", "content": "Settings updated"})
                    elif message["type"] == "new_chat":
                        self.interpreter.messages = []
                        await websocket.send_json({"type": "status", "content": "New chat started"})
                    elif message["type"] == "clear_chat":
                        self.interpreter.messages = []
                        await websocket.send_json({"type": "status", "content": "Chat cleared"})
                    
            except WebSocketDisconnect:
                self.active_connections.remove(websocket)
            except Exception as e:
                await websocket.send_json({"type": "error", "content": str(e)})
                self.active_connections.remove(websocket)
        
        @self.app.get("/api/settings")
        async def get_settings():
            """Get current settings"""
            return JSONResponse(self.current_settings)
        
        @self.app.post("/api/settings")
        async def save_settings(settings: Dict[str, Any]):
            """Save and apply settings"""
            try:
                self._apply_settings(settings)
                return JSONResponse({"success": True, "message": "Settings saved"})
            except Exception as e:
                return JSONResponse({"success": False, "error": str(e)}, status_code=500)
        
        @self.app.post("/api/settings/reset")
        async def reset_settings():
            """Reset settings to default"""
            try:
                self.interpreter = OpenInterpreter()
                self.current_settings = self._get_default_settings()
                return JSONResponse({"success": True, "message": "Settings reset"})
            except Exception as e:
                return JSONResponse({"success": False, "error": str(e)}, status_code=500)
        
        @self.app.get("/api/history")
        async def get_history():
            """Get conversation history"""
            try:
                history_path = Path(self.interpreter.conversation_history_path)
                if not history_path.exists():
                    return JSONResponse({"conversations": []})
                
                conversations = []
                for file in history_path.glob("*.json"):
                    try:
                        with open(file, 'r') as f:
                            messages = json.load(f)
                            conversations.append({
                                "filename": file.name,
                                "date": file.stat().st_mtime,
                                "messages": messages[:5]  # First 5 messages for preview
                            })
                    except:
                        continue
                
                # Sort by date, newest first
                conversations.sort(key=lambda x: x["date"], reverse=True)
                
                return JSONResponse({"conversations": conversations})
            except Exception as e:
                return JSONResponse({"error": str(e)}, status_code=500)
        
        @self.app.get("/api/history/{filename}")
        async def load_conversation(filename: str):
            """Load a specific conversation"""
            try:
                history_path = Path(self.interpreter.conversation_history_path) / filename
                if not history_path.exists():
                    raise HTTPException(status_code=404, detail="Conversation not found")
                
                with open(history_path, 'r') as f:
                    messages = json.load(f)
                
                self.interpreter.messages = messages
                return JSONResponse({"success": True, "messages": messages})
            except Exception as e:
                return JSONResponse({"success": False, "error": str(e)}, status_code=500)
        
        @self.app.delete("/api/history/{filename}")
        async def delete_conversation(filename: str):
            """Delete a specific conversation"""
            try:
                history_path = Path(self.interpreter.conversation_history_path) / filename
                if history_path.exists():
                    history_path.unlink()
                return JSONResponse({"success": True})
            except Exception as e:
                return JSONResponse({"success": False, "error": str(e)}, status_code=500)
        
        @self.app.delete("/api/history")
        async def delete_all_history():
            """Delete all conversation history"""
            try:
                history_path = Path(self.interpreter.conversation_history_path)
                if history_path.exists():
                    for file in history_path.glob("*.json"):
                        file.unlink()
                return JSONResponse({"success": True})
            except Exception as e:
                return JSONResponse({"success": False, "error": str(e)}, status_code=500)
        
        @self.app.post("/api/upload")
        async def upload_files(files: List[UploadFile] = File(...)):
            """Upload files for processing"""
            try:
                uploaded_files = []
                for file in files:
                    # Save file to temporary location
                    content = await file.read()
                    file_path = Path("/tmp") / file.filename
                    with open(file_path, 'wb') as f:
                        f.write(content)
                    uploaded_files.append(str(file_path))
                
                return JSONResponse({"success": True, "files": uploaded_files})
            except Exception as e:
                return JSONResponse({"success": False, "error": str(e)}, status_code=500)
    
    async def _handle_chat_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Handle a chat message from the client"""
        try:
            user_message = message["message"]
            settings = message.get("settings", {})
            
            # Apply any settings updates
            if settings:
                self._apply_settings(settings)
            
            # Send user message back to confirm
            await websocket.send_json({
                "type": "message",
                "role": "user",
                "content": user_message
            })
            
            # Stream the interpreter's response
            for chunk in self.interpreter.chat(user_message, display=False, stream=True):
                if chunk.get("type") == "message":
                    await websocket.send_json({
                        "type": "message",
                        "role": chunk.get("role", "assistant"),
                        "content": chunk.get("content", ""),
                        "format": chunk.get("format", "text")
                    })
                elif chunk.get("type") == "code":
                    await websocket.send_json({
                        "type": "code",
                        "language": chunk.get("language", "python"),
                        "content": chunk.get("content", "")
                    })
                elif chunk.get("type") == "console":
                    await websocket.send_json({
                        "type": "message",
                        "role": "assistant",
                        "content": chunk.get("content", ""),
                        "format": "text"
                    })
        
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "content": f"Error processing message: {str(e)}"
            })
    
    async def _handle_execute_code(self, websocket: WebSocket, message: Dict[str, Any]):
        """Handle code execution request"""
        try:
            language = message["language"]
            code = message["code"]
            
            # Execute the code through the interpreter
            await websocket.send_json({
                "type": "status",
                "content": f"Executing {language} code..."
            })
            
            # This would need to be implemented to directly execute code
            # For now, we'll send it as a message to the interpreter
            for chunk in self.interpreter.chat(f"```{language}\n{code}\n```", display=False, stream=True):
                if chunk.get("type") == "console":
                    await websocket.send_json({
                        "type": "message",
                        "role": "assistant",
                        "content": chunk.get("content", ""),
                        "format": "text"
                    })
        
        except Exception as e:
            await websocket.send_json({
                "type": "error",
                "content": f"Error executing code: {str(e)}"
            })
    
    def run(self, host: str = "0.0.0.0", port: int = 8000, **kwargs):
        """Run the web server"""
        import uvicorn
        uvicorn.run(self.app, host=host, port=port, **kwargs)


def start_web_gui(interpreter: Optional[OpenInterpreter] = None, host: str = "0.0.0.0", port: int = 8000):
    """
    Start the web GUI server
    
    Args:
        interpreter: An OpenInterpreter instance (optional)
        host: Host address to bind to
        port: Port number to listen on
    """
    server = WebGUIServer(interpreter)
    print(f"\n🌐 Open Interpreter Web GUI starting...")
    print(f"📡 Server running on http://{host}:{port}")
    print(f"🔗 Open your browser to http://localhost:{port}\n")
    server.run(host=host, port=port)


if __name__ == "__main__":
    start_web_gui()
