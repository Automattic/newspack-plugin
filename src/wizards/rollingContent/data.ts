/**
 * Rolling Content demo — fake in-memory dataset.
 *
 * 30 rolling contents, each with 5-25 deterministic entries. All values are
 * stable across renders (no Math.random, no Date.now at module scope).
 */

const ROLLING_TITLES: string[] = [
	'Election Night 2026: Live Updates',
	'City Council Budget Hearings',
	'Wildfire Response Coverage',
	'School Board Recall Effort',
	'Hurricane Season Live Coverage',
	'Mayoral Debate Aftermath',
	'Transit Strike Day Two',
	'Federal Inquiry Hearings',
	'Stadium Vote Live',
	'Climate Protest Coverage',
	'Tech Company Layoffs Tracker',
	'Inauguration Day',
	'Special Session Coverage',
	'Tax Reform Town Halls',
	'Water Restriction Updates',
	'Election Recount Results',
	'Public Health Emergency Briefings',
	'Budget Override Vote',
	'Police Reform Hearings',
	'Bond Measure Election Night',
	'School District Negotiations',
	'Housing Crisis Forum',
	'Power Grid Outage Updates',
	'Recall Petition Tracker',
	'City Charter Vote',
	'Special Counsel Updates',
	'Park District Vote',
	'Casino Referendum Coverage',
	'Voter Roll Audit Hearings',
	'Annexation Vote Live',
];

const ENTRY_TITLES: string[] = [
	'Polls close in District 4',
	'Mayor responds to opposition statement',
	'Vote count delayed by ballot challenge',
	'Lawmakers reach tentative deal',
	'Live update: returns from precinct 12',
	'Statement from city attorney',
	'Crowd gathers outside city hall',
	'Press conference scheduled for 8 PM',
	'New witness called to testify',
	'Council moves into closed session',
	'Update: highway reopens to traffic',
	'Officials confirm timeline for vote',
	'Spokesperson denies allegations',
	'Crowd estimate revised upward',
	'Decision expected by tomorrow morning',
];

const AUTHORS: string[] = [ 'Alex Rivera', 'Jamie Chen', 'Morgan Patel', 'Sam Johnson', 'Riley Cooper', 'Jordan Kim' ];

const TAGS: string[] = [ 'breaking', 'politics', 'local', 'national', 'elections', 'transit', 'weather', 'courts', 'education', 'climate' ];

const BASE_DATE = new Date( '2026-05-01T12:00:00Z' );

function makeDate( seed: number ): string {
	const dayOffset = ( seed * 17 ) % 90;
	const d = new Date( BASE_DATE );
	d.setDate( d.getDate() - dayOffset );
	return d.toISOString();
}

function entryStatusFor( id: number ): EntryStatus {
	const statusRoll = ( id * 13 ) % 100;
	if ( statusRoll < 70 ) {
		return 'published';
	}
	if ( statusRoll < 90 ) {
		return 'draft';
	}
	return 'scheduled';
}

function rollingStatusFor( idx: number ): RollingContentStatus {
	if ( idx < 12 ) {
		return 'active';
	}
	if ( idx < 22 ) {
		return 'archived';
	}
	return 'scheduled';
}

function makeEntries( parentId: number, count: number ): Entry[] {
	const entries: Entry[] = [];
	for ( let i = 0; i < count; i++ ) {
		const id = parentId * 1000 + i;
		const status: EntryStatus = entryStatusFor( id );

		const tagCount = 1 + ( id % 3 );
		const tags: string[] = [];
		for ( let t = 0; t < tagCount; t++ ) {
			tags.push( TAGS[ ( id * 7 + t * 11 ) % TAGS.length ] );
		}

		entries.push( {
			id,
			title: ENTRY_TITLES[ ( id * 7 ) % ENTRY_TITLES.length ],
			date: makeDate( id ),
			author: AUTHORS[ id % AUTHORS.length ],
			featuredImage: `https://picsum.photos/seed/entry-${ id }/200/120`,
			status,
			tags,
		} );
	}
	return entries;
}

export const ROLLING_CONTENTS: RollingContent[] = ROLLING_TITLES.map( ( title, idx ) => {
	const id = idx + 1;
	const status: RollingContentStatus = rollingStatusFor( idx );
	const entryCount = 5 + ( ( id * 11 ) % 21 );
	return {
		id,
		title,
		date: makeDate( id ),
		featuredImage: `https://picsum.photos/seed/rolling-${ id }/200/120`,
		status,
		entries: makeEntries( id, entryCount ),
	};
} );

export const getRollingContent = ( id: number ): RollingContent | undefined => ROLLING_CONTENTS.find( r => r.id === id );
