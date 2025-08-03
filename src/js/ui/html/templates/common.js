/**
 * Common UI templates
 * Predefined templates for frequently used UI patterns
 */

export const commonTemplates = {
    // Button template
    button: `
        <button class="btn {{ class|default:'btn-primary' }}" 
                {{ disabled ? 'disabled' : '' }}
                {{ type ? 'type="' + type + '"' : '' }}>
            {% if icon %}
                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    {{ icon }}
                </svg>
            {% endif %}
            {{ text }}
        </button>
    `,

    // Input field template
    input: `
        <div class="form-group">
            {% if label %}
                <label for="{{ id }}" class="form-label">{{ label }}</label>
            {% endif %}
            <input type="{{ type|default:'text' }}" 
                   id="{{ id }}" 
                   name="{{ name|default:id }}"
                   class="form-input {{ class }}"
                   placeholder="{{ placeholder }}"
                   value="{{ value }}"
                   {{ required ? 'required' : '' }}
                   {{ disabled ? 'disabled' : '' }}>
            {% if error %}
                <div class="form-error">{{ error }}</div>
            {% endif %}
            {% if help %}
                <div class="form-help">{{ help }}</div>
            {% endif %}
        </div>
    `,

    // Modal template
    modal: `
        <div class="modal-overlay" {{ show ? 'style="display: flex;"' : '' }}>
            <div class="modal">
                {% if title %}
                    <div class="modal-header">
                        <h3>{{ title }}</h3>
                        <button class="modal-close" data-action="close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                {% endif %}
                <div class="modal-body">
                    {{ content }}
                </div>
                {% if actions %}
                    <div class="modal-footer">
                        {% for action in actions %}
                            <button class="btn {{ action.class|default:'btn-secondary' }}" 
                                    data-action="{{ action.action }}">
                                {{ action.text }}
                            </button>
                        {% endfor %}
                    </div>
                {% endif %}
            </div>
        </div>
    `,

    // List item template
    listItem: `
        <div class="list-item {{ active ? 'active' : '' }} {{ class }}">
            {% if avatar %}
                <div class="list-avatar">
                    <img src="{{ avatar }}" alt="{{ title }}">
                </div>
            {% endif %}
            {% if icon %}
                <div class="list-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        {{ icon }}
                    </svg>
                </div>
            {% endif %}
            <div class="list-content">
                {% if title %}
                    <div class="list-title">{{ title }}</div>
                {% endif %}
                {% if subtitle %}
                    <div class="list-subtitle">{{ subtitle }}</div>
                {% endif %}
                {% if description %}
                    <div class="list-description">{{ description }}</div>
                {% endif %}
            </div>
            {% if actions %}
                <div class="list-actions">
                    {% for action in actions %}
                        <button class="list-action-btn {{ action.class }}" 
                                data-action="{{ action.action }}"
                                title="{{ action.title }}">
                            {% if action.icon %}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    {{ action.icon }}
                                </svg>
                            {% else %}
                                {{ action.text }}
                            {% endif %}
                        </button>
                    {% endfor %}
                </div>
            {% endif %}
        </div>
    `,

    // Message template
    message: `
        <div class="message {{ type|default:'info' }} {{ class }}">
            {% if icon %}
                <div class="message-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        {{ icon }}
                    </svg>
                </div>
            {% endif %}
            <div class="message-content">
                {% if title %}
                    <div class="message-title">{{ title }}</div>
                {% endif %}
                <div class="message-text">{{ text }}</div>
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
            {% if dismissible %}
                <button class="message-close" data-action="dismiss">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            {% endif %}
        </div>
    `,

    // Loading spinner template
    loading: `
        <div class="loading {{ class }}">
            <div class="loading-spinner"></div>
            {% if text %}
                <div class="loading-text">{{ text }}</div>
            {% endif %}
        </div>
    `,

    // Card template
    card: `
        <div class="card {{ class }}">
            {% if header %}
                <div class="card-header">
                    {% if header.title %}
                        <h3 class="card-title">{{ header.title }}</h3>
                    {% endif %}
                    {% if header.actions %}
                        <div class="card-actions">
                            {% for action in header.actions %}
                                <button class="card-action" data-action="{{ action.action }}">
                                    {% if action.icon %}
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            {{ action.icon }}
                                        </svg>
                                    {% else %}
                                        {{ action.text }}
                                    {% endif %}
                                </button>
                            {% endfor %}
                        </div>
                    {% endif %}
                </div>
            {% endif %}
            <div class="card-body">
                {{ content }}
            </div>
            {% if footer %}
                <div class="card-footer">
                    {{ footer }}
                </div>
            {% endif %}
        </div>
    `,

    // Context menu template
    contextMenu: `
        <div class="context-menu {{ show ? 'show' : '' }}" 
             style="left: {{ x }}px; top: {{ y }}px;">
            {% for item in items %}
                {% if item.separator %}
                    <div class="context-menu-separator"></div>
                {% else %}
                    <div class="context-menu-item {{ item.class }}" 
                         data-action="{{ item.action }}"
                         {{ item.disabled ? 'data-disabled="true"' : '' }}>
                        {% if item.icon %}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                {{ item.icon }}
                            </svg>
                        {% endif %}
                        <span>{{ item.text }}</span>
                        {% if item.shortcut %}
                            <span class="context-menu-shortcut">{{ item.shortcut }}</span>
                        {% endif %}
                    </div>
                {% endif %}
            {% endfor %}
        </div>
    `,

    // Dropdown template
    dropdown: `
        <div class="dropdown {{ open ? 'open' : '' }} {{ class }}">
            <button class="dropdown-toggle" data-action="toggle">
                {% if icon %}
                    <svg class="dropdown-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        {{ icon }}
                    </svg>
                {% endif %}
                <span>{{ label }}</span>
                <svg class="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            </button>
            <div class="dropdown-menu">
                {% for item in items %}
                    {% if item.separator %}
                        <div class="dropdown-separator"></div>
                    {% else %}
                        <div class="dropdown-item {{ item.active ? 'active' : '' }} {{ item.class }}"
                             data-value="{{ item.value }}"
                             data-action="select">
                            {% if item.icon %}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    {{ item.icon }}
                                </svg>
                            {% endif %}
                            <span>{{ item.text }}</span>
                        </div>
                    {% endif %}
                {% endfor %}
            </div>
        </div>
    `
};