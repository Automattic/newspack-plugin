/**
 * Internal dependencies
 */
import { promptDescription, warningForPopup, isOverlay } from './utils';

const placement = 'center';

beforeAll( () => {
	window.newspackAudienceCampaigns = {
		overlay_placements: [ placement, 'top', 'bottom' ],
		custom_placements: {},
		criteria: [],
	};
} );

const overlay = ( overrides = {} ) => ( {
	id: 100,
	status: 'publish',
	title: 'Test prompt',
	segments: [],
	categories: [],
	tags: [],
	campaign_groups: [],
	options: { placement, frequency: 'daily' },
	...overrides,
} );

const realTag = { term_id: 58, name: 'real-tag' };
const realCategory = { term_id: 5, name: 'Sports' };
const otherCategory = { term_id: 6, name: 'News' };

describe( 'promptDescription', () => {
	it( 'renders a description from valid taxonomy arrays', () => {
		const result = promptDescription(
			overlay( {
				categories: [ realCategory ],
				tags: [ realTag ],
				campaign_groups: [ { name: 'Group A' } ],
			} )
		);
		expect( result ).toContain( 'Categories:' );
		expect( result ).toContain( 'Sports' );
		expect( result ).toContain( 'Tags:' );
		expect( result ).toContain( 'real-tag' );
		expect( result ).toContain( 'Campaign:' );
		expect( result ).toContain( 'Group A' );
	} );

	it( 'tolerates a null entry in tags (NPPM-2729 repro)', () => {
		const result = promptDescription( overlay( { tags: [ realTag, null ] } ) );
		expect( result ).toContain( 'Tags:' );
		expect( result ).toContain( 'real-tag' );
	} );

	it( 'tolerates a null entry in categories', () => {
		const result = promptDescription( overlay( { categories: [ realCategory, null ] } ) );
		expect( result ).toContain( 'Categories:' );
		expect( result ).toContain( 'Sports' );
	} );

	it( 'tolerates a null entry in campaign_groups', () => {
		const result = promptDescription( overlay( { campaign_groups: [ { name: 'Group A' }, null ] } ) );
		expect( result ).toContain( 'Campaign:' );
		expect( result ).toContain( 'Group A' );
	} );

	it( 'tolerates tags === null', () => {
		expect( () => promptDescription( overlay( { tags: null } ) ) ).not.toThrow();
	} );

	it( 'tolerates categories === null', () => {
		expect( () => promptDescription( overlay( { categories: null } ) ) ).not.toThrow();
	} );

	it( 'tolerates campaign_groups === null', () => {
		expect( () => promptDescription( overlay( { campaign_groups: null } ) ) ).not.toThrow();
	} );
} );

describe( 'warningForPopup', () => {
	it( 'test fixture is correctly set up as an overlay', () => {
		expect( isOverlay( overlay() ) ).toBe( true );
	} );

	it( 'returns null when no conflicting prompts share segments and categories', () => {
		const prompt = overlay( { categories: [ realCategory ] } );
		const conflict = overlay( { id: 200, categories: [ otherCategory ] } );
		expect( warningForPopup( [ prompt, conflict ], prompt ) ).toBeNull();
	} );

	// Null entry in prompt.categories — the outer Array.some hits null.
	// Conflict has a non-matching category so the outer some iterates past
	// the real category and into the null.
	it( 'tolerates a null entry in prompt.categories (NPPM-2729 sibling path)', () => {
		const prompt = overlay( { categories: [ realCategory, null ] } );
		const conflict = overlay( { id: 200, categories: [ otherCategory ] } );
		expect( () => warningForPopup( [ prompt, conflict ], prompt ) ).not.toThrow();
	} );

	// Null entry in conflict.categories — the inner Array.some hits null.
	// Place null first so the inner some sees it on its first iteration.
	it( 'tolerates a null entry in a conflicting prompt categories', () => {
		const prompt = overlay( { categories: [ realCategory ] } );
		const conflict = overlay( { id: 200, categories: [ null, otherCategory ] } );
		expect( () => warningForPopup( [ prompt, conflict ], prompt ) ).not.toThrow();
	} );

	// Defensive: top-level non-array. prompt.categories must coerce to a usable
	// array shape so .length / .some don't throw on a primitive.
	it( 'tolerates categories === null on the prompt', () => {
		const prompt = overlay( { categories: null } );
		const conflict = overlay( { id: 200, categories: [ realCategory ] } );
		expect( () => warningForPopup( [ prompt, conflict ], prompt ) ).not.toThrow();
	} );

	it( 'tolerates categories === null on a conflicting prompt', () => {
		const prompt = overlay( { categories: [ realCategory ] } );
		const conflict = overlay( { id: 200, categories: null } );
		expect( () => warningForPopup( [ prompt, conflict ], prompt ) ).not.toThrow();
	} );
} );
