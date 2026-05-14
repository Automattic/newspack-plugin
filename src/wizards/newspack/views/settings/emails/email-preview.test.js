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

	it( 'renders iframe on successful fetch', async () => {
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
} );
