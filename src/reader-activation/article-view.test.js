import setupArticleViewsAggregates from './article-view';
import { createMockRAS } from './mocks/ras';

describe( 'setupArticleViewsAggregates', () => {
	let mock;

	beforeEach( () => {
		mock = createMockRAS();
		setupArticleViewsAggregates( mock.ras );
	} );

	afterEach( () => {
		mock.reset();
	} );

	describe( 'merge strategies', () => {
		it( 'should register a merge strategy for articles_read', () => {
			expect( mock.ras.store.register ).toHaveBeenCalledWith( 'articles_read', {
				merge: expect.any( Function ),
			} );
		} );

		it( 'should register a merge strategy for paywall_hits', () => {
			expect( mock.ras.store.register ).toHaveBeenCalledWith( 'paywall_hits', {
				merge: expect.any( Function ),
			} );
		} );

		it( 'should register a merge strategy for favorite_categories', () => {
			expect( mock.ras.store.register ).toHaveBeenCalledWith( 'favorite_categories', {
				merge: expect.any( Function ),
			} );
		} );

		it( 'articles_read merge should take the max', () => {
			const call = mock.ras.store.register.mock.calls.find( ( [ key ] ) => key === 'articles_read' );
			const merge = call[ 1 ].merge;
			expect( merge( 5, 10 ) ).toBe( 10 );
			expect( merge( 10, 5 ) ).toBe( 10 );
			expect( merge( 0, 5 ) ).toBe( 5 );
			expect( merge( null, 5 ) ).toBe( 5 );
		} );

		it( 'paywall_hits merge should take the max', () => {
			const call = mock.ras.store.register.mock.calls.find( ( [ key ] ) => key === 'paywall_hits' );
			const merge = call[ 1 ].merge;
			expect( merge( 3, 7 ) ).toBe( 7 );
			expect( merge( 7, 3 ) ).toBe( 7 );
		} );

		it( 'favorite_categories merge should prefer client', () => {
			const call = mock.ras.store.register.mock.calls.find( ( [ key ] ) => key === 'favorite_categories' );
			const merge = call[ 1 ].merge;
			expect( merge( [ 1, 2 ], [ 3, 4 ] ) ).toEqual( [ 3, 4 ] );
			expect( merge( [ 1, 2 ], null ) ).toEqual( [ 1, 2 ] );
			expect( merge( null, null ) ).toEqual( [] );
		} );
	} );

	function simulateArticleView( data, timestamp = Date.now() ) {
		mock.trigger( 'activity', { action: 'article_view', data, timestamp } );
	}

	it( 'should register an activity listener', () => {
		expect( mock.ras.on ).toHaveBeenCalledWith( 'activity', expect.any( Function ) );
	} );

	it( 'should ignore non-article_view actions', () => {
		mock.trigger( 'activity', { action: 'other_action', data: {}, timestamp: Date.now() } );
		expect( mock.ras.store.set ).not.toHaveBeenCalled();
	} );

	describe( 'articles_read', () => {
		it( 'should set articles_read to count of unique post IDs', () => {
			mock.addActivity( 'article_view', { post_id: 1, categories: [] } );
			mock.addActivity( 'article_view', { post_id: 2, categories: [] } );
			simulateArticleView( { post_id: 2, categories: [] } );
			expect( mock.storeData.articles_read ).toBe( 2 );
		} );

		it( 'should not increment for duplicate post IDs', () => {
			mock.addActivity( 'article_view', { post_id: 1, categories: [] } );
			mock.addActivity( 'article_view', { post_id: 1, categories: [] } );
			simulateArticleView( { post_id: 1, categories: [] } );
			expect( mock.storeData.articles_read ).toBe( 1 );
		} );
	} );

	describe( 'favorite_categories', () => {
		it( 'should contain category IDs sorted by frequency', () => {
			mock.addActivity( 'article_view', { post_id: 1, categories: [ 10, 20 ] } );
			mock.addActivity( 'article_view', { post_id: 2, categories: [ 10 ] } );
			mock.addActivity( 'article_view', { post_id: 3, categories: [ 20, 30 ] } );
			simulateArticleView( { post_id: 3, categories: [ 20, 30 ] } );
			// 10 appears 2x, 20 appears 2x, 30 appears 1x (excluded — needs >= 2).
			expect( mock.storeData.favorite_categories ).toEqual( [ 10, 20 ] );
		} );

		it( 'should exclude categories with only 1 view', () => {
			mock.addActivity( 'article_view', { post_id: 1, categories: [ 10 ] } );
			simulateArticleView( { post_id: 2, categories: [ 20 ] } );
			// Each category has only 1 view.
			expect( mock.storeData.favorite_categories ).toEqual( [] );
		} );

		it( 'should limit to top 5 categories', () => {
			// Each category needs at least 2 views to be included.
			mock.addActivity( 'article_view', { post_id: 1, categories: [ 1, 2, 3, 4, 5, 6, 7 ] } );
			mock.addActivity( 'article_view', { post_id: 2, categories: [ 1, 2, 3, 4, 5, 6, 7 ] } );
			simulateArticleView( { post_id: 3, categories: [ 1, 2, 3, 4, 5, 6, 7 ] } );
			expect( mock.storeData.favorite_categories ).toHaveLength( 5 );
		} );

		it( 'should handle articles with no categories', () => {
			mock.addActivity( 'article_view', { post_id: 1 } );
			simulateArticleView( { post_id: 1 } );
			expect( mock.storeData.favorite_categories ).toEqual( [] );
		} );
	} );
} );
