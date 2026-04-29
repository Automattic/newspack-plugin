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

export function getSubscriberById( id ) {
	return SUBSCRIBERS.find( s => s.id === id );
}

// PROTOTYPE ONLY: notes are persisted to the current admin's localStorage so
// they survive a refresh during a demo. In production these need to live
// server-side (REST endpoint + user/post meta or an option) so they're
// shared across every admin viewing the same subscriber.
const NOTES_STORAGE_KEY = 'newspack-subscribers-demo:notes';

function readNotesStore() {
	try {
		return JSON.parse( window.localStorage.getItem( NOTES_STORAGE_KEY ) ) || {};
	} catch ( e ) {
		return {};
	}
}

export function getStoredNotes( id ) {
	return readNotesStore()[ id ] || [];
}

export function setStoredNotes( id, notes ) {
	try {
		const store = readNotesStore();
		if ( notes && notes.length ) {
			store[ id ] = notes;
		} else {
			delete store[ id ];
		}
		window.localStorage.setItem( NOTES_STORAGE_KEY, JSON.stringify( store ) );
	} catch ( e ) {
		// Storage quota or disabled — fail silently in the prototype.
	}
}
