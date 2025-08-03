/**
 * Template system test and demonstration
 * Run this to verify the template system works correctly
 */

import { templateRegistry } from './TemplateRegistry.js';
import { Debug } from '../utils/Debug.js';

export async function testTemplateSystem() {
    Debug.log('TemplateTest', 'Starting template system tests');
    
    try {
        // Initialize template registry
        await templateRegistry.init();
        
        // Test 1: Basic variable interpolation
        console.group('🧪 Test 1: Variable Interpolation');
        const messageHtml = templateRegistry.render('chatMessage', {
            type: 'user',
            id: 'msg-1',	
            sender: 'John Doe',
            content: 'Hello, world!',
            timestamp: Date.now(),
            showAvatar: true,
            showHeader: true
        });
        console.log('Rendered message:', messageHtml);
        console.groupEnd();
        
        // Test 2: Conditionals
        console.group('🧪 Test 2: Conditionals');
        const messageWithImages = templateRegistry.render('chatMessage', {
            type: 'user',
            id: 'msg-2',
            sender: 'Alice',
            content: 'Check out these images!',
            timestamp: Date.now(),
            showAvatar: true,
            showHeader: true,
            images: [
                { url: '/img1.jpg', alt: 'Image 1' },
                { url: '/img2.jpg', alt: 'Image 2' }
            ]
        });
        console.log('Message with images:', messageWithImages);
        console.groupEnd();
        
        // Test 3: Loops
        console.group('🧪 Test 3: Loops');
        const sessionList = templateRegistry.render('sessionItem', {
            id: 'session-1',
            title: 'Development Discussion',
            lastActivity: Date.now() - 300000, // 5 minutes ago
            active: true,
            participants: [
                { name: 'Developer', type: 'user' },
                { name: 'AI Assistant', type: 'ai' }
            ],
            messageCount: 42,
            imageCount: 3,
            images: [
                { thumbnail: '/thumb1.jpg' },
                { thumbnail: '/thumb2.jpg' },
                { thumbnail: '/thumb3.jpg' }
            ]
        });
        console.log('Session item:', sessionList);
        console.groupEnd();
        
        // Test 4: Filters
        console.group('🧪 Test 4: Filters');
        const buttonHtml = templateRegistry.render('common.button', {
            text: 'Click Me',
            class: 'btn-large',
            disabled: false,
            icon: '<path d="M5 12l5 5l10-10"/>',
            type: 'button'
        });
        console.log('Button with filters:', buttonHtml);
        console.groupEnd();
        
        // Test 5: Modal
        console.group('🧪 Test 5: Modal');
        const modalHtml = templateRegistry.render('sessionRenameModal', {
            show: true,
            currentTitle: 'Old Session Name'
        });
        console.log('Rename modal:', modalHtml);
        console.groupEnd();
        
        // Test 6: Context menu
        console.group('🧪 Test 6: Context Menu');
        const contextMenuHtml = templateRegistry.render('common.contextMenu', {
            show: true,
            x: 100,
            y: 200,
            items: [
                {
                    text: 'Copy',
                    action: 'copy',
                    icon: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'
                },
                { separator: true },
                {
                    text: 'Delete',
                    action: 'delete',
                    class: 'context-menu-danger',
                    icon: '<path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'
                }
            ]
        });
        console.log('Context menu:', contextMenuHtml);
        console.groupEnd();
        
        // Performance test
        console.group('⚡ Performance Test');
        const startTime = performance.now();
        for (let i = 0; i < 100; i++) {
            templateRegistry.render('chatMessage', {
                type: 'user',
                id: `msg-${i}`,
                sender: `User ${i}`,
                content: `Message number ${i}`,
                timestamp: Date.now(),
                showAvatar: true,
                showHeader: true
            });
        }
        const endTime = performance.now();
        console.log(`Rendered 100 messages in ${(endTime - startTime).toFixed(2)}ms`);
        console.groupEnd();
        
        // Validation test
        console.group('✅ Validation Test');
        const validationResults = templateRegistry.validate();
        const validCount = validationResults.filter(r => r.valid).length;
        console.log(`Template validation: ${validCount}/${validationResults.length} templates valid`);
        
        const invalidTemplates = validationResults.filter(r => !r.valid);
        if (invalidTemplates.length > 0) {
            console.warn('Invalid templates:', invalidTemplates);
        }
        console.groupEnd();
        
        Debug.success('TemplateTest', 'All template tests completed successfully');
        
        return {
            success: true,
            validationResults,
            performanceTime: endTime - startTime
        };
        
    } catch (error) {
        Debug.error('TemplateTest', 'Template test failed', error);
        throw error;
    }
}

// Make test available globally for easy access
window.testTemplateSystem = testTemplateSystem;