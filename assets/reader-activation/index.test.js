import {
	store,
	dispatch,
	getActivities,
	setReaderEmail,
	setAuthenticated,
	getReader,
} from './index';
import { on, off } from './events';

describe( 'newspackReaderActivation', () => {
	it( 'should have a dispatch method', () => {
		expect( typeof dispatch ).toBe( 'function' );
	} );
	it( 'should emit an event on dispatch', () => {
		const callback = jest.fn();
		on( 'activity', callback );
		dispatch( 'test-emit-on', { test: 'test' } );
		expect( callback ).toHaveBeenCalled();
	} );
	it( 'should not emit to removed listener', () => {
		const callback = jest.fn();
		on( 'activity', callback );
		off( 'activity', callback );
		dispatch( 'test-emit-off', { test: 'test' } );
		expect( callback ).not.toHaveBeenCalled();
	} );
	it( 'should store data and emit an event when setting store key', () => {
		const callback = jest.fn();
		on( 'data', callback );
		store.set( 'test-set', 'test' );
		expect( callback ).toHaveBeenCalled();
		expect( store.get( 'test-set' ) ).toEqual( 'test' );
	} );
	it( 'should dispatch activities', () => {
		const activity = {
			action: 'test',
			data: {
				test: 'test',
			},
			timestamp: 1234567890,
		};
		dispatch( activity.action, activity.data, activity.timestamp );
		expect( getActivities( 'test' ) ).toEqual( [ activity ] );
	} );
	it( 'should dispatch activities with a timestamp', () => {
		const activity = {
			action: 'test-timestamp',
			data: {
				test: 'test',
			},
		};
		dispatch( activity.action, activity.data );
		expect( typeof getActivities( 'test-timestamp' )[ 0 ].timestamp ).toBe( 'number' );
	} );
	it( 'should clear added items older than 30 days', () => {
		dispatch( 'old-activity', {}, 1 ); // Old timestamp.
		dispatch( 'new-activity', {} ); // Dispatching a new activity should clear old ones.
		expect( getActivities( 'old-activity' ) ).toEqual( [] );
	} );
	it( 'should not store more than 1000 items in a key', () => {
		for ( let i = 0; i < 1001; i++ ) {
			dispatch( 'test-amount', {} );
		}
		expect( getActivities( 'test-amount' ).length ).toEqual( 1000 );
	} );
	it( 'should store reader email', () => {
		const email = 'test@example.com';
		setReaderEmail( email );
		expect( getReader().email ).toEqual( email );
	} );
	it( 'should store reader authentication', () => {
		expect( getReader().authenticated ).toBeFalsy();
		setAuthenticated( true );
		expect( getReader().authenticated ).toEqual( true );
	} );
	it( 'should emit an event when reader is updated', () => {
		const callback = jest.fn();
		on( 'reader', callback );
		setReaderEmail( 'test@example.com' );
		expect( callback ).toHaveBeenCalled();
	} );
} );
