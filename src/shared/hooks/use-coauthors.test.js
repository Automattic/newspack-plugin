/**
 * External dependencies
 */
import { renderHook, act, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { useCoAuthors } from './use-coauthors';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

/**
 * Helper to create a mock select function for multiple stores.
 *
 * @param {Object} options               Mock options.
 * @param {Object} options.capStore      CAP store mock (null if unavailable).
 * @param {number} options.currentPostId Currently-edited post ID.
 * @param {Object} options.entityRecords Map of postId -> post entity record.
 * @return {Function} Mock select function.
 */
const createMockSelect = ( { capStore = null, currentPostId = 123, entityRecords = {} } = {} ) => {
	return storeName => {
		if ( storeName === 'cap/authors' ) {
			return capStore;
		}
		if ( storeName === 'core/editor' ) {
			return {
				getCurrentPostId: () => currentPostId,
			};
		}
		if ( storeName === 'core' ) {
			return {
				getEntityRecord: ( kind, type, id ) => entityRecords[ id ] || null,
			};
		}
		return null;
	};
};

describe( 'useCoAuthors', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Default: apiFetch resolves with empty object (no avatar_urls).
		apiFetch.mockResolvedValue( {} );
	} );

	describe( 'CAP store availability', () => {
		it( 'should return isCapAvailable false when CAP store is not available', () => {
			useSelect.mockImplementation( callback => callback( createMockSelect( { capStore: null } ) ) );

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			expect( result.current.authors ).toEqual( [] );
			expect( result.current.isCapAvailable ).toBe( false );
		} );

		it( 'should return isCapAvailable false when getAuthors is not a function', () => {
			useSelect.mockImplementation( callback => callback( createMockSelect( { capStore: {} } ) ) );

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			expect( result.current.authors ).toEqual( [] );
			expect( result.current.isCapAvailable ).toBe( false );
		} );
	} );

	describe( 'currently-edited post (uses CAP store)', () => {
		it( 'should return empty authors when CAP is available but no authors assigned', () => {
			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: () => [] },
						currentPostId: 123,
					} )
				)
			);

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			expect( result.current.authors ).toEqual( [] );
			expect( result.current.isCapAvailable ).toBe( true );
		} );

		it( 'should return empty authors when postId is falsy', () => {
			const getAuthorsMock = jest.fn( () => [] );
			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: getAuthorsMock },
						currentPostId: 123,
					} )
				)
			);

			const { result } = renderHook( () => useCoAuthors( null ) );

			expect( result.current.authors ).toEqual( [] );
			expect( result.current.isCapAvailable ).toBe( true );
		} );

		it( 'should map CAP authors to expected format', () => {
			const capAuthors = [
				{ id: 1, display: 'Jane Doe', value: 'jane-doe', label: 'Jane' },
				{ id: 2, display: 'John Smith', value: 'john-smith', label: 'John' },
			];

			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: () => capAuthors },
						currentPostId: 123,
					} )
				)
			);

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			expect( result.current.authors ).toEqual( [
				{ id: 1, display_name: 'Jane Doe', user_nicename: 'jane-doe', isGuest: false },
				{ id: 2, display_name: 'John Smith', user_nicename: 'john-smith', isGuest: false },
			] );
			expect( result.current.isCapAvailable ).toBe( true );
		} );

		it( 'should set isGuest to true for guest-author userType', () => {
			const capAuthors = [
				{ id: 1, display: 'Jane Doe', value: 'jane-doe', userType: 'wpuser' },
				{ id: 1591, display: 'Guest Writer', value: 'guest-writer', userType: 'guest-author' },
			];

			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: () => capAuthors },
						currentPostId: 123,
					} )
				)
			);

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			expect( result.current.authors[ 0 ].isGuest ).toBe( false );
			expect( result.current.authors[ 1 ].isGuest ).toBe( true );
		} );

		it( 'should fallback to value then label for display_name', () => {
			const capAuthors = [
				{ id: 1, value: 'from-value', label: 'From Label' }, // no display
				{ id: 2, label: 'Only Label' }, // no display or value
			];

			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: () => capAuthors },
						currentPostId: 123,
					} )
				)
			);

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			expect( result.current.authors[ 0 ].display_name ).toBe( 'from-value' );
			expect( result.current.authors[ 1 ].display_name ).toBe( 'Only Label' );
		} );
	} );

	describe( 'Query Loop context (uses REST API)', () => {
		it( 'should use REST API when postId differs from currently-edited post', () => {
			const restAuthors = [
				{ id: 1, display_name: 'Jane Doe', author_link: '/author/jane/' },
				{ id: 2, display_name: 'John Smith', author_link: '/author/john/' },
			];

			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: () => [] },
						currentPostId: 123, // Editing post 123
						entityRecords: {
							456: { newspack_author_info: restAuthors }, // Query Loop post 456
						},
					} )
				)
			);

			// Request authors for post 456 (different from current 123)
			const { result } = renderHook( () => useCoAuthors( 456, 'post' ) );

			expect( result.current.authors ).toEqual( [
				{ id: 1, display_name: 'Jane Doe', author_link: '/author/jane/' },
				{ id: 2, display_name: 'John Smith', author_link: '/author/john/' },
			] );
			expect( result.current.isCapAvailable ).toBe( true );
		} );

		it( 'should return empty authors when REST API has no author info', () => {
			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: () => [] },
						currentPostId: 123,
						entityRecords: {
							456: { newspack_author_info: null },
						},
					} )
				)
			);

			const { result } = renderHook( () => useCoAuthors( 456, 'post' ) );

			expect( result.current.authors ).toEqual( [] );
			expect( result.current.isCapAvailable ).toBe( true );
		} );

		it( 'should return empty authors when post entity is not loaded', () => {
			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: () => [] },
						currentPostId: 123,
						entityRecords: {}, // No entity records
					} )
				)
			);

			const { result } = renderHook( () => useCoAuthors( 456, 'post' ) );

			expect( result.current.authors ).toEqual( [] );
			expect( result.current.isCapAvailable ).toBe( true );
		} );
	} );

	describe( 'guest author avatar fetching', () => {
		const GUEST_AVATAR_URLS = { 24: 'https://example.com/guest-24.jpg', 96: 'https://example.com/guest-96.jpg' };

		const setupWithGuest = capAuthors => {
			useSelect.mockImplementation( callback =>
				callback(
					createMockSelect( {
						capStore: { getAuthors: () => capAuthors },
						currentPostId: 123,
					} )
				)
			);
		};

		it( 'should fetch avatar by nicename for guest authors', async () => {
			apiFetch.mockResolvedValue( { avatar_urls: GUEST_AVATAR_URLS } );
			setupWithGuest( [
				{ id: 1, display: 'Jane', value: 'jane-doe', userType: 'wpuser' },
				{ id: 1591, display: 'Guest Writer', value: 'guest-writer', userType: 'guest-author' },
			] );

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			await waitFor( () => {
				const guest = result.current.authors.find( a => a.id === 1591 );
				expect( guest.avatar_urls ).toEqual( GUEST_AVATAR_URLS );
			} );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/coauthors/v1/coauthors/guest-writer',
			} );
		} );

		it( 'should not fetch avatars for WP users', async () => {
			setupWithGuest( [
				{ id: 1, display: 'Jane', value: 'jane-doe', userType: 'wpuser' },
				{ id: 2, display: 'John', value: 'john-smith', userType: 'wpuser' },
			] );

			renderHook( () => useCoAuthors( 123 ) );

			// Allow any pending effects to flush.
			await act( () => Promise.resolve() );

			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		it( 'should not fetch avatars when skip is true', async () => {
			apiFetch.mockResolvedValue( { avatar_urls: GUEST_AVATAR_URLS } );
			setupWithGuest( [ { id: 1591, display: 'Guest Writer', value: 'guest-writer', userType: 'guest-author' } ] );

			renderHook( () => useCoAuthors( 123, 'post', true ) );

			await act( () => Promise.resolve() );

			expect( apiFetch ).not.toHaveBeenCalled();
		} );

		it( 'should not modify WP user authors when merging avatar data', async () => {
			apiFetch.mockResolvedValue( { avatar_urls: GUEST_AVATAR_URLS } );
			setupWithGuest( [
				{ id: 1, display: 'Jane', value: 'jane-doe', userType: 'wpuser' },
				{ id: 1591, display: 'Guest Writer', value: 'guest-writer', userType: 'guest-author' },
			] );

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			await waitFor( () => {
				expect( result.current.authors.find( a => a.id === 1591 ).avatar_urls ).toEqual( GUEST_AVATAR_URLS );
			} );

			// WP user should not have avatar_urls added by the hook.
			const wpUser = result.current.authors.find( a => a.id === 1 );
			expect( wpUser.avatar_urls ).toBeUndefined();
		} );

		it( 'should handle failed fetches gracefully', async () => {
			apiFetch.mockRejectedValue( new Error( 'Not found' ) );
			setupWithGuest( [ { id: 1591, display: 'Guest Writer', value: 'ghost-author', userType: 'guest-author' } ] );

			const { result } = renderHook( () => useCoAuthors( 123 ) );

			// Allow the failed promise to settle.
			await act( () => Promise.resolve().then( () => Promise.resolve() ) );

			// Guest author should still be in the list, just without avatar_urls.
			expect( result.current.authors ).toHaveLength( 1 );
			expect( result.current.authors[ 0 ].display_name ).toBe( 'Guest Writer' );
		} );
	} );
} );
