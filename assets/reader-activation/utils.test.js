import { generateID } from './utils';

describe( 'generateID', () => {
	it( 'should generate a random ID', () => {
		const id = generateID();
		expect( id ).toHaveLength( 9 );
	} );
	it( 'should generate a random ID of the given length', () => {
		const id = generateID( 10 );
		expect( id ).toHaveLength( 10 );
	} );
} );
