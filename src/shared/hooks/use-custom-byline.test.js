/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useCustomByline } from './use-custom-byline';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

describe( 'useCustomByline', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return inactive byline when meta is not set', () => {
		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getEditedEntityRecord: () => ( {} ),
			} ) )
		);

		const { result } = renderHook( () => useCustomByline( 123, 'post' ) );

		expect( result.current.bylineActive ).toBe( false );
		expect( result.current.bylineContent ).toBe( '' );
	} );

	it( 'should return inactive byline when meta exists but byline is inactive', () => {
		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getEditedEntityRecord: () => ( {
					meta: {
						_newspack_byline_active: false,
						_newspack_byline: 'Some content',
					},
				} ),
			} ) )
		);

		const { result } = renderHook( () => useCustomByline( 123, 'post' ) );

		expect( result.current.bylineActive ).toBe( false );
		expect( result.current.bylineContent ).toBe( 'Some content' );
	} );

	it( 'should return active byline with content', () => {
		const bylineContent = 'By [Author id=5]Jane Doe[/Author]';

		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getEditedEntityRecord: () => ( {
					meta: {
						_newspack_byline_active: true,
						_newspack_byline: bylineContent,
					},
				} ),
			} ) )
		);

		const { result } = renderHook( () => useCustomByline( 123, 'post' ) );

		expect( result.current.bylineActive ).toBe( true );
		expect( result.current.bylineContent ).toBe( bylineContent );
	} );

	it( 'should handle null post record gracefully', () => {
		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getEditedEntityRecord: () => null,
			} ) )
		);

		const { result } = renderHook( () => useCustomByline( 123, 'post' ) );

		expect( result.current.bylineActive ).toBe( false );
		expect( result.current.bylineContent ).toBe( '' );
	} );
} );
