/**
 * Sidebar Component Test
 * Test suite for sidebar functionality
 */

import { Sidebar } from './Sidebar.js';
import { Debug } from '../utils/Debug.js';

export async function testSidebar() {
    Debug.log('SidebarTest', 'Starting sidebar tests');
    
    try {
        // Test 1: Create sidebar
        console.group('🧪 Test 1: Sidebar Creation');
        const sidebar = new Sidebar();
        console.log('✅ Sidebar created');
        console.groupEnd();
        
        // Test 2: Initialize sidebar
        console.group('🧪 Test 2: Sidebar Initialization');
        sidebar.init();
        const isCollapsed = sidebar.isCollapsedState();
        const isExpanded = sidebar.isExpanded();
        console.log(`✅ Sidebar initialized - collapsed: ${isCollapsed}, expanded: ${isExpanded}`);
        console.groupEnd();
        
        // Test 3: Get sidebar elements
        console.group('🧪 Test 3: Element Access');
        const sidebarElement = sidebar.getSidebarElement();
        const toggleElement = sidebar.getToggleElement();
        console.log(`${sidebarElement ? '✅' : '⚠️'} Sidebar element found: ${!!sidebarElement}`);
        console.log(`${toggleElement ? '✅' : '⚠️'} Toggle element found: ${!!toggleElement}`);
        console.groupEnd();
        
        // Test 4: State management
        console.group('🧪 Test 4: State Management');
        const initialState = sidebar.getState();
        console.log('Initial state:', initialState);
        
        // Test collapse
        const collapseResult = sidebar.collapse();
        const collapsedState = sidebar.isCollapsedState();
        console.log(`${collapseResult ? '✅' : '❌'} Collapse operation: ${collapseResult}, state: ${collapsedState}`);
        
        // Test expand
        const expandResult = sidebar.expand();
        const expandedState = sidebar.isExpanded();
        console.log(`${expandResult ? '✅' : '❌'} Expand operation: ${expandResult}, state: ${expandedState}`);
        console.groupEnd();
        
        // Test 5: Toggle functionality
        console.group('🧪 Test 5: Toggle Functionality');
        const beforeToggle = sidebar.isCollapsedState();
        sidebar.toggle();
        const afterToggle = sidebar.isCollapsedState();
        console.log(`${beforeToggle !== afterToggle ? '✅' : '❌'} Toggle changed state: ${beforeToggle} → ${afterToggle}`);
        
        // Toggle back
        sidebar.toggle();
        const afterSecondToggle = sidebar.isCollapsedState();
        console.log(`${beforeToggle === afterSecondToggle ? '✅' : '❌'} Second toggle restored: ${afterSecondToggle}`);
        console.groupEnd();
        
        // Test 6: Width information
        console.group('🧪 Test 6: Width Information');
        const widthInfo = sidebar.getWidthInfo();
        console.log('Width info:', widthInfo);
        console.log(`${widthInfo ? '✅' : '❌'} Width info available: ${!!widthInfo}`);
        console.groupEnd();
        
        // Test 7: Responsive behavior
        console.group('🧪 Test 7: Responsive Behavior');
        const originalMobile = sidebar.isMobile;
        
        // Force mobile mode
        sidebar.setMobileMode(true);
        const mobileCollapseResult = sidebar.collapse();
        console.log(`${!mobileCollapseResult ? '✅' : '❌'} Mobile collapse prevented: ${!mobileCollapseResult}`);
        
        // Force desktop mode
        sidebar.setMobileMode(false);
        const desktopCollapseResult = sidebar.collapse();
        console.log(`${desktopCollapseResult ? '✅' : '❌'} Desktop collapse allowed: ${desktopCollapseResult}`);
        
        // Restore original mode
        sidebar.setMobileMode(originalMobile);
        console.groupEnd();
        
        // Test 8: Breakpoint configuration
        console.group('🧪 Test 8: Breakpoint Configuration');
        const originalBreakpoints = { ...sidebar.config.breakpoints };
        
        sidebar.setBreakpoints({ mobile: 600, tablet: 900 });
        const newBreakpoints = sidebar.config.breakpoints;
        console.log(`${newBreakpoints.mobile === 600 ? '✅' : '❌'} Mobile breakpoint updated: ${newBreakpoints.mobile}`);
        console.log(`${newBreakpoints.tablet === 900 ? '✅' : '❌'} Tablet breakpoint updated: ${newBreakpoints.tablet}`);
        
        // Restore original breakpoints
        sidebar.setBreakpoints(originalBreakpoints);
        console.groupEnd();
        
        // Test 9: CSS class manipulation
        console.group('🧪 Test 9: CSS Class Manipulation');
        sidebar.addClass('test-class');
        const sidebarEl = sidebar.getSidebarElement();
        let hasTestClass = sidebarEl ? sidebarEl.classList.contains('test-class') : false;
        console.log(`${hasTestClass ? '✅' : '❌'} CSS class added: ${hasTestClass}`);
        
        sidebar.removeClass('test-class');
        hasTestClass = sidebarEl ? sidebarEl.classList.contains('test-class') : true;
        console.log(`${!hasTestClass ? '✅' : '❌'} CSS class removed: ${!hasTestClass}`);
        console.groupEnd();
        
        // Test 10: State persistence
        console.group('🧪 Test 10: State Persistence');
        // Collapse and save
        sidebar.collapse(true);
        
        // Load state (simulating page refresh)
        const savedState = sidebar.loadState();
        console.log(`${savedState ? '✅' : '❌'} State saved and loaded correctly: ${savedState}`);
        
        // Expand to reset
        sidebar.expand(true);
        console.groupEnd();
        
        // Test 11: Configuration updates
        console.group('🧪 Test 11: Configuration Updates');
        const newConfig = {
            storageKey: 'test-sidebar-collapsed',
            classes: { collapsed: 'test-collapsed' }
        };
        
        sidebar.updateConfig(newConfig);
        console.log(`${sidebar.config.storageKey === 'test-sidebar-collapsed' ? '✅' : '❌'} Storage key updated`);
        console.log(`${sidebar.config.classes.collapsed === 'test-collapsed' ? '✅' : '❌'} CSS class updated`);
        console.groupEnd();
        
        // Test 12: State restoration
        console.group('🧪 Test 12: State Restoration');
        const testState = {
            isCollapsed: true,
            isMobile: false
        };
        
        sidebar.setState(testState);
        const restoredCollapsed = sidebar.isCollapsedState();
        console.log(`${restoredCollapsed === testState.isCollapsed ? '✅' : '❌'} Collapsed state restored: ${restoredCollapsed}`);
        console.groupEnd();
        
        // Test 13: Event handling
        console.group('🧪 Test 13: Event Handling');
        let eventReceived = false;
        sidebar.subscribe('sidebar:toggled', (data) => {
            eventReceived = true;
            console.log('Sidebar toggle event received:', data);
        });
        
        sidebar.toggle();
        setTimeout(() => {
            console.log(`${eventReceived ? '✅' : '❌'} Sidebar toggle event handling`);
        }, 10);
        console.groupEnd();
        
        // Test 14: Error handling
        console.group('🧪 Test 14: Error Handling');
        // Test with invalid selectors
        const sidebarWithBadConfig = new Sidebar({
            config: {
                selectors: {
                    sidebar: '#non-existent-sidebar',
                    toggle: '#non-existent-toggle'
                }
            }
        });
        
        sidebarWithBadConfig.init();
        const badToggleResult = sidebarWithBadConfig.toggle();
        console.log(`${!badToggleResult ? '✅' : '❌'} Invalid selector handling: ${!badToggleResult}`);
        console.groupEnd();
        
        // Test 15: Keyboard shortcuts (manual)
        console.group('🧪 Test 15: Keyboard Shortcuts');
        console.log('⌨️ Press Ctrl+B or Cmd+B to test keyboard toggle');
        console.log('(This test requires manual interaction)');
        
        let keyboardEventReceived = false;
        const keyboardTestHandler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                keyboardEventReceived = true;
                console.log('✅ Keyboard shortcut detected');
                document.removeEventListener('keydown', keyboardTestHandler);
            }
        };
        
        document.addEventListener('keydown', keyboardTestHandler);
        setTimeout(() => {
            if (!keyboardEventReceived) {
                console.log('⏳ Keyboard shortcut test pending user input');
                document.removeEventListener('keydown', keyboardTestHandler);
            }
        }, 2000);
        console.groupEnd();
        
        // Cleanup
        sidebar.destroy();
        
        Debug.success('SidebarTest', 'All sidebar tests completed');
        
        return {
            success: true,
            manager: sidebar,
            finalState: sidebar.getState(),
            widthInfo: sidebar.getWidthInfo()
        };
        
    } catch (error) {
        Debug.error('SidebarTest', 'Sidebar test failed', error);
        throw error;
    }
}

// Test responsive behavior (manual test)
export function testResponsiveBehavior() {
    console.log('📱 Testing sidebar responsive behavior...');
    console.log('Resize window to test mobile/desktop breakpoints');
    console.log('Check that sidebar behaves correctly at different screen sizes');
    
    const sidebar = new Sidebar();
    sidebar.init();
    
    window.addEventListener('resize', () => {
        const widthInfo = sidebar.getWidthInfo();
        console.log('Window resized:', {
            width: window.innerWidth,
            sidebarInfo: widthInfo
        });
    });
    
    return sidebar;
}

// Test localStorage persistence (manual test)
export function testPersistence() {
    console.log('💾 Testing sidebar state persistence...');
    
    const sidebar = new Sidebar();
    sidebar.init();
    
    console.log('1. Toggle sidebar and refresh page to test persistence');
    console.log('2. Check that sidebar state is restored correctly');
    
    // Add test buttons for manual testing
    const testContainer = document.createElement('div');
    testContainer.innerHTML = `
        <div style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: #333; color: white; padding: 10px; border-radius: 5px;">
            <h4>Sidebar Persistence Test</h4>
            <button id="test-collapse">Collapse</button>
            <button id="test-expand">Expand</button>
            <button id="test-toggle">Toggle</button>
            <button id="test-refresh">Refresh Page</button>
            <div id="test-status"></div>
        </div>
    `;
    
    document.body.appendChild(testContainer);
    
    const updateStatus = () => {
        const status = document.getElementById('test-status');
        if (status) {
            status.innerHTML = `
                <small>
                    Collapsed: ${sidebar.isCollapsedState()}<br>
                    Mobile: ${sidebar.isMobile}<br>
                    Saved: ${sidebar.loadState()}
                </small>
            `;
        }
    };
    
    document.getElementById('test-collapse')?.addEventListener('click', () => {
        sidebar.collapse();
        updateStatus();
    });
    
    document.getElementById('test-expand')?.addEventListener('click', () => {
        sidebar.expand();
        updateStatus();
    });
    
    document.getElementById('test-toggle')?.addEventListener('click', () => {
        sidebar.toggle();
        updateStatus();
    });
    
    document.getElementById('test-refresh')?.addEventListener('click', () => {
        window.location.reload();
    });
    
    updateStatus();
    
    return sidebar;
}

// Make tests available globally for easy access
window.testSidebar = testSidebar;
window.testSidebarResponsive = testResponsiveBehavior;
window.testSidebarPersistence = testPersistence;