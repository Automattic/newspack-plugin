/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import EmailPreview from './email-preview';

// Mock @wordpress/api-fetch — jest.mock is hoisted above imports.
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

// Store observer instances so tests can trigger intersection.
let observerInstances = [];

// Default IntersectionObserver mock: triggers immediately.
function createObserverMock( triggerImmediately = true ) {
	observerInstances = [];
	global.IntersectionObserver = class {
		constructor( callback ) {
			this.callback = callback;
			observerInstances.push( this );
		}
		observe() {
			if ( triggerImmediately ) {
				this.callback( [ { isIntersecting: true } ] );
			}
		}
		disconnect() {}
	};
}

// ResizeObserver mock: immediately reports a 300px-wide container.
global.ResizeObserver = class {
	constructor( callback ) {
		this.callback = callback;
	}
	observe() {
		this.callback( [ { contentRect: { width: 300 } } ] );
	}
	disconnect() {}
};

/**
 * Helper: simulate iframe onLoad and stub contentDocument so
 * handleIframeLoad resolves immediately (no pending assets).
 */
function simulateIframeLoad( iframe ) {
	Object.defineProperty( iframe, 'contentDocument', {
		value: {
			querySelectorAll: () => [],
			body: { scrollHeight: 900 },
		},
		configurable: true,
	} );
	iframe.dispatchEvent( new Event( 'load' ) );
}

describe( 'EmailPreview', () => {
	beforeEach( () => {
		apiFetch.mockReset();
		createObserverMock( true );
	} );

	it( 'renders loading state while fetching', async () => {
		// Keep the promise pending so we can observe the loading state.
		apiFetch.mockReturnValue( new Promise( () => {} ) );

		render( <EmailPreview postId={ 123 } /> );

		expect( screen.getByRole( 'presentation' ) ).toBeTruthy();
	} );

	it( 'renders iframe on successful fetch and gains is-ready after load', async () => {
		apiFetch.mockResolvedValue( {
			html: '<html><body><p>Hello Sample Reader</p></body></html>',
			post_id: 123,
		} );

		render( <EmailPreview postId={ 123 } /> );

		await waitFor( () => {
			const iframe = document.querySelector( '.newspack-email-preview__iframe' );
			expect( iframe ).toBeTruthy();
			expect( iframe.getAttribute( 'srcdoc' ) ).toContain( 'Sample Reader' );
		} );

		// Before onLoad the container should NOT have is-ready.
		const container = document.querySelector( '.newspack-email-preview' );
		expect( container.classList.contains( 'is-ready' ) ).toBe( false );

		// Simulate iframe load.
		const iframe = document.querySelector( '.newspack-email-preview__iframe' );
		simulateIframeLoad( iframe );

		await waitFor( () => {
			expect( container.classList.contains( 'is-ready' ) ).toBe( true );
		} );
	} );

	it( 'renders fallback placeholder on fetch error', async () => {
		apiFetch.mockRejectedValue( new Error( 'Server error' ) );

		render( <EmailPreview postId={ 456 } /> );

		await waitFor( () => {
			const placeholder = document.querySelector( '.newspack-email-preview__placeholder' );
			expect( placeholder ).toBeTruthy();
			// No iframe should be present.
			expect( document.querySelector( '.newspack-email-preview__iframe' ) ).toBeNull();
		} );
	} );

	it( 'does not fetch until element is visible', () => {
		// Observer that does NOT trigger intersection.
		createObserverMock( false );

		render( <EmailPreview postId={ 789 } /> );

		expect( apiFetch ).not.toHaveBeenCalled();
	} );

	it( 'fetches the correct endpoint path', async () => {
		apiFetch.mockResolvedValue( { html: '<p>Test</p>', post_id: 42 } );

		render( <EmailPreview postId={ 42 } /> );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/newspack/v1/wizard/newspack-settings/emails/42/preview',
			} );
		} );
	} );

	it( 'resets state when postId changes', async () => {
		apiFetch.mockResolvedValue( {
			html: '<html><body><p>First email</p></body></html>',
			post_id: 1,
		} );

		const { rerender } = render( <EmailPreview postId={ 1 } /> );

		// Wait for first render to complete.
		await waitFor( () => {
			const iframe = document.querySelector( '.newspack-email-preview__iframe' );
			expect( iframe ).toBeTruthy();
		} );

		// Simulate onLoad for first email.
		simulateIframeLoad( document.querySelector( '.newspack-email-preview__iframe' ) );
		await waitFor( () => {
			expect( document.querySelector( '.newspack-email-preview' ).classList.contains( 'is-ready' ) ).toBe( true );
		} );

		// Change postId — should reset and re-fetch.
		apiFetch.mockResolvedValue( {
			html: '<html><body><p>Second email</p></body></html>',
			post_id: 2,
		} );

		rerender( <EmailPreview postId={ 2 } /> );

		// is-ready should be removed during re-fetch.
		await waitFor( () => {
			expect( document.querySelector( '.newspack-email-preview' ).classList.contains( 'is-ready' ) ).toBe( false );
		} );

		// New iframe should appear with updated content.
		await waitFor( () => {
			const iframe = document.querySelector( '.newspack-email-preview__iframe' );
			expect( iframe ).toBeTruthy();
			expect( iframe.getAttribute( 'srcdoc' ) ).toContain( 'Second email' );
		} );
	} );
} );
