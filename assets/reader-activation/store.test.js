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
	it( 'should store data and return it', () => {
		const store = Store();
		store.set( 'foo', 'bar' );
		expect( store.get( 'foo' ) ).toEqual( 'bar' );
	} );
	it( 'should delete a key', () => {
		const store = Store();
		store.set( 'foo', 'bar' );
		store.delete( 'foo' );
		expect( store.get( 'foo' ) ).toBeUndefined();
	} );
	it( "shouldn't store if key is reserved", () => {
		const store = Store();
		const key = 'activity';
		const storeReserved = () => store.set( key, 'foo' );
		expect( storeReserved ).toThrow( Error );
		expect( store.get( key ) ).not.toEqual( 'foo' );
	} );
	it( 'should add a list', () => {
		const store = Store();
		const item = { foo: 'bar' };
		store.add( 'my-list', item );
		expect( store.get( 'my-list' ) ).toEqual( [ item ] );
	} );
	it( 'should not add if not an array', () => {
		const store = Store();
		const item = { foo: 'bar' };
		store.set( 'my-list', item );
		const storeNotArray = () => store.add( 'my-list', item );
		expect( storeNotArray ).toThrow( Error );
		expect( store.get( 'my-list' ) ).toEqual( item );
	} );
	it( 'should not add if key is not provided', () => {
		const store = Store();
		const item = { foo: 'bar' };
		const storeNoKey = () => store.add( undefined, item );
		expect( storeNoKey ).toThrow( Error );
		expect( store.get( 'my-list' ) ).toBeUndefined();
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
