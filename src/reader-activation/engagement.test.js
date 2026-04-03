import setupEngagement from './engagement';
import { createMockRAS } from './mocks/ras';

describe( 'setupEngagement', () => {
	let mock;

	beforeEach( () => {
		mock = createMockRAS();
		window.newspack_reader_data = {};
	} );

	afterEach( () => {
		mock.reset();
		delete window.newspack_reader_data;
	} );

	it( 'should set first_visit_date on first call', () => {
		setupEngagement( mock.ras );
		expect( mock.ras.store.set ).toHaveBeenCalledWith( 'first_visit_date', expect.any( Number ) );
	} );

	it( 'should preserve existing client first_visit_date when no server value', () => {
		mock.storeData.first_visit_date = 1000;
		setupEngagement( mock.ras );
		expect( mock.storeData.first_visit_date ).toBe( 1000 );
	} );

	it( 'should prefer older server value over newer client value', () => {
		const oldServerValue = 1000;
		const newClientValue = 9999;
		mock.storeData.first_visit_date = newClientValue;
		window.newspack_reader_data = {
			items: { first_visit_date: JSON.stringify( oldServerValue ) },
		};
		setupEngagement( mock.ras );
		expect( mock.storeData.first_visit_date ).toBe( oldServerValue );
	} );

	it( 'should prefer older client value over newer server value', () => {
		const oldClientValue = 1000;
		const newServerValue = 9999;
		mock.storeData.first_visit_date = oldClientValue;
		window.newspack_reader_data = {
			items: { first_visit_date: JSON.stringify( newServerValue ) },
		};
		setupEngagement( mock.ras );
		expect( mock.storeData.first_visit_date ).toBe( oldClientValue );
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
