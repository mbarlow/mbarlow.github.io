import { System } from '../../core/System.js';

/**
 * Simple UI system for displaying channels and DMs
 * Replaces the complex SessionManagementSystem
 */
export class ChatUISystem extends System {
    constructor() {
        super();
        this.currentTarget = null; // Current channel name or entity ID
        this.currentType = null;   // 'channel' or 'dm'
        this.chatSystem = null;
        this.world = null;
    }

    init(world, industrialPortfolio) {
        console.log('💻 Initializing ChatUISystem...');
        this.world = world;
        this.industrialPortfolio = industrialPortfolio;
        this.chatSystem = world.getSystem('chat');
        
        if (!this.chatSystem) {
            console.error('ChatSystem not found');
            return;
        }

        // Initialize UI elements
        this.initChannelsList();
        this.initDMsList();
        this.initEventListeners();
        
        console.log('✅ ChatUISystem initialized');
    }

    /**
     * Initialize the channels list in the sidebar
     */
    async initChannelsList() {
        const channelsList = document.getElementById('channels-list');
        if (!channelsList) {
            console.warn('Channels list element not found');
            return;
        }

        // Clear existing channels
        channelsList.innerHTML = '';

        // Get all channels from ChatSystem
        const channels = await this.chatSystem.getAllChannels();
        
        for (const channel of channels) {
            const channelEl = this.createChannelElement(channel);
            channelsList.appendChild(channelEl);
        }

        console.log(`📡 Loaded ${channels.length} channels in UI`);
    }

    /**
     * Create a channel element for the sidebar
     */
    createChannelElement(channel) {
        const channelDiv = document.createElement('div');
        channelDiv.className = 'channel-item';
        channelDiv.dataset.channelName = channel.name;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'channel-name';
        nameSpan.textContent = `#${channel.name}`;

        const countSpan = document.createElement('span');
        countSpan.className = 'channel-count';
        countSpan.textContent = `(${channel.getMemberCount()} members)`;

        channelDiv.appendChild(nameSpan);
        channelDiv.appendChild(countSpan);

        // Add click handler
        channelDiv.addEventListener('click', () => {
            this.switchToChannel(channel.name);
        });

        return channelDiv;
    }

    /**
     * Initialize the DMs list in the sidebar
     */
    async initDMsList() {
        const dmsList = document.getElementById('dms-list');
        if (!dmsList) {
            console.warn('DMs list element not found');
            return;
        }

        // Clear existing DMs
        dmsList.innerHTML = '';

        // Get entities with DM history
        const dmEntityIds = await this.chatSystem.getDMEntities();
        
        for (const entityId of dmEntityIds) {
            const entity = this.world.entities.get(entityId);
            if (entity) {
                const dmEl = this.createDMElement(entity);
                dmsList.appendChild(dmEl);
            }
        }

        console.log(`💬 Loaded ${dmEntityIds.length} DM conversations in UI`);
    }

    /**
     * Create a DM element for the sidebar
     */
    createDMElement(entity) {
        const dmDiv = document.createElement('div');
        dmDiv.className = 'dm-item';
        dmDiv.dataset.entityId = entity.id;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'dm-name';
        nameSpan.textContent = entity.tag || entity.id;

        dmDiv.appendChild(nameSpan);

        // Add click handler
        dmDiv.addEventListener('click', () => {
            this.switchToDM(entity.id);
        });

        return dmDiv;
    }

    /**
     * Switch to a channel
     */
    async switchToChannel(channelName) {
        console.log(`🔄 Switching to channel: #${channelName}`);
        
        this.currentTarget = channelName;
        this.currentType = 'channel';

        // Update active state in UI
        this.updateActiveState('channel', channelName);

        // Set active target in ChatSystem for real-time updates
        const channels = await this.chatSystem.getAllChannels();
        const channel = channels.find(c => c.name === channelName);
        if (channel) {
            this.chatSystem.setActiveTarget('channel', channel.id);
        }

        // Load and display channel messages
        await this.loadChannelMessages(channelName);

        // Update chat input placeholder
        this.updateChatInputPlaceholder(`Message #${channelName}`);
    }

    /**
     * Switch to a DM
     */
    async switchToDM(entityId) {
        const entity = this.world.entities.get(entityId);
        const entityName = entity?.tag || entityId;
        
        console.log(`🔄 Switching to DM with: ${entityName}`);
        
        this.currentTarget = entityId;
        this.currentType = 'dm';

        // Update active state in UI
        this.updateActiveState('dm', entityId);

        // Set active target in ChatSystem
        this.chatSystem.setActiveTarget('dm', entityId);

        // Load and display DM messages
        await this.loadDMMessages(entityId);

        // Update chat input placeholder
        this.updateChatInputPlaceholder(`Message ${entityName}`);
    }

    /**
     * Load and display channel messages
     */
    async loadChannelMessages(channelName) {
        if (!this.industrialPortfolio) {
            console.warn('IndustrialPortfolio not available');
            return;
        }

        // Clear chat display
        this.industrialPortfolio.clearChatDisplay();

        // Get channel information including members
        const channels = await this.chatSystem.getAllChannels();
        const channel = channels.find(c => c.name === channelName);
        
        if (channel) {
            // Display channel header with member avatars
            this.displayChannelHeader(channelName, channel);
        }

        // Get messages from ChatSystem
        const messages = await this.chatSystem.getChannelMessages(channelName);

        console.log(`📜 Loading ${messages.length} messages for #${channelName}`);

        if (messages.length === 0) {
            this.industrialPortfolio.addMessage('system', `Welcome to #${channelName}! Start a conversation.`);
            return;
        }

        // Display messages (using same logic as DM messages)
        for (const message of messages) {
            const authorEntity = this.world.entities.get(message.author);
            const authorName = authorEntity?.tag || message.author;
            
            this.industrialPortfolio.addMessage(
                'assistant', // Use assistant style for channel messages
                message.content,
                {
                    author: authorName,
                    timestamp: message.created,
                    isChannelMessage: true
                }
            );
        }

        // Add system message about the channel switch
        this.industrialPortfolio.addMessage('system', `📡 Switched to #${channelName} (${messages.length} messages)`);
    }

    /**
     * Load and display DM messages
     */
    async loadDMMessages(entityId) {
        if (!this.industrialPortfolio) {
            console.warn('IndustrialPortfolio not available');
            return;
        }

        // Get the player entity
        const playerEntity = this.industrialPortfolio.playerEntity;
        if (!playerEntity) {
            console.warn('Player entity not found');
            return;
        }

        // Clear chat display
        this.industrialPortfolio.clearChatDisplay();

        // Get DM messages between player and target entity
        const messages = await this.chatSystem.getDMMessages(playerEntity.id, entityId);

        const targetEntity = this.world.entities.get(entityId);
        const targetName = targetEntity?.tag || entityId;

        console.log(`📜 Loading ${messages.length} DM messages with ${targetName}`);

        if (messages.length === 0) {
            this.industrialPortfolio.addMessage('system', `Start a conversation with ${targetName}`);
            return;
        }

        // Display messages
        for (const message of messages) {
            const isFromPlayer = message.author === playerEntity.id;
            const authorEntity = this.world.entities.get(message.author);
            const authorName = authorEntity?.tag || message.author;
            
            this.industrialPortfolio.addMessage(
                isFromPlayer ? 'user' : 'assistant',
                message.content,
                {
                    author: authorName,
                    timestamp: message.created,
                    isDMMessage: true
                }
            );
        }

        // Add system message about the DM switch
        this.industrialPortfolio.addMessage('system', `💬 Now chatting with ${targetName} (${messages.length} messages)`);
    }

    /**
     * Update active state in sidebar
     */
    updateActiveState(type, target) {
        // Remove active class from all items
        document.querySelectorAll('.channel-item, .dm-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current item
        if (type === 'channel') {
            const channelEl = document.querySelector(`[data-channel-name="${target}"]`);
            if (channelEl) {
                channelEl.classList.add('active');
            }
        } else if (type === 'dm') {
            const dmEl = document.querySelector(`[data-entity-id="${target}"]`);
            if (dmEl) {
                dmEl.classList.add('active');
            }
        }
    }

    /**
     * Display channel header with member avatars
     */
    displayChannelHeader(channelName, channel) {
        // Instead of trying to inject HTML into the message system,
        // create the header directly in the chat display area
        this.createChannelHeaderDOM(channelName, channel);
        
        // Add a simple text summary to the chat
        const memberCount = channel.getMemberCount();
        const memberNames = channel.getMemberIds()
            .map(id => {
                const entity = this.world.entities.get(id);
                return entity?.tag || id;
            })
            .join(', ');
        
        this.industrialPortfolio.addMessage('system', 
            `📡 #${channelName} • ${memberCount} members: ${memberNames}`
        );
    }

    /**
     * Create channel header DOM element
     */
    createChannelHeaderDOM(channelName, channel) {
        // Find the chat messages container
        const chatDisplay = document.getElementById('chat-messages');
        if (!chatDisplay) {
            console.warn('Chat messages container not found');
            return;
        }

        // Remove any existing channel header
        const existingHeader = chatDisplay.querySelector('.channel-header');
        if (existingHeader) {
            existingHeader.remove();
        }

        // Create the header element
        const headerEl = document.createElement('div');
        headerEl.className = 'channel-header';
        headerEl.style.cssText = `
            background: var(--bg-secondary, #2a2a2a);
            border-bottom: 1px solid var(--border-color, #444);
            padding: 12px 16px;
            margin-bottom: 12px;
            border-radius: 8px;
            position: sticky;
            top: 0;
            z-index: 10;
        `;

        // Create header content
        const headerContent = document.createElement('div');
        headerContent.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        `;

        // Channel title
        const title = document.createElement('h3');
        title.style.cssText = `
            margin: 0;
            color: var(--text-primary, #e0e0e0);
            font-size: 18px;
            font-weight: 600;
        `;
        title.textContent = `#${channelName}`;

        // Member count
        const memberCount = document.createElement('span');
        memberCount.style.cssText = `
            color: var(--text-secondary, #888);
            font-size: 12px;
        `;
        memberCount.textContent = `${channel.getMemberCount()} members`;

        headerContent.appendChild(title);
        headerContent.appendChild(memberCount);

        // Members section
        const membersSection = document.createElement('div');
        membersSection.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
        `;

        // Members label
        const membersLabel = document.createElement('span');
        membersLabel.style.cssText = `
            color: var(--text-secondary, #888);
            font-size: 12px;
            margin-right: 8px;
        `;
        membersLabel.textContent = 'Members:';
        membersSection.appendChild(membersLabel);

        // Create member avatars
        this.createMemberAvatarElements(channel, membersSection);

        // Assemble the header
        headerEl.appendChild(headerContent);
        headerEl.appendChild(membersSection);

        // Insert at the top of the chat display
        chatDisplay.insertBefore(headerEl, chatDisplay.firstChild);
    }

    /**
     * Create member avatar DOM elements
     */
    createMemberAvatarElements(channel, container) {
        const memberIds = channel.getMemberIds();
        
        memberIds.forEach(memberId => {
            const entity = this.world.entities.get(memberId);
            const memberName = entity?.tag || memberId;
            const initials = this.getEntityInitials(memberName);
            const avatarColor = this.getEntityColor(memberId);
            
            const avatarEl = document.createElement('div');
            avatarEl.className = 'member-avatar';
            avatarEl.title = memberName;
            avatarEl.style.cssText = `
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: ${avatarColor};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                border: 2px solid var(--bg-primary, #1a1a1a);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                transition: transform 0.2s ease;
            `;
            avatarEl.textContent = initials;
            
            // Add hover effects
            avatarEl.addEventListener('mouseenter', () => {
                avatarEl.style.transform = 'scale(1.1)';
            });
            
            avatarEl.addEventListener('mouseleave', () => {
                avatarEl.style.transform = 'scale(1)';
            });
            
            // Optional: Add click handler to start DM
            avatarEl.addEventListener('click', () => {
                if (memberId !== this.industrialPortfolio?.playerEntity?.id) {
                    this.switchToDM(memberId);
                }
            });
            
            container.appendChild(avatarEl);
        });
    }

    /**
     * Get initials from entity name
     */
    getEntityInitials(name) {
        if (!name) return '?';
        
        // Handle special cases
        if (name === 'player') return 'P';
        if (name === 'origin-marker') return 'O';
        if (name === 'bot') return 'B';
        
        // Get first two letters or initials from multiple words
        const words = name.split(/[\s-_]+/);
        if (words.length > 1) {
            return words.slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
        }
        
        return name.substring(0, 2).toUpperCase();
    }

    /**
     * Get a consistent color for an entity based on ID
     */
    getEntityColor(entityId) {
        // Simple hash function to get consistent colors
        let hash = 0;
        for (let i = 0; i < entityId.length; i++) {
            const char = entityId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Convert to positive number and use for hue
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 60%, 45%)`;
    }

    /**
     * Update chat input placeholder
     */
    updateChatInputPlaceholder(placeholder) {
        const chatInput = document.getElementById('chat-input');
        if (chatInput) {
            chatInput.placeholder = placeholder;
        }
    }

    /**
     * Handle sending a message
     */
    async sendMessage(content) {
        if (!this.currentTarget || !this.currentType) {
            console.warn('No active chat target');
            return;
        }

        if (!this.industrialPortfolio?.playerEntity) {
            console.warn('Player entity not found');
            return;
        }

        const playerEntity = this.industrialPortfolio.playerEntity;
        const playerChat = playerEntity.getComponent('ChatComponent');
        
        if (!playerChat) {
            console.warn('Player does not have ChatComponent');
            return;
        }

        try {
            if (this.currentType === 'channel') {
                // Send channel message
                await playerChat.sendChannelMsg(this.currentTarget, content);
                console.log(`📡 Sent message to #${this.currentTarget}: ${content}`);
            } else if (this.currentType === 'dm') {
                // Send DM
                await playerChat.sendDM(this.currentTarget, content);
                console.log(`💬 Sent DM to ${this.currentTarget}: ${content}`);
            }

            // Refresh the current view to show the new message
            if (this.currentType === 'channel') {
                await this.loadChannelMessages(this.currentTarget);
            } else {
                await this.loadDMMessages(this.currentTarget);
            }

        } catch (error) {
            console.error('Failed to send message:', error);
        }
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Listen for chat input submissions (this will need to integrate with existing chat system)
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('chat-send');

        if (chatInput && sendButton) {
            const handleSend = () => {
                const content = chatInput.value.trim();
                if (content) {
                    this.sendMessage(content);
                    chatInput.value = '';
                }
            };

            sendButton.addEventListener('click', handleSend);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            });
        }
    }

    /**
     * Refresh the UI (useful for updating message counts, etc.)
     */
    async refresh() {
        await this.initChannelsList();
        await this.initDMsList();
        
        // Reload current view if active (this will include updated member avatars)
        if (this.currentTarget && this.currentType) {
            if (this.currentType === 'channel') {
                await this.loadChannelMessages(this.currentTarget);
            } else {
                await this.loadDMMessages(this.currentTarget);
            }
        }
    }

    /**
     * System update method (required by ECS)
     */
    update(deltaTime) {
        // ChatUISystem doesn't need regular updates
        // It responds to user actions instead
    }
}