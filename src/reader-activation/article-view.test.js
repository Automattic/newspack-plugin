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
			// 10 appears 2x, 20 appears 2x, 30 appears 1x.
			expect( mock.storeData.favorite_categories ).toEqual( [ 10, 20, 30 ] );
		} );

		it( 'should limit to top 5 categories', () => {
			mock.addActivity( 'article_view', { post_id: 1, categories: [ 1, 2, 3, 4, 5, 6, 7 ] } );
			simulateArticleView( { post_id: 1, categories: [ 1, 2, 3, 4, 5, 6, 7 ] } );
			expect( mock.storeData.favorite_categories ).toHaveLength( 5 );
		} );

		it( 'should handle articles with no categories', () => {
			mock.addActivity( 'article_view', { post_id: 1 } );
			simulateArticleView( { post_id: 1 } );
			expect( mock.storeData.favorite_categories ).toEqual( [] );
		} );
	} );
} );
