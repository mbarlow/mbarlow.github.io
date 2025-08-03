/**
 * ChatInterface Component Test
 * Test suite for chat interface functionality
 */

import { ChatInterface } from './ChatInterface.js';
import { Debug } from '../utils/Debug.js';

export async function testChatInterface() {
    Debug.log('ChatInterfaceTest', 'Starting chat interface tests');
    
    try {
        // Test 1: Create chat interface
        console.group('🧪 Test 1: ChatInterface Creation');
        const chatInterface = new ChatInterface();
        console.log('✅ ChatInterface created');
        console.groupEnd();
        
        // Test 2: Initialize chat interface
        console.group('🧪 Test 2: ChatInterface Initialization');
        chatInterface.init();
        console.log('✅ ChatInterface initialized');
        console.groupEnd();
        
        // Test 3: Get DOM elements
        console.group('🧪 Test 3: DOM Element Access');
        const chatMessages = chatInterface.getChatMessages();
        const chatInput = chatInterface.getChatInput();
        const chatSend = chatInterface.getChatSend();
        const chatContainer = chatInterface.getChatContainer();
        
        console.log(`${chatMessages ? '✅' : '⚠️'} Chat messages element found: ${!!chatMessages}`);
        console.log(`${chatInput ? '✅' : '⚠️'} Chat input element found: ${!!chatInput}`);
        console.log(`${chatSend ? '✅' : '⚠️'} Chat send element found: ${!!chatSend}`);
        console.log(`${chatContainer ? '✅' : '⚠️'} Chat container element found: ${!!chatContainer}`);
        console.groupEnd();
        
        // Test 4: Dependency injection
        console.group('🧪 Test 4: Dependency Injection');
        const mockDependencies = {
            world: { getSystem: () => null },
            sessionSystem: { hasActiveSession: () => true },
            agentSystem: { processMessage: async () => 'Mock response' },
            originEntity: { id: 'test-origin' }
        };
        
        chatInterface.injectDependencies(mockDependencies);
        console.log('✅ Dependencies injected successfully');
        console.groupEnd();
        
        // Test 5: Message handling
        console.group('🧪 Test 5: Message Handling');
        let messageCount = chatInterface.getMessageCount();
        console.log(`Initial message count: ${messageCount}`);
        
        chatInterface.addMessage('user', 'Test message');
        const newMessageCount = chatInterface.getMessageCount();
        console.log(`${newMessageCount > messageCount ? '✅' : '❌'} Message added: ${newMessageCount} > ${messageCount}`);
        
        chatInterface.addMessage('assistant', 'Test response');
        const finalMessageCount = chatInterface.getMessageCount();
        console.log(`${finalMessageCount > newMessageCount ? '✅' : '❌'} Response added: ${finalMessageCount} > ${newMessageCount}`);
        console.groupEnd();
        
        // Test 6: Input state management
        console.group('🧪 Test 6: Input State Management');
        if (chatInput) {
            chatInterface.focusInput();
            const isFocused = document.activeElement === chatInput;
            console.log(`${isFocused ? '✅' : '❌'} Input focus: ${isFocused}`);
            
            // Test input clearing
            chatInput.value = 'Test input';
            chatInterface.clearInput();
            const isEmpty = chatInput.value === '';
            console.log(`${isEmpty ? '✅' : '❌'} Input cleared: ${isEmpty}`);
        } else {
            console.log('⚠️ Cannot test input functions - input element not found');
        }
        console.groupEnd();
        
        // Test 7: Auto-resize functionality
        console.group('🧪 Test 7: Auto-resize Functionality');
        if (chatInput) {
            const initialHeight = chatInput.style.height;
            chatInput.value = 'Line 1\nLine 2\nLine 3\nLine 4';
            chatInterface.autoResizeTextarea(chatInput);
            const resizedHeight = chatInput.style.height;
            console.log(`${resizedHeight !== initialHeight ? '✅' : '❌'} Auto-resize works: ${initialHeight} → ${resizedHeight}`);
            chatInput.value = '';
        } else {
            console.log('⚠️ Cannot test auto-resize - input element not found');
        }
        console.groupEnd();
        
        // Test 8: Image handling
        console.group('🧪 Test 8: Image Handling');
        const initialImageCount = chatInterface.getImages().length;
        console.log(`Initial image count: ${initialImageCount}`);
        
        // Create a mock image file
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 10;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, 10, 10);
        
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'test.png', { type: 'image/png' });
            
            try {
                await chatInterface.handleImageFile(file);
                const newImageCount = chatInterface.getImages().length;
                console.log(`${newImageCount > initialImageCount ? '✅' : '❌'} Image added: ${newImageCount} > ${initialImageCount}`);
                
                // Test image clearing
                chatInterface.clearImages();
                const clearedImageCount = chatInterface.getImages().length;
                console.log(`${clearedImageCount === 0 ? '✅' : '❌'} Images cleared: ${clearedImageCount} === 0`);
            } catch (error) {
                console.log('❌ Image handling failed:', error.message);
            }
        }, 'image/png');
        console.groupEnd();
        
        // Test 9: State management
        console.group('🧪 Test 9: State Management');
        const state = chatInterface.getState();
        console.log('Current state:', state);
        console.log(`${typeof state === 'object' ? '✅' : '❌'} State is object: ${typeof state}`);
        console.log(`${typeof state.messageCount === 'number' ? '✅' : '❌'} Message count in state: ${state.messageCount}`);
        console.log(`${typeof state.imageCount === 'number' ? '✅' : '❌'} Image count in state: ${state.imageCount}`);
        console.groupEnd();
        
        // Test 10: Chat target management
        console.group('🧪 Test 10: Chat Target Management');
        const mockTarget = { id: 'test-entity', name: 'Test Entity' };
        chatInterface.setChatTarget(mockTarget);
        const currentState = chatInterface.getState();
        console.log(`${currentState.currentChatTarget === mockTarget.id ? '✅' : '❌'} Chat target set: ${currentState.currentChatTarget}`);
        console.groupEnd();
        
        // Test 11: Event system
        console.group('🧪 Test 11: Event System');
        let eventReceived = false;
        chatInterface.subscribe('message:added', (data) => {
            eventReceived = true;
            console.log('Message added event received:', data);
        });
        
        chatInterface.addMessage('system', 'Event test message');
        setTimeout(() => {
            console.log(`${eventReceived ? '✅' : '❌'} Event system working: ${eventReceived}`);
        }, 10);
        console.groupEnd();
        
        // Test 12: Command handling
        console.group('🧪 Test 12: Command Handling');
        let commandEventReceived = false;
        chatInterface.subscribe('command:executed', (data) => {
            commandEventReceived = true;
            console.log('Command event received:', data);
        });
        
        // Test individual command handlers
        const commands = ['history', 'save', 'export', 'who', 'model', 'context'];
        for (const command of commands) {
            try {
                await chatInterface[`handle${command.charAt(0).toUpperCase() + command.slice(1)}Command`]();
                console.log(`✅ ${command} command handler exists`);
            } catch (error) {
                console.log(`❌ ${command} command handler failed: ${error.message}`);
            }
        }
        console.groupEnd();
        
        // Test 13: Input validation
        console.group('🧪 Test 13: Input Validation');
        if (chatInput && chatSend) {
            // Test empty input
            chatInput.value = '';
            chatInterface.updateSendButton(chatInput, chatSend);
            console.log(`${chatSend.disabled ? '✅' : '❌'} Send button disabled for empty input: ${chatSend.disabled}`);
            
            // Test non-empty input
            chatInput.value = 'Test message';
            chatInterface.updateSendButton(chatInput, chatSend);
            console.log(`${!chatSend.disabled ? '✅' : '❌'} Send button enabled for text: ${!chatSend.disabled}`);
            
            chatInput.value = '';
        } else {
            console.log('⚠️ Cannot test input validation - elements not found');
        }
        console.groupEnd();
        
        // Test 14: Message clearing
        console.group('🧪 Test 14: Message Clearing');
        const messageCountBeforeClear = chatInterface.getMessageCount();
        chatInterface.clearMessages();
        const messageCountAfterClear = chatInterface.getMessageCount();
        console.log(`${messageCountAfterClear < messageCountBeforeClear ? '✅' : '❌'} Messages cleared: ${messageCountBeforeClear} → ${messageCountAfterClear}`);
        
        // Check if welcome message was restored
        const welcomeExists = chatInterface.getChatMessages()?.querySelector('.chat-welcome') !== null;
        console.log(`${welcomeExists ? '✅' : '❌'} Welcome message restored: ${welcomeExists}`);
        console.groupEnd();
        
        // Test 15: Error handling
        console.group('🧪 Test 15: Error Handling');
        try {
            // Test with invalid image type
            const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
            await chatInterface.handleImageFile(invalidFile);
            console.log('❌ Should have thrown error for invalid file type');
        } catch (error) {
            console.log(`✅ Invalid file type rejected: ${error.message}`);
        }
        
        try {
            // Test with oversized file (mock)
            const oversizedData = new Array(6 * 1024 * 1024).fill('x').join(''); // 6MB
            const oversizedFile = new File([oversizedData], 'large.png', { type: 'image/png' });
            await chatInterface.handleImageFile(oversizedFile);
            console.log('❌ Should have thrown error for oversized file');
        } catch (error) {
            console.log(`✅ Oversized file rejected: ${error.message}`);
        }
        console.groupEnd();
        
        // Cleanup
        chatInterface.destroy();
        
        Debug.success('ChatInterfaceTest', 'All chat interface tests completed');
        
        return {
            success: true,
            component: chatInterface,
            finalState: chatInterface.getState(),
            messageCount: chatInterface.getMessageCount(),
            imageCount: chatInterface.getImages().length
        };
        
    } catch (error) {
        Debug.error('ChatInterfaceTest', 'Chat interface test failed', error);
        throw error;
    }
}

// Test message formatting and rendering
export function testMessageFormatting() {
    console.log('✨ Testing message formatting...');
    
    const chatInterface = new ChatInterface();
    chatInterface.init();
    
    // Test different message types
    const messageTypes = [
        { type: 'user', content: 'Hello, this is a user message!' },
        { type: 'assistant', content: 'This is an assistant response with some longer text to test wrapping behavior.' },
        { type: 'system', content: '✅ This is a system notification message.' },
        { type: 'error', content: '❌ This is an error message for testing.' }
    ];
    
    messageTypes.forEach((msg, index) => {
        chatInterface.addMessage(msg.type, msg.content);
        console.log(`${index + 1}. Added ${msg.type} message: "${msg.content.substring(0, 30)}..."`);
    });
    
    console.log(`Total messages after formatting test: ${chatInterface.getMessageCount()}`);
    
    return chatInterface;
}

// Test slash command parsing
export function testSlashCommands() {
    console.log('⚡ Testing slash command parsing...');
    
    const chatInterface = new ChatInterface();
    chatInterface.init();
    
    // Mock dependencies
    chatInterface.injectDependencies({
        world: { getSystem: () => null },
        sessionSystem: { hasActiveSession: () => false },
        agentSystem: null,
        originEntity: { id: 'test-origin' }
    });
    
    const testCommands = [
        '/help',
        '/history',
        '/search test query',
        '/save',
        '/export',
        '/who',
        '/model',
        '/context',
        '/connect origin',
        '/delete help',
        '/titles',
        '/start'
    ];
    
    let commandsProcessed = 0;
    chatInterface.subscribe('command:executed', () => {
        commandsProcessed++;
    });
    
    // Test each command
    testCommands.forEach(async (command) => {
        try {
            await chatInterface.handleSlashCommand(command);
            console.log(`✅ Command processed: ${command}`);
        } catch (error) {
            console.log(`❌ Command failed: ${command} - ${error.message}`);
        }
    });
    
    setTimeout(() => {
        console.log(`Commands processed: ${commandsProcessed}/${testCommands.length}`);
    }, 100);
    
    return chatInterface;
}

// Make tests available globally for easy access
window.testChatInterface = testChatInterface;
window.testMessageFormatting = testMessageFormatting;
window.testSlashCommands = testSlashCommands;