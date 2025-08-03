/**
 * Navigation Component Test
 * Test suite for navigation functionality
 */

import { Navigation } from './Navigation.js';
import { templateRegistry } from '../templates/TemplateRegistry.js';
import { Debug } from '../utils/Debug.js';

export async function testNavigation() {
    Debug.log('NavigationTest', 'Starting navigation tests');
    
    try {
        // Initialize template registry
        await templateRegistry.init();
        
        // Test 1: Create navigation
        console.group('🧪 Test 1: Navigation Creation');
        const navigation = new Navigation();
        console.log('✅ Navigation created');
        console.groupEnd();
        
        // Test 2: Initialize navigation
        console.group('🧪 Test 2: Navigation Initialization');
        navigation.init();
        const currentView = navigation.getCurrentView();
        console.log(`✅ Navigation initialized with view: ${currentView}`);
        console.groupEnd();
        
        // Test 3: Get available views
        console.group('🧪 Test 3: Available Views');
        const views = navigation.getViews();
        const viewNames = navigation.getViewNames();
        console.log('Available views:', viewNames);
        console.log('View objects:', views);
        console.groupEnd();
        
        // Test 4: View switching
        console.group('🧪 Test 4: View Switching');
        const testViews = ['chat', 'projects', 'about'];
        for (const view of testViews) {
            if (navigation.isValidView(view)) {
                const success = navigation.switchView(view);
                const current = navigation.getCurrentView();
                console.log(`${success ? '✅' : '❌'} Switch to ${view}, current: ${current}`);
            } else {
                console.log(`⚠️ View not available: ${view}`);
            }
        }
        console.groupEnd();
        
        // Test 5: Invalid view handling
        console.group('🧪 Test 5: Invalid View Handling');
        const invalidResult = navigation.switchView('invalid-view');
        console.log(`${!invalidResult ? '✅' : '❌'} Invalid view rejected: ${invalidResult}`);
        console.groupEnd();
        
        // Test 6: View cycling
        console.group('🧪 Test 6: View Cycling');
        const initialView = navigation.getCurrentView();
        navigation.nextView();
        const nextView = navigation.getCurrentView();
        navigation.previousView();
        const prevView = navigation.getCurrentView();
        console.log(`Initial: ${initialView}, Next: ${nextView}, Previous: ${prevView}`);
        console.log(`${prevView === initialView ? '✅' : '❌'} View cycling works correctly`);
        console.groupEnd();
        
        // Test 7: Navigation history
        console.group('🧪 Test 7: Navigation History');
        navigation.switchView('projects');
        navigation.switchView('about');
        navigation.switchView('chat');
        
        const history = navigation.getHistory();
        console.log('Navigation history:', history);
        console.log(`${history.length >= 3 ? '✅' : '❌'} History tracking works`);
        
        navigation.goBack();
        const afterBack = navigation.getCurrentView();
        console.log(`${afterBack === 'about' ? '✅' : '❌'} Go back functionality: ${afterBack}`);
        console.groupEnd();
        
        // Test 8: View validation
        console.group('🧪 Test 8: View Validation');
        const validTests = [
            { view: 'chat', expected: true },
            { view: 'projects', expected: true },
            { view: 'about', expected: true },
            { view: 'invalid', expected: false },
            { view: '', expected: false },
            { view: null, expected: false }
        ];
        
        validTests.forEach(test => {
            const result = navigation.isValidView(test.view);
            console.log(`${result === test.expected ? '✅' : '❌'} isValidView('${test.view}'): ${result}`);
        });
        console.groupEnd();
        
        // Test 9: Get view by name
        console.group('🧪 Test 9: Get View by Name');
        const chatView = navigation.getView('chat');
        const invalidView = navigation.getView('invalid');
        console.log(`${chatView && chatView.id === 'chat' ? '✅' : '❌'} Get valid view:`, chatView?.id);
        console.log(`${invalidView === null ? '✅' : '❌'} Get invalid view:`, invalidView);
        console.groupEnd();
        
        // Test 10: Add/Remove views
        console.group('🧪 Test 10: Add/Remove Views');
        const newView = {
            id: 'settings',
            label: 'Settings',
            icon: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>',
            viewId: 'settings-view'
        };
        
        const addResult = navigation.addView(newView);
        console.log(`${addResult ? '✅' : '❌'} Add view: ${addResult}`);
        console.log('Views after add:', navigation.getViewNames());
        
        const removeResult = navigation.removeView('settings');
        console.log(`${removeResult ? '✅' : '❌'} Remove view: ${removeResult}`);
        console.log('Views after remove:', navigation.getViewNames());
        console.groupEnd();
        
        // Test 11: State management
        console.group('🧪 Test 11: State Management');
        const state = navigation.getState();
        console.log('Current state:', state);
        
        // Change view
        navigation.switchView('projects');
        
        // Restore state
        navigation.setState({ currentView: 'chat', viewHistory: ['chat', 'about'] });
        const restoredView = navigation.getCurrentView();
        const restoredHistory = navigation.getHistory();
        console.log(`${restoredView === 'chat' ? '✅' : '❌'} View restoration: ${restoredView}`);
        console.log(`${restoredHistory.includes('about') ? '✅' : '❌'} History restoration:`, restoredHistory);
        console.groupEnd();
        
        // Test 12: Template rendering
        console.group('🧪 Test 12: Template Rendering');
        try {
            const navHtml = navigation.renderNavigation();
            const hasAllViews = viewNames.every(view => navHtml.includes(view));
            console.log(`${hasAllViews ? '✅' : '❌'} Navigation template rendered correctly`);
            console.log('Rendered HTML (first 150 chars):', navHtml.substring(0, 150) + '...');
        } catch (error) {
            console.log('❌ Template rendering failed:', error.message);
        }
        console.groupEnd();
        
        // Test 13: Event handling
        console.group('🧪 Test 13: Event Handling');
        let eventReceived = false;
        navigation.subscribe('view:changed', (data) => {
            eventReceived = true;
            console.log('View change event received:', data);
        });
        
        navigation.switchView('about');
        setTimeout(() => {
            console.log(`${eventReceived ? '✅' : '❌'} View change event handling`);
        }, 10);
        console.groupEnd();
        
        // Cleanup
        navigation.destroy();
        
        Debug.success('NavigationTest', 'All navigation tests completed');
        
        return {
            success: true,
            manager: navigation,
            finalView: navigation.getCurrentView(),
            totalViews: viewNames.length,
            history: navigation.getHistory()
        };
        
    } catch (error) {
        Debug.error('NavigationTest', 'Navigation test failed', error);
        throw error;
    }
}

// Test keyboard shortcuts (manual test)
export function testKeyboardShortcuts() {
    console.log('⌨️ Testing navigation keyboard shortcuts...');
    console.log('Press Ctrl+1, Ctrl+2, Ctrl+3 to test view switching');
    console.log('Check that views change accordingly');
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && ['1', '2', '3'].includes(e.key)) {
            console.log(`Key Ctrl+${e.key} pressed - view should change`);
        }
    });
}

// Make tests available globally for easy access
window.testNavigation = testNavigation;
window.testNavigationKeyboardShortcuts = testKeyboardShortcuts;