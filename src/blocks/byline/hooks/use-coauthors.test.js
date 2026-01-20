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
import { useCoAuthors } from './use-coauthors';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

describe( 'useCoAuthors', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return isCapAvailable false when CAP store is not available', () => {
		useSelect.mockImplementation( callback => callback( () => null ) );

		const { result } = renderHook( () => useCoAuthors( 123 ) );

		expect( result.current.authors ).toEqual( [] );
		expect( result.current.isCapAvailable ).toBe( false );
	} );

	it( 'should return isCapAvailable false when getAuthors is not a function', () => {
		useSelect.mockImplementation( callback => callback( () => ( {} ) ) );

		const { result } = renderHook( () => useCoAuthors( 123 ) );

		expect( result.current.authors ).toEqual( [] );
		expect( result.current.isCapAvailable ).toBe( false );
	} );

	it( 'should return empty authors when CAP is available but no authors assigned', () => {
		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getAuthors: () => [],
			} ) )
		);

		const { result } = renderHook( () => useCoAuthors( 123 ) );

		expect( result.current.authors ).toEqual( [] );
		expect( result.current.isCapAvailable ).toBe( true );
	} );

	it( 'should return empty authors when postId is falsy', () => {
		const getAuthorsMock = jest.fn( () => [] );
		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getAuthors: getAuthorsMock,
			} ) )
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
			callback( () => ( {
				getAuthors: () => capAuthors,
			} ) )
		);

		const { result } = renderHook( () => useCoAuthors( 123 ) );

		expect( result.current.authors ).toEqual( [
			{ id: 1, display_name: 'Jane Doe', user_nicename: 'jane-doe' },
			{ id: 2, display_name: 'John Smith', user_nicename: 'john-smith' },
		] );
		expect( result.current.isCapAvailable ).toBe( true );
	} );

	it( 'should fallback to value then label for display_name', () => {
		const capAuthors = [
			{ id: 1, value: 'from-value', label: 'From Label' }, // no display
			{ id: 2, label: 'Only Label' }, // no display or value
		];

		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getAuthors: () => capAuthors,
			} ) )
		);

		const { result } = renderHook( () => useCoAuthors( 123 ) );

		expect( result.current.authors[ 0 ].display_name ).toBe( 'from-value' );
		expect( result.current.authors[ 1 ].display_name ).toBe( 'Only Label' );
	} );
} );
