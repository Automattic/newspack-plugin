import setupEngagement from './engagement';
import { createMockRAS } from './mocks/ras';

describe( 'setupEngagement', () => {
	let mock;

	beforeEach( () => {
		mock = createMockRAS();
	} );

	afterEach( () => {
		mock.reset();
	} );

	it( 'should set first_visit_date on first call', () => {
		setupEngagement( mock.ras );
		expect( mock.ras.store.set ).toHaveBeenCalledWith( 'first_visit_date', expect.any( Number ) );
	} );

	it( 'should not overwrite first_visit_date on subsequent calls', () => {
		mock.storeData.first_visit_date = 1000;
		setupEngagement( mock.ras );
		const firstVisitCalls = mock.ras.store.set.mock.calls.filter( ( [ key ] ) => key === 'first_visit_date' );
		expect( firstVisitCalls ).toHaveLength( 0 );
	} );

	it( 'should always set last_active', () => {
		setupEngagement( mock.ras );
		expect( mock.ras.store.set ).toHaveBeenCalledWith( 'last_active', expect.any( Number ) );
	} );

	it( 'should set last_active to a recent timestamp', () => {
		const before = Date.now();
		setupEngagement( mock.ras );
		const after = Date.now();
		expect( mock.storeData.last_active ).toBeGreaterThanOrEqual( before );
		expect( mock.storeData.last_active ).toBeLessThanOrEqual( after );
	} );
} );
