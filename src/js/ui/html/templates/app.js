/**
 * Application-specific templates
 * Templates for chat interface, sessions, and other app features
 */

export const appTemplates = {
    // Chat message template
    chatMessage: `
        <div class="message {{ type }} {{ class }}" data-message-id="{{ id }}">
            {% if showAvatar %}
                <div class="message-avatar">
                    {% if avatar %}
                        <img src="{{ avatar }}" alt="{{ sender }}">
                    {% else %}
                        <div class="avatar-placeholder">{{ sender|first|upper }}</div>
                    {% endif %}
                </div>
            {% endif %}
            
            <div class="message-content">
                {% if showHeader %}
                    <div class="message-header">
                        <span class="message-sender">{{ sender }}</span>
                        <span class="message-time">{{ timestamp|date:'HH:mm' }}</span>
                        {% if status %}
                            <span class="message-status {{ status }}">{{ status }}</span>
                        {% endif %}
                    </div>
                {% endif %}
                
                <div class="message-text">{{ content }}</div>
                
                {% if images %}
                    <div class="message-images">
                        {% for image in images %}
                            <img src="{{ image.url }}" 
                                 alt="{{ image.alt }}" 
                                 class="message-image"
                                 {{ image.width ? 'width="' + image.width + '"' : '' }}
                                 {{ image.height ? 'height="' + image.height + '"' : '' }}>
                        {% endfor %}
                    </div>
                {% endif %}
                
                {% if actions %}
                    <div class="message-actions">
                        {% for action in actions %}
                            <button class="message-action" data-action="{{ action.action }}">
                                {{ action.text }}
                            </button>
                        {% endfor %}
                    </div>
                {% endif %}
            </div>
            
            {% if type === 'ai' and thinking %}
                <div class="message-thinking">
                    <div class="thinking-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            {% endif %}
        </div>
    `,

    // Session list item template
    sessionItem: `
        <div class="session-item {{ active ? 'active' : '' }}" 
             data-session-id="{{ id }}">
            <div class="session-content">
                <div class="session-header">
                    <h4 class="session-title">{{ title|default:'Untitled Session' }}</h4>
                    <span class="session-time">{{ lastActivity|date:'HH:mm' }}</span>
                </div>
                
                <div class="session-meta">
                    {% if participants %}
                        <div class="session-participants">
                            {% for participant in participants %}
                                <span class="participant {{ participant.type }}">{{ participant.name }}</span>
                                {% if not loop.last %}{{ loop.last ? '' : ', ' }}{% endif %}
                            {% endfor %}
                        </div>
                    {% endif %}
                    
                    <div class="session-stats">
                        <span class="message-count">{{ messageCount }} messages</span>
                        {% if imageCount > 0 %}
                            <span class="image-count">{{ imageCount }} images</span>
                        {% endif %}
                    </div>
                </div>
                
                {% if images and images.length > 0 %}
                    <div class="session-thumbnails">
                        {% for image in images %}
                            {% if loop.index1 <= 10 %}
                                <img src="{{ image.thumbnail }}" 
                                     alt="Session image {{ loop.index1 }}" 
                                     class="session-thumbnail">
                            {% endif %}
                        {% endfor %}
                        {% if images.length > 10 %}
                            <div class="thumbnail-more">+{{ images.length - 10 }}</div>
                        {% endif %}
                    </div>
                {% endif %}
            </div>
            
            <button class="session-menu-btn" title="Session Options">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="12" cy="5" r="1"/>
                    <circle cx="12" cy="19" r="1"/>
                </svg>
            </button>
        </div>
    `,

    // Session context menu template
    sessionContextMenu: `
        <div class="session-context-menu {{ show ? 'show' : '' }}" 
             style="left: {{ x }}px; top: {{ y }}px;">
            <div class="context-menu-item" data-action="rename">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span>Rename</span>
            </div>
            <div class="context-menu-item context-menu-danger" data-action="delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"/>
                    <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
                <span>Delete</span>
            </div>
        </div>
    `,

    // Session rename modal template
    sessionRenameModal: `
        <div class="modal-overlay" {{ show ? 'style="display: flex;"' : '' }}>
            <div class="modal">
                <div class="modal-header">
                    <h3>Rename Session</h3>
                    <button class="modal-close" data-action="close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="session-title-input">Session Title</label>
                        <input type="text" 
                               id="session-title-input" 
                               class="form-input" 
                               placeholder="Enter session title..."
                               value="{{ currentTitle }}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                    <button class="btn btn-primary" data-action="save">Save</button>
                </div>
            </div>
        </div>
    `,

    // Session delete modal template
    sessionDeleteModal: `
        <div class="modal-overlay" {{ show ? 'style="display: flex;"' : '' }}>
            <div class="modal">
                <div class="modal-header">
                    <h3>Delete Session</h3>
                    <button class="modal-close" data-action="close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete this session? This action cannot be undone.</p>
                    <div class="session-delete-info">
                        <strong>{{ sessionTitle }}</strong>
                        <span>{{ messageCount }} messages, {{ participantCount }} participants</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                    <button class="btn btn-danger" data-action="confirm">Delete</button>
                </div>
            </div>
        </div>
    `,

    // Theme selector template
    themeSelector: `
        <div class="theme-controls-sidebar">
            <div class="theme-group">
                {% for theme in themes %}
                    <button class="theme-btn {{ theme.active ? 'active' : '' }}" 
                            data-theme="{{ theme.value }}"
                            title="{{ theme.label }}">
                        {{ theme.label|first }}
                    </button>
                {% endfor %}
            </div>
        </div>
    `,

    // Font dropdown template
    fontDropdown: `
        <div class="font-dropdown {{ open ? 'open' : '' }}">
            <div class="font-dropdown-content">
                <div class="font-dropdown-header">
                    <span>Select Font</span>
                    <button class="font-dropdown-close" data-action="close">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="font-options">
                    {% for section in sections %}
                        <div class="font-section">
                            <div class="font-section-title">{{ section.title }}</div>
                            {% for font in section.fonts %}
                                <button class="font-option {{ font.active ? 'active' : '' }}" 
                                        data-font="{{ font.value }}"
                                        style="font-family: '{{ font.name }}'">
                                    {{ font.name }}
                                </button>
                            {% endfor %}
                        </div>
                    {% endfor %}
                </div>
            </div>
        </div>
    `,

    // Navigation template
    navigation: `
        <nav class="sidebar-nav">
            <div class="nav-section">
                {% for item in items %}
                    <div class="nav-item {{ item.active ? 'active' : '' }}" data-view="{{ item.view }}">
                        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            {{ item.icon }}
                        </svg>
                        <span class="nav-label">{{ item.label }}</span>
                    </div>
                {% endfor %}
            </div>
        </nav>
    `,

    // Status indicator template
    statusIndicator: `
        <div class="status-indicator {{ status }}">
            <span class="status-dot"></span>
            <span class="status-text">{{ text }}</span>
        </div>
    `,

    // Command help template
    commandHelp: `
        <div class="command-help">
            <h4>Available Commands</h4>
            {% for command in commands %}
                <div class="command-item">
                    <code>{{ command.name }}</code>
                    <span class="command-description">{{ command.description }}</span>
                    {% if command.examples %}
                        <div class="command-examples">
                            {% for example in command.examples %}
                                <code class="command-example">{{ example }}</code>
                            {% endfor %}
                        </div>
                    {% endif %}
                </div>
            {% endfor %}
        </div>
    `,

    // Error message template
    errorMessage: `
        <div class="error-message {{ type }}">
            <div class="error-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
            </div>
            <div class="error-content">
                <div class="error-title">{{ title|default:'Error' }}</div>
                <div class="error-text">{{ message }}</div>
                {% if details %}
                    <details class="error-details">
                        <summary>Technical Details</summary>
                        <pre>{{ details }}</pre>
                    </details>
                {% endif %}
            </div>
        </div>
    `
};