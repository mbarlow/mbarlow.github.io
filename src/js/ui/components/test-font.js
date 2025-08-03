/**
 * Font Manager Test
 * Simple test to verify font manager functionality
 */

import { FontManager } from './FontManager.js';
import { templateRegistry } from '../templates/TemplateRegistry.js';
import { Debug } from '../utils/Debug.js';

export async function testFontManager() {
    Debug.log('FontTest', 'Starting font manager tests');
    
    try {
        // Initialize template registry
        await templateRegistry.init();
        
        // Test 1: Create font manager
        console.group('🧪 Test 1: Font Manager Creation');
        const fontManager = new FontManager();
        console.log('✅ Font manager created');
        console.groupEnd();
        
        // Test 2: Initialize font manager
        console.group('🧪 Test 2: Font Manager Initialization');
        fontManager.init();
        const currentFont = fontManager.getFont();
        console.log(`✅ Font manager initialized with font: ${currentFont}`);
        console.groupEnd();
        
        // Test 3: Get available fonts
        console.group('🧪 Test 3: Available Fonts');
        const categories = fontManager.getFontCategories();
        const fontNames = fontManager.getFontNames();
        console.log('Font categories:', categories.length);
        console.log('Total fonts:', fontNames.length);
        console.log('Font names:', fontNames);
        console.groupEnd();
        
        // Test 4: Font switching
        console.group('🧪 Test 4: Font Switching');
        const testFonts = ['Inter', 'JetBrains Mono', 'Roboto', 'Fira Code'];
        for (const font of testFonts) {
            if (fontManager.isValidFont(font)) {
                const success = fontManager.setFont(font);
                const current = fontManager.getFont();
                console.log(`${success ? '✅' : '❌'} Set font to ${font}, current: ${current}`);
            } else {
                console.log(`⚠️ Font not available: ${font}`);
            }
        }
        console.groupEnd();
        
        // Test 5: Invalid font handling
        console.group('🧪 Test 5: Invalid Font Handling');
        const invalidResult = fontManager.setFont('Invalid-Font-Name');
        console.log(`${!invalidResult ? '✅' : '❌'} Invalid font rejected: ${invalidResult}`);
        console.groupEnd();
        
        // Test 6: Font search
        console.group('🧪 Test 6: Font Search');
        const monoFonts = fontManager.searchFonts('mono');
        const robotoFonts = fontManager.searchFonts('roboto');
        console.log(`Mono fonts found: ${monoFonts.length}`, monoFonts.map(f => f.name));
        console.log(`Roboto fonts found: ${robotoFonts.length}`, robotoFonts.map(f => f.name));
        console.groupEnd();
        
        // Test 7: Font categories
        console.group('🧪 Test 7: Font Categories');
        const monospace = fontManager.getFontsByCategory('monospace');
        const sansSerif = fontManager.getFontsByCategory('sans-serif');
        console.log(`Monospace fonts: ${monospace.length}`, monospace.map(f => f.name));
        console.log(`Sans-serif fonts: ${sansSerif.length}`, sansSerif.map(f => f.name));
        console.groupEnd();
        
        // Test 8: Dropdown functionality
        console.group('🧪 Test 8: Dropdown Functionality');
        console.log('Initial dropdown state:', fontManager.isDropdownOpen);
        
        fontManager.showDropdown();
        console.log(`${fontManager.isDropdownOpen ? '✅' : '❌'} Dropdown opened: ${fontManager.isDropdownOpen}`);
        
        fontManager.hideDropdown();
        console.log(`${!fontManager.isDropdownOpen ? '✅' : '❌'} Dropdown closed: ${fontManager.isDropdownOpen}`);
        
        fontManager.toggleDropdown();
        console.log(`Dropdown toggled to: ${fontManager.isDropdownOpen}`);
        
        fontManager.toggleDropdown();
        console.log(`Dropdown toggled to: ${fontManager.isDropdownOpen}`);
        console.groupEnd();
        
        // Test 9: State management
        console.group('🧪 Test 9: State Management');
        const state = fontManager.getState();
        console.log('Current state:', state);
        
        // Change font and dropdown state
        fontManager.setFont('JetBrains Mono');
        fontManager.showDropdown();
        
        // Restore state
        fontManager.setState({ currentFont: 'Inter', isDropdownOpen: false });
        const restoredFont = fontManager.getFont();
        const restoredDropdown = fontManager.isDropdownOpen;
        console.log(`${restoredFont === 'Inter' ? '✅' : '❌'} Font restoration: ${restoredFont}`);
        console.log(`${!restoredDropdown ? '✅' : '❌'} Dropdown restoration: ${restoredDropdown}`);
        console.groupEnd();
        
        // Test 10: Template rendering
        console.group('🧪 Test 10: Template Rendering');
        try {
            const dropdownHtml = fontManager.renderFontDropdown();
            const hasAllCategories = categories.every(cat => 
                dropdownHtml.includes(cat.title)
            );
            console.log(`${hasAllCategories ? '✅' : '❌'} Font dropdown template rendered correctly`);
            console.log('Rendered HTML (first 150 chars):', dropdownHtml.substring(0, 150) + '...');
        } catch (error) {
            console.log('❌ Template rendering failed:', error.message);
        }
        console.groupEnd();
        
        // Test 11: DOM updates
        console.group('🧪 Test 11: DOM Updates');
        const bodyFont = document.body.getAttribute('data-font');
        const currentManagerFont = fontManager.getFont();
        console.log(`${bodyFont === currentManagerFont ? '✅' : '❌'} Body attribute matches font: ${bodyFont} === ${currentManagerFont}`);
        console.groupEnd();
        
        // Test 12: Event handling
        console.group('🧪 Test 12: Event Handling');
        let eventReceived = false;
        fontManager.subscribe('font:changed', (data) => {
            eventReceived = true;
            console.log('Font change event received:', data);
        });
        
        fontManager.setFont('Roboto');
        setTimeout(() => {
            console.log(`${eventReceived ? '✅' : '❌'} Font change event handling`);
        }, 10);
        console.groupEnd();
        
        // Cleanup
        fontManager.destroy();
        
        Debug.success('FontTest', 'All font manager tests completed');
        
        return {
            success: true,
            manager: fontManager,
            finalFont: fontManager.getFont(),
            totalFonts: fontNames.length,
            categories: categories.length
        };
        
    } catch (error) {
        Debug.error('FontTest', 'Font manager test failed', error);
        throw error;
    }
}

// Test dropdown interaction (manual test)
export function testDropdownInteraction() {
    console.log('🖱️ Testing dropdown interaction...');
    console.log('Click the font toggle button to test dropdown show/hide');
    console.log('Click font options to test font switching');
    console.log('Press Escape to test keyboard closing');
    console.log('Click outside dropdown to test outside click closing');
}

// Test font preview
export function testFontPreview() {
    const fonts = ['Inter', 'JetBrains Mono', 'Roboto', 'Fira Code', 'Open Sans'];
    
    console.group('🎨 Font Preview Test');
    fonts.forEach(font => {
        const testText = 'The quick brown fox jumps over the lazy dog 0123456789';
        const div = document.createElement('div');
        div.style.fontFamily = font;
        div.style.fontSize = '14px';
        div.style.padding = '8px';
        div.style.margin = '4px 0';
        div.style.border = '1px solid #ccc';
        div.innerHTML = `<strong>${font}:</strong> ${testText}`;
        
        console.log(`Font: ${font}`);
        // You could append this to the DOM for visual testing
        // document.body.appendChild(div);
    });
    console.groupEnd();
}

// Make tests available globally for easy access
window.testFontManager = testFontManager;
window.testDropdownInteraction = testDropdownInteraction;
window.testFontPreview = testFontPreview;