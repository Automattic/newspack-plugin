/* eslint-disable @wordpress/i18n-translator-comments, no-bitwise, no-nested-ternary */
/**
 * Mock subscriber data for the Subscribers Demo wizard.
 *
 * Designed to cover every state the UI needs to render:
 *   - Active, single digital subscription (happy path)
 *   - Lapsed with failed payment + alert
 *   - Active with digital + print add-on (multi-plan)
 *   - Cancelled, no payment method
 *
 * Plus ~40 seeded pseudo-random extras so DataViews has enough to
 * filter, sort and paginate through.
 */

export const DIGITAL_PLANS = [
	{ name: 'Monthly Digital', cadence: 'Monthly', amount: 12, access: 'Full digital access' },
	{ name: 'Yearly Digital', cadence: 'Yearly', amount: 120, access: 'Full digital access' },
	{ name: 'Student Monthly', cadence: 'Monthly', amount: 6, access: 'Student digital access' },
	{ name: 'Supporter Annual', cadence: 'Yearly', amount: 250, access: 'Full digital access + supporter perks' },
];

export const PRINT_PLANS = [
	{ name: 'Monthly Print', cadence: 'Monthly', amount: 15, access: 'Weekly print delivery' },
	{ name: 'Yearly Print', cadence: 'Yearly', amount: 150, access: 'Weekly print delivery' },
];

export const ALL_PLANS = [ ...DIGITAL_PLANS, ...PRINT_PLANS ];

export const KNOWN_TAGS = [ 'vip', 'valued-reader', 'met-in-person' ];

export const NEWSLETTERS = [
	{ id: 'daily', name: 'Daily Brief', description: 'Top stories every weekday morning.' },
	{ id: 'weekly', name: 'Weekend Read', description: 'Long reads delivered Saturday.' },
	{ id: 'arts', name: 'Arts & Culture', description: 'Reviews and what’s on, monthly.' },
	{ id: 'breaking', name: 'Breaking News', description: 'Real-time alerts on major stories.' },
];

// Tiny deterministic PRNG so the list is stable between reloads.
function mulberry32( seed ) {
	return function () {
		let t = ( seed += 0x6d2b79f5 );
		t = Math.imul( t ^ ( t >>> 15 ), t | 1 );
		t ^= t + Math.imul( t ^ ( t >>> 7 ), t | 61 );
		return ( ( t ^ ( t >>> 14 ) ) >>> 0 ) / 4294967296;
	};
}
const rand = mulberry32( 42 );
const pick = arr => arr[ Math.floor( rand() * arr.length ) ];

const FIRST = [
	'Matt',
	'Jane',
	'Alex',
	'Priya',
	'Oscar',
	'Mei',
	'Tom',
	'Sofia',
	'Liam',
	'Nadia',
	'Ben',
	'Aisha',
	'Carlos',
	'Yuki',
	'Leo',
	'Hannah',
	'Ravi',
	'Eva',
	'Theo',
	'Zara',
	'Luca',
	'Ines',
	'Kai',
	'Maya',
	'Owen',
	'Ada',
	'Finn',
	'Noor',
];
const LAST = [
	'Moore',
	'Chen',
	'Ali',
	'Garcia',
	'Nguyen',
	'Okafor',
	'Ross',
	'Bauer',
	'Silva',
	'Khan',
	'Walsh',
	'Park',
	'Rivera',
	'Ito',
	'Baker',
	'Haas',
	'Patel',
	'Lind',
	'Marsh',
	'Rossi',
];

function iso( daysAgo ) {
	const d = new Date();
	d.setDate( d.getDate() - daysAgo );
	return d.toISOString().slice( 0, 10 );
}

function futureIso( daysAhead ) {
	const d = new Date();
	d.setDate( d.getDate() + daysAhead );
	return d.toISOString().slice( 0, 10 );
}

function makeSub( plan, status = 'active' ) {
	return {
		id: 'sub_' + Math.floor( rand() * 1e6 ),
		plan: plan.name,
		status,
		access: plan.access,
		cadence: plan.cadence,
		nextBillingDate: status === 'active' ? futureIso( Math.floor( rand() * 30 ) + 1 ) : null,
		amount: plan.amount,
	};
}

// Four hand-crafted scenarios the design brief calls out.
const FIXTURES = [
	{
		id: '1',
		name: 'Matt Moore',
		email: 'matthew.moore@gmail.com',
		status: 'active',
		memberSince: '2022-09-30',
		lastPayment: iso( 10 ),
		subscriptions: [ makeSub( DIGITAL_PLANS[ 0 ] ) ],
		paymentMethods: [ { id: 'pm_1', type: 'Visa', last4: '4242', expiry: '08/27', isDefault: true } ],
		alerts: [],
		tags: [ 'valued-reader' ],
		newsletters: [ 'daily', 'weekly' ],
		orders: [
			{ id: 'ord_1', date: iso( 10 ), amount: 12.0, type: 'Subscription payment' },
			{ id: 'ord_2', date: iso( 40 ), amount: 12.0, type: 'Subscription payment' },
			{ id: 'ord_3', date: iso( 70 ), amount: 12.0, type: 'Subscription payment' },
		],
	},
	{
		id: '2',
		name: 'Jane Chen',
		email: 'jane.chen@example.com',
		status: 'lapsed',
		memberSince: '2021-04-12',
		lastPayment: iso( 45 ),
		subscriptions: [ { ...makeSub( DIGITAL_PLANS[ 1 ] ), status: 'lapsed', nextBillingDate: null } ],
		paymentMethods: [],
		alerts: [
			{
				id: 'alert_pay',
				level: 'error',
				title: 'Payment failed',
				message: 'The last renewal payment was declined and no payment method is on file.',
			},
		],
		tags: [],
		newsletters: [ 'daily' ],
		orders: [
			{ id: 'ord_21', date: iso( 45 ), amount: 0, type: 'Failed renewal' },
			{ id: 'ord_22', date: iso( 410 ), amount: 120.0, type: 'Subscription payment' },
		],
	},
	{
		id: '3',
		name: 'Priya Patel',
		email: 'priya.patel@example.com',
		status: 'active',
		memberSince: '2023-01-05',
		lastPayment: iso( 3 ),
		subscriptions: [ makeSub( DIGITAL_PLANS[ 1 ] ), makeSub( PRINT_PLANS[ 0 ] ) ],
		paymentMethods: [
			{ id: 'pm_3a', type: 'Mastercard', last4: '1881', expiry: '02/28', isDefault: true },
			{ id: 'pm_3b', type: 'Visa', last4: '9933', expiry: '06/27', isDefault: false },
		],
		alerts: [],
		tags: [ 'vip', 'valued-reader' ],
		newsletters: [ 'daily', 'weekly', 'arts' ],
		orders: [
			{ id: 'ord_31', date: iso( 3 ), amount: 15.0, type: 'Subscription payment' },
			{ id: 'ord_32', date: iso( 20 ), amount: 120.0, type: 'Subscription payment' },
		],
	},
	{
		id: '5',
		name: 'Aisha Khan',
		email: 'aisha.khan@example.com',
		status: 'active',
		memberSince: '2022-02-14',
		lastPayment: iso( 7 ),
		subscriptions: [ makeSub( DIGITAL_PLANS[ 0 ] ), { ...makeSub( PRINT_PLANS[ 1 ] ), status: 'cancelled', nextBillingDate: null } ],
		paymentMethods: [ { id: 'pm_5', type: 'Visa', last4: '0007', expiry: '11/26', isDefault: true } ],
		alerts: [],
		tags: [ 'met-in-person' ],
		newsletters: [ 'daily', 'breaking' ],
		orders: [
			{ id: 'ord_51', date: iso( 7 ), amount: 12.0, type: 'Subscription payment' },
			{ id: 'ord_52', date: iso( 60 ), amount: 150.0, type: 'Subscription payment' },
			{ id: 'ord_53', date: iso( 75 ), amount: 0, type: 'Cancellation' },
		],
	},
	{
		id: '4',
		name: 'Oscar Rivera',
		email: 'oscar@example.com',
		status: 'cancelled',
		memberSince: '2020-06-18',
		lastPayment: iso( 220 ),
		subscriptions: [ { ...makeSub( DIGITAL_PLANS[ 0 ] ), status: 'cancelled', nextBillingDate: null } ],
		paymentMethods: [],
		alerts: [],
		tags: [],
		newsletters: [],
		orders: [ { id: 'ord_41', date: iso( 220 ), amount: 12.0, type: 'Subscription payment' } ],
	},
];

function makeRandom( i ) {
	const first = pick( FIRST );
	const last = pick( LAST );
	const name = `${ first } ${ last }`;
	const email = `${ first.toLowerCase() }.${ last.toLowerCase() }${ i }@example.com`;
	const roll = rand();
	const status = roll < 0.45 ? 'active' : roll < 0.8 ? 'lapsed' : 'cancelled';
	const digital = pick( DIGITAL_PLANS );
	const withPrint = status === 'active' && rand() < 0.25;
	const subs = [ makeSub( digital, status === 'active' ? 'active' : status ) ];
	if ( withPrint ) {
		subs.push( makeSub( pick( PRINT_PLANS ) ) );
	}
	const memberSinceDays = Math.floor( rand() * 1500 ) + 30;
	const lastPaymentDays = Math.floor( rand() * 60 );
	const alerts =
		status === 'lapsed' && rand() < 0.6
			? [
					{
						id: 'alert_pay',
						level: 'warning',
						title: 'Payment needs attention',
						message: 'Last renewal attempt failed.',
					},
			  ]
			: [];
	const tags = [];
	if ( rand() < 0.4 ) {
		const firstTag = KNOWN_TAGS[ Math.floor( rand() * KNOWN_TAGS.length ) ];
		tags.push( firstTag );
		if ( rand() < 0.3 ) {
			const secondTag = KNOWN_TAGS[ Math.floor( rand() * KNOWN_TAGS.length ) ];
			if ( secondTag !== firstTag ) {
				tags.push( secondTag );
			}
		}
	}
	const newsletters = [];
	if ( rand() < 0.7 ) {
		const count = Math.floor( rand() * 3 ) + 1;
		while ( newsletters.length < count ) {
			const candidate = NEWSLETTERS[ Math.floor( rand() * NEWSLETTERS.length ) ].id;
			if ( ! newsletters.includes( candidate ) ) {
				newsletters.push( candidate );
			}
		}
	}
	return {
		id: String( 100 + i ),
		name,
		email,
		status,
		memberSince: iso( memberSinceDays ),
		lastPayment: iso( lastPaymentDays ),
		subscriptions: subs,
		paymentMethods:
			( status === 'cancelled' && rand() < 0.5 ) || ( status === 'lapsed' && rand() < 0.5 )
				? []
				: [
						{
							id: 'pm_r' + i,
							type: rand() < 0.6 ? 'Visa' : 'Mastercard',
							last4: String( Math.floor( rand() * 9000 ) + 1000 ),
							expiry: '0' + ( Math.floor( rand() * 9 ) + 1 ) + '/2' + ( Math.floor( rand() * 6 ) + 6 ),
							isDefault: true,
						},
				  ],
		alerts,
		tags,
		newsletters,
		orders: [
			{
				id: 'ord_r' + i + '_1',
				date: iso( lastPaymentDays ),
				amount: digital.amount,
				type: status === 'lapsed' ? 'Failed renewal' : 'Subscription payment',
			},
		],
	};
}

const EXTRAS = Array.from( { length: 42 }, ( _, i ) => makeRandom( i ) );

export const SUBSCRIBERS = [ ...FIXTURES, ...EXTRAS ];

// PROTOTYPE ONLY: tag/newsletter changes made in L1 are persisted to localStorage but the
// in-memory SUBSCRIBERS array isn't mutated. As a result the L0 list and the ALL_TAGS
// filter elements only reflect the seeded values. Acceptable for a prototype.
export const ALL_TAGS = [ ...new Set( SUBSCRIBERS.flatMap( s => s.tags || [] ) ) ].sort();

export function getSubscriberById( id ) {
	return SUBSCRIBERS.find( s => s.id === id );
}

// PROTOTYPE ONLY: notes/tags/newsletters are persisted to the current admin's localStorage
// so they survive a refresh during a demo. In production these need to live server-side
// (REST endpoint + user/post meta or an option) so they're shared across every admin
// viewing the same subscriber.
const NOTES_STORAGE_KEY = 'newspack-subscribers-demo:notes';
const TAGS_STORAGE_KEY = 'newspack-subscribers-demo:tags';
const NEWSLETTERS_STORAGE_KEY = 'newspack-subscribers-demo:newsletters';

function readStore( key ) {
	try {
		return JSON.parse( window.localStorage.getItem( key ) ) || {};
	} catch ( e ) {
		return {};
	}
}

function writeStore( key, store ) {
	try {
		window.localStorage.setItem( key, JSON.stringify( store ) );
	} catch ( e ) {
		// Storage quota or disabled — fail silently in the prototype.
	}
}

export function getStoredNotes( id ) {
	return readStore( NOTES_STORAGE_KEY )[ id ] || [];
}

export function setStoredNotes( id, notes ) {
	const store = readStore( NOTES_STORAGE_KEY );
	if ( notes && notes.length ) {
		store[ id ] = notes;
	} else {
		delete store[ id ];
	}
	writeStore( NOTES_STORAGE_KEY, store );
}

// Returns the stored array if an entry exists, or null when there's no entry yet
// (so callers can fall back to the seeded fixture value). An empty array still counts
// as a real entry — the user may have intentionally cleared all tags/newsletters.
export function getStoredTags( id ) {
	const store = readStore( TAGS_STORAGE_KEY );
	return Object.prototype.hasOwnProperty.call( store, id ) ? store[ id ] : null;
}

export function setStoredTags( id, tags ) {
	const store = readStore( TAGS_STORAGE_KEY );
	store[ id ] = tags || [];
	writeStore( TAGS_STORAGE_KEY, store );
}

export function getStoredNewsletters( id ) {
	const store = readStore( NEWSLETTERS_STORAGE_KEY );
	return Object.prototype.hasOwnProperty.call( store, id ) ? store[ id ] : null;
}

export function setStoredNewsletters( id, ids ) {
	const store = readStore( NEWSLETTERS_STORAGE_KEY );
	store[ id ] = ids || [];
	writeStore( NEWSLETTERS_STORAGE_KEY, store );
}
