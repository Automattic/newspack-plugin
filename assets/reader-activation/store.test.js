import Store from './store';

describe( 'Store', () => {
	beforeEach( () => {
		window.newspack_reader_data = window.newspack_reader_data || {};
		localStorage.clear();
	} );
	it( 'should return an object with methods', () => {
		const store = Store();
		expect( typeof store ).toBe( 'object' );
		expect( typeof store.get ).toBe( 'function' );
		expect( typeof store.set ).toBe( 'function' );
		expect( typeof store.add ).toBe( 'function' );
		expect( typeof store.delete ).toBe( 'function' );
	} );
	it( 'should store json stringified data in localStorage', () => {
		const store = Store();
		store.set( 'string', 'foo' );
		store.set( 'array', [ 1, 2, 3 ] );
		store.set( 'object', { foo: 'bar' } );
		store.set( 'empty', '' );
		store.set( 'boolean', false );
		expect( localStorage.getItem( 'np_reader_string' ) ).toEqual( '"foo"' );
		expect( localStorage.getItem( 'np_reader_array' ) ).toEqual( '[1,2,3]' );
		expect( localStorage.getItem( 'np_reader_object' ) ).toEqual( '{"foo":"bar"}' );
		expect( localStorage.getItem( 'np_reader_empty' ) ).toEqual( '""' );
		expect( localStorage.getItem( 'np_reader_boolean' ) ).toEqual( 'false' );
	} );
	it( 'should not store undefined or null values', () => {
		const store = Store();
		const storeUndefined = () => store.set( 'undefined', undefined );
		const storeNull = () => store.set( 'null', null );
		expect( storeUndefined ).toThrow( Error );
		expect( storeNull ).toThrow( Error );
		expect( localStorage.getItem( 'np_reader_undefined' ) ).toBeNull();
		expect( localStorage.getItem( 'np_reader_null' ) ).toBeNull();
	} );
	it( 'should store data and return it', () => {
		const store = Store();
		store.set( 'foo', 'bar' );
		expect( store.get( 'foo' ) ).toEqual( 'bar' );
	} );
	it( 'should delete a key', () => {
		const store = Store();
		store.set( 'foo', 'bar' );
		store.delete( 'foo' );
		expect( localStorage.getItem( 'np_reader_foo' ) ).toBeNull();
		expect( store.get( 'foo' ) ).toBeNull();
	} );
	it( 'should add to a collection', () => {
		const store = Store();
		const item = { foo: 'bar' };
		store.add( 'my-collection', item );
		expect( store.get( 'my-collection' ) ).toEqual( [ item ] );
	} );
	it( 'should not store more than 1000 items in a collection', () => {
		const store = Store();
		for ( let i = 0; i < 1001; i++ ) {
			store.add( 'my-collection', { foo: 'bar' } );
		}
		expect( store.get( 'my-collection' ).length ).toEqual( 1000 );
	} );
	it( 'should clear added items older than 30 days in a collection', () => {
		const store = Store();
		const now = Date.now();
		store.add( 'my-collection', { timestamp: 1 } ); // Old timestamp.
		store.add( 'my-collection', { timestamp: now } ); // Setting new item clears old ones.
		expect( store.get( 'my-collection' ) ).toEqual( [ { timestamp: now } ] );
	} );
	it( 'should not add to collection if key value is not an array', () => {
		const store = Store();
		store.set( 'my-collection', 'not-an-array' );
		const storeNotArray = () => store.add( 'my-collection', { foo: 'bar' } );
		expect( storeNotArray ).toThrow( Error );
		expect( store.get( 'my-collection' ) ).toEqual( 'not-an-array' );
	} );
	it( 'should not add to collection if key is empty', () => {
		const store = Store();
		const storeEmptyKey = () => store.add( undefined, { foo: 'bar' } );
		expect( storeEmptyKey ).toThrow( Error );
		expect( store.get( 'my-collection' ) ).toBeNull();
	} );
	it( 'should not add to collection if value is empty', () => {
		const store = Store();
		const storeEmptyValue = () => store.add( 'my-collection', undefined );
		expect( storeEmptyValue ).toThrow( Error );
		expect( store.get( 'my-collection' ) ).toBeNull();
	} );
	it( 'should load store with initial data', () => {
		window.newspack_reader_data = {
			items: {
				foo: '"bar"',
			},
		};
		const store = Store();
		expect( store.get( 'foo' ) ).toEqual( 'bar' );
	} );
} );
