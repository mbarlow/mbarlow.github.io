/**
 * Theme Manager Test
 * Simple test to verify theme manager functionality
 */

import { ThemeManager } from './ThemeManager.js';
import { templateRegistry } from '../templates/TemplateRegistry.js';
import { Debug } from '../utils/Debug.js';

export async function testThemeManager() {
    Debug.log('ThemeTest', 'Starting theme manager tests');
    
    try {
        // Initialize template registry
        await templateRegistry.init();
        
        // Test 1: Create theme manager
        console.group('🧪 Test 1: Theme Manager Creation');
        const themeManager = new ThemeManager();
        console.log('✅ Theme manager created');
        console.groupEnd();
        
        // Test 2: Initialize theme manager
        console.group('🧪 Test 2: Theme Manager Initialization');
        themeManager.init();
        const currentTheme = themeManager.getTheme();
        console.log(`✅ Theme manager initialized with theme: ${currentTheme}`);
        console.groupEnd();
        
        // Test 3: Get available themes
        console.group('🧪 Test 3: Available Themes');
        const themes = themeManager.getThemes();
        const themeNames = themeManager.getThemeNames();
        console.log('Available themes:', themeNames);
        console.log('Theme objects:', themes);
        console.groupEnd();
        
        // Test 4: Theme switching
        console.group('🧪 Test 4: Theme Switching');
        const testThemes = ['light', 'dark', 'grey'];
        for (const theme of testThemes) {
            const success = themeManager.setTheme(theme);
            const current = themeManager.getTheme();
            console.log(`${success ? '✅' : '❌'} Set theme to ${theme}, current: ${current}`);
        }
        console.groupEnd();
        
        // Test 5: Invalid theme handling
        console.group('🧪 Test 5: Invalid Theme Handling');
        const invalidResult = themeManager.setTheme('invalid-theme');
        console.log(`${!invalidResult ? '✅' : '❌'} Invalid theme rejected: ${invalidResult}`);
        console.groupEnd();
        
        // Test 6: Theme cycling
        console.group('🧪 Test 6: Theme Cycling');
        const initialTheme = themeManager.getTheme();
        themeManager.nextTheme();
        const nextTheme = themeManager.getTheme();
        themeManager.previousTheme();
        const prevTheme = themeManager.getTheme();
        console.log(`Initial: ${initialTheme}, Next: ${nextTheme}, Previous: ${prevTheme}`);
        console.log(`${prevTheme === initialTheme ? '✅' : '❌'} Theme cycling works correctly`);
        console.groupEnd();
        
        // Test 7: State management
        console.group('🧪 Test 7: State Management');
        const state = themeManager.getState();
        console.log('Current state:', state);
        
        // Change theme
        themeManager.setTheme('light');
        
        // Restore state
        themeManager.setState({ currentTheme: 'dark' });
        const restoredTheme = themeManager.getTheme();
        console.log(`${restoredTheme === 'dark' ? '✅' : '❌'} State restoration: ${restoredTheme}`);
        console.groupEnd();
        
        // Test 8: Template rendering
        console.group('🧪 Test 8: Template Rendering');
        try {
            const selectorHtml = themeManager.renderThemeSelector();
            const hasAllThemes = themeNames.every(theme => selectorHtml.includes(theme));
            console.log(`${hasAllThemes ? '✅' : '❌'} Theme selector template rendered correctly`);
            console.log('Rendered HTML (first 100 chars):', selectorHtml.substring(0, 100) + '...');
        } catch (error) {
            console.log('❌ Template rendering failed:', error.message);
        }
        console.groupEnd();
        
        // Test 9: DOM updates
        console.group('🧪 Test 9: DOM Updates');
        const bodyTheme = document.body.getAttribute('data-theme');
        const currentManagerTheme = themeManager.getTheme();
        console.log(`${bodyTheme === currentManagerTheme ? '✅' : '❌'} Body attribute matches theme: ${bodyTheme} === ${currentManagerTheme}`);
        console.groupEnd();
        
        // Test 10: Event handling
        console.group('🧪 Test 10: Event Handling');
        let eventReceived = false;
        themeManager.subscribe('theme:changed', (data) => {
            eventReceived = true;
            console.log('Theme change event received:', data);
        });
        
        themeManager.setTheme('grey');
        setTimeout(() => {
            console.log(`${eventReceived ? '✅' : '❌'} Theme change event handling`);
        }, 10);
        console.groupEnd();
        
        // Cleanup
        themeManager.destroy();
        
        Debug.success('ThemeTest', 'All theme manager tests completed');
        
        return {
            success: true,
            manager: themeManager,
            finalTheme: themeManager.getTheme()
        };
        
    } catch (error) {
        Debug.error('ThemeTest', 'Theme manager test failed', error);
        throw error;
    }
}

// Test keyboard shortcuts (manual test)
export function testKeyboardShortcuts() {
    console.log('🎹 Testing keyboard shortcuts...');
    console.log('Press keys 1, 2, or 3 to test theme switching');
    console.log('Check that themes change accordingly');
    
    document.addEventListener('keydown', (e) => {
        if (['1', '2', '3'].includes(e.key)) {
            console.log(`Key ${e.key} pressed - theme should change`);
        }
    });
}

// Make tests available globally for easy access
window.testThemeManager = testThemeManager;
window.testKeyboardShortcuts = testKeyboardShortcuts;