// WebSocket connection
let ws = null;
let currentSettings = {};
let conversationHistory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeChat();
    initializeSettings();
    initializeHistory();
    initializeKeyboardShortcuts();
    connectWebSocket();
    loadSettings();
});

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = item.getAttribute('data-page');

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show target page
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(`${targetPage}-page`).classList.add('active');
        });
    });
}

// WebSocket Connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        updateStatus('connected');
        console.log('WebSocket connected');
    };

    ws.onclose = () => {
        updateStatus('disconnected');
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateStatus('error');
    };

    ws.onmessage = (event) => {
        handleWebSocketMessage(JSON.parse(event.data));
    };
}

function updateStatus(status) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    
    if (status === 'connected') {
        statusDot.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

function handleWebSocketMessage(data) {
    if (data.type === 'message') {
        appendMessage(data.role, data.content, data.format);
    } else if (data.type === 'code') {
        appendCodeBlock(data.language, data.content);
    } else if (data.type === 'status') {
        updateChatStatus(data.content);
    } else if (data.type === 'error') {
        showError(data.content);
    }
}

// Chat functionality
function initializeChat() {
    const sendBtn = document.getElementById('send-btn');
    const messageInput = document.getElementById('message-input');
    const newChatBtn = document.getElementById('new-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const fileUpload = document.getElementById('file-upload');

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            sendMessage();
        }
    });

    newChatBtn.addEventListener('click', newChat);
    clearChatBtn.addEventListener('click', clearChat);
    fileUpload.addEventListener('change', handleFileUpload);

    // Quick actions
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
        action.addEventListener('click', () => {
            const actionType = action.getAttribute('data-action');
            toggleQuickAction(actionType, action);
        });
    });
}

function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (!message || !ws || ws.readyState !== WebSocket.OPEN) {
        return;
    }

    // Append user message to UI
    appendMessage('user', message);

    // Send message via WebSocket
    ws.send(JSON.stringify({
        type: 'chat',
        message: message,
        settings: currentSettings
    }));

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
}

function appendMessage(role, content, format = 'text') {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = role === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (format === 'markdown') {
        contentDiv.innerHTML = parseMarkdown(content);
    } else {
        contentDiv.textContent = content;
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendCodeBlock(language, code) {
    const messagesContainer = document.getElementById('messages');
    const lastMessage = messagesContainer.lastElementChild;
    
    if (lastMessage && lastMessage.classList.contains('assistant')) {
        const contentDiv = lastMessage.querySelector('.message-content');
        
        const codeContainer = document.createElement('div');
        codeContainer.className = 'code-container';
        
        const codeHeader = document.createElement('div');
        codeHeader.className = 'code-header';
        codeHeader.innerHTML = `
            <span class="code-language">${language}</span>
            <div class="code-actions">
                <button class="code-action-btn" onclick="copyCode(this)">
                    <i class="fas fa-copy"></i> Copy
                </button>
                <button class="code-action-btn" onclick="runCode(this)">
                    <i class="fas fa-play"></i> Run
                </button>
            </div>
        `;
        
        const pre = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.textContent = code;
        codeElement.setAttribute('data-language', language);
        pre.appendChild(codeElement);
        
        codeContainer.appendChild(codeHeader);
        codeContainer.appendChild(pre);
        contentDiv.appendChild(codeContainer);
    }
}

function copyCode(button) {
    const codeBlock = button.closest('.code-container').querySelector('code');
    navigator.clipboard.writeText(codeBlock.textContent);
    
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copied';
    setTimeout(() => {
        button.innerHTML = originalText;
    }, 2000);
}

function runCode(button) {
    const codeBlock = button.closest('.code-container').querySelector('code');
    const code = codeBlock.textContent;
    const language = codeBlock.getAttribute('data-language');
    
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'execute',
            language: language,
            code: code
        }));
    }
}

function newChat() {
    if (confirm('Start a new chat? Current conversation will be saved.')) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'new_chat'
            }));
        }
        document.getElementById('messages').innerHTML = '';
    }
}

function clearChat() {
    if (confirm('Clear current chat? This cannot be undone.')) {
        document.getElementById('messages').innerHTML = '';
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'clear_chat'
            }));
        }
    }
}

function toggleQuickAction(actionType, button) {
    const isActive = button.classList.contains('active');
    button.classList.toggle('active');
    
    // Update settings
    currentSettings[actionType] = !isActive;
    
    // Update status text
    const statusSpan = button.querySelector('span:last-child');
    statusSpan.textContent = !isActive ? 'ON' : 'OFF';
    
    // Send updated settings to server
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'update_settings',
            settings: currentSettings
        }));
    }
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    // Upload files via HTTP
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            appendMessage('system', `Uploaded ${files.length} file(s)`);
        } else {
            showError('File upload failed');
        }
    })
    .catch(error => {
        showError('File upload error: ' + error.message);
    });

    // Clear file input
    event.target.value = '';
}

// Settings functionality
function initializeSettings() {
    const saveBtn = document.getElementById('save-settings-btn');
    const resetBtn = document.getElementById('reset-settings-btn');

    saveBtn.addEventListener('click', saveSettings);
    resetBtn.addEventListener('click', resetSettings);
}

function loadSettings() {
    fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            currentSettings = data;
            populateSettingsForm(data);
        })
        .catch(error => {
            console.error('Failed to load settings:', error);
        });
}

function populateSettingsForm(settings) {
    // LLM settings
    document.getElementById('model').value = settings.model || 'gpt-4o';
    document.getElementById('temperature').value = settings.temperature || 0.0;
    document.getElementById('api-key').value = settings.api_key || '';
    document.getElementById('api-base').value = settings.api_base || '';
    document.getElementById('max-tokens').value = settings.max_tokens || '';
    document.getElementById('context-window').value = settings.context_window || '';

    // Execution settings
    document.getElementById('auto-run').checked = settings.auto_run || false;
    document.getElementById('verbose').checked = settings.verbose || false;
    document.getElementById('debug').checked = settings.debug || false;
    document.getElementById('offline').checked = settings.offline || false;
    document.getElementById('max-output').value = settings.max_output || 2800;
    document.getElementById('safe-mode').value = settings.safe_mode || 'off';

    // Display settings
    document.getElementById('shrink-images').checked = settings.shrink_images !== false;
    document.getElementById('multi-line').checked = settings.multi_line !== false;
    document.getElementById('plain-text').checked = settings.plain_text_display || false;
    document.getElementById('highlight-active-line').checked = settings.highlight_active_line !== false;

    // Conversation settings
    document.getElementById('conversation-history').checked = settings.conversation_history !== false;
    document.getElementById('conversation-filename').value = settings.conversation_filename || '';
    document.getElementById('contribute-conversation').checked = settings.contribute_conversation || false;

    // Loop settings
    document.getElementById('loop').checked = settings.loop || false;
    document.getElementById('loop-message').value = settings.loop_message || '';
    document.getElementById('loop-breakers').value = settings.loop_breakers ? settings.loop_breakers.join(',') : '';

    // Advanced settings
    document.getElementById('disable-telemetry').checked = settings.disable_telemetry || false;
    document.getElementById('os-mode').checked = settings.os || false;
    document.getElementById('speak-messages').checked = settings.speak_messages || false;
    document.getElementById('sync-computer').checked = settings.sync_computer || false;
    document.getElementById('import-computer-api').checked = settings.import_computer_api || false;
    document.getElementById('import-skills').checked = settings.import_skills || false;
    document.getElementById('skills-path').value = settings.skills_path || '';
    document.getElementById('custom-instructions').value = settings.custom_instructions || '';
    document.getElementById('system-message').value = settings.system_message || '';
}

function collectSettingsFromForm() {
    return {
        // LLM settings
        model: document.getElementById('model').value,
        temperature: parseFloat(document.getElementById('temperature').value),
        api_key: document.getElementById('api-key').value,
        api_base: document.getElementById('api-base').value,
        max_tokens: document.getElementById('max-tokens').value ? parseInt(document.getElementById('max-tokens').value) : null,
        context_window: document.getElementById('context-window').value ? parseInt(document.getElementById('context-window').value) : null,

        // Execution settings
        auto_run: document.getElementById('auto-run').checked,
        verbose: document.getElementById('verbose').checked,
        debug: document.getElementById('debug').checked,
        offline: document.getElementById('offline').checked,
        max_output: parseInt(document.getElementById('max-output').value),
        safe_mode: document.getElementById('safe-mode').value,

        // Display settings
        shrink_images: document.getElementById('shrink-images').checked,
        multi_line: document.getElementById('multi-line').checked,
        plain_text_display: document.getElementById('plain-text').checked,
        highlight_active_line: document.getElementById('highlight-active-line').checked,

        // Conversation settings
        conversation_history: document.getElementById('conversation-history').checked,
        conversation_filename: document.getElementById('conversation-filename').value,
        contribute_conversation: document.getElementById('contribute-conversation').checked,

        // Loop settings
        loop: document.getElementById('loop').checked,
        loop_message: document.getElementById('loop-message').value,
        loop_breakers: document.getElementById('loop-breakers').value.split(',').map(s => s.trim()).filter(s => s),

        // Advanced settings
        disable_telemetry: document.getElementById('disable-telemetry').checked,
        os: document.getElementById('os-mode').checked,
        speak_messages: document.getElementById('speak-messages').checked,
        sync_computer: document.getElementById('sync-computer').checked,
        import_computer_api: document.getElementById('import-computer-api').checked,
        import_skills: document.getElementById('import-skills').checked,
        skills_path: document.getElementById('skills-path').value,
        custom_instructions: document.getElementById('custom-instructions').value,
        system_message: document.getElementById('system-message').value
    };
}

function saveSettings() {
    const settings = collectSettingsFromForm();
    currentSettings = settings;

    fetch('/api/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Settings saved successfully');
        } else {
            showError('Failed to save settings');
        }
    })
    .catch(error => {
        showError('Error saving settings: ' + error.message);
    });
}

function resetSettings() {
    if (confirm('Reset all settings to default values?')) {
        fetch('/api/settings/reset', {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadSettings();
                showSuccess('Settings reset to default');
            } else {
                showError('Failed to reset settings');
            }
        })
        .catch(error => {
            showError('Error resetting settings: ' + error.message);
        });
    }
}

// History functionality
function initializeHistory() {
    const refreshBtn = document.getElementById('refresh-history-btn');
    const deleteAllBtn = document.getElementById('delete-all-history-btn');

    refreshBtn.addEventListener('click', loadHistory);
    deleteAllBtn.addEventListener('click', deleteAllHistory);

    // Load history on page load
    loadHistory();
}

function loadHistory() {
    fetch('/api/history')
        .then(response => response.json())
        .then(data => {
            displayHistory(data.conversations || []);
        })
        .catch(error => {
            console.error('Failed to load history:', error);
            showError('Failed to load conversation history');
        });
}

function displayHistory(conversations) {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    if (conversations.length === 0) {
        historyList.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No conversation history found</p>';
        return;
    }

    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const title = conv.filename.split('__')[0].replace(/_/g, ' ');
        const date = new Date(conv.date).toLocaleString();
        const preview = conv.messages[0]?.content.substring(0, 100) || 'No content';

        item.innerHTML = `
            <div class="history-item-title">${title}</div>
            <div class="history-item-date">${date}</div>
            <div class="history-item-preview">${preview}...</div>
            <div class="history-item-actions">
                <button class="btn-load" onclick="loadConversation('${conv.filename}')">
                    <i class="fas fa-folder-open"></i> Load
                </button>
                <button class="btn-delete" onclick="deleteConversation('${conv.filename}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        historyList.appendChild(item);
    });
}

function loadConversation(filename) {
    fetch(`/api/history/${filename}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Clear current messages
                document.getElementById('messages').innerHTML = '';
                
                // Load conversation messages
                data.messages.forEach(msg => {
                    appendMessage(msg.role, msg.content);
                });

                // Switch to chat page
                document.querySelector('[data-page="chat"]').click();
                showSuccess('Conversation loaded');
            }
        })
        .catch(error => {
            showError('Failed to load conversation');
        });
}

function deleteConversation(filename) {
    if (confirm('Delete this conversation?')) {
        fetch(`/api/history/${filename}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadHistory();
                showSuccess('Conversation deleted');
            }
        })
        .catch(error => {
            showError('Failed to delete conversation');
        });
    }
}

function deleteAllHistory() {
    if (confirm('Delete all conversation history? This cannot be undone.')) {
        fetch('/api/history', {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadHistory();
                showSuccess('All conversations deleted');
            }
        })
        .catch(error => {
            showError('Failed to delete history');
        });
    }
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter: Send message
        if (e.ctrlKey && e.key === 'Enter') {
            if (document.getElementById('chat-page').classList.contains('active')) {
                sendMessage();
            }
        }
        // Ctrl+N: New chat
        else if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            newChat();
        }
        // Ctrl+K: Clear chat
        else if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            clearChat();
        }
        // Ctrl+S: Save settings
        else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (document.getElementById('settings-page').classList.contains('active')) {
                saveSettings();
            }
        }
    });
}

// Utility functions
function parseMarkdown(text) {
    // Simple markdown parser - in production, use a library like marked.js
    let html = text;
    
    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
    });
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Simple notification - in production, use a library like toastr
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function updateChatStatus(status) {
    // Show typing indicator or other status updates
    console.log('Chat status:', status);
}
