import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';

import { SubscriptionLists } from './index';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

const NN_EVENTS = {
	BRIDGE_MOUNTED: 'newspack-newsletters:bridge-mounted',
	OPEN_MODAL: 'newspack-newsletters:open-local-list-modal',
	OPEN_CONFIRM_DELETE: 'newspack-newsletters:open-local-list-confirm-delete',
	LOCAL_LIST_SAVED: 'newspack-newsletters:local-list-saved',
	LOCAL_LIST_DELETED: 'newspack-newsletters:local-list-deleted',
};

beforeAll( () => {
	global.newspack_newsletters_wizard = {
		new_subscription_lists_url: 'https://example.test/wp-admin/post-new.php?post_type=newspack_nl_list',
	};
} );

beforeEach( () => {
	apiFetch.mockReset();
	apiFetch.mockResolvedValue( [
		{ id: 'tag-1', name: 'Local A', type: 'local', active: false, db_id: 1, edit_link: 'https://example.test/edit-local-a' },
		{ id: 'group-1', name: 'Remote group', type: 'group', active: true },
	] );
	// Mark the bridge ready so the fallback timer doesn't navigate the test window.
	window.newspackNewslettersBridgeReady = true;
} );

afterEach( () => {
	delete window.newspackNewslettersBridgeReady;
} );

describe( 'SubscriptionLists — wizard-bridge wiring', () => {
	it( 'dispatches OPEN_MODAL with mode=add when Add New is clicked', async () => {
		const listener = jest.fn();
		document.addEventListener( NN_EVENTS.OPEN_MODAL, listener );
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByRole( 'button', { name: /^Add New$/ } ) ).toBeEnabled() );
		fireEvent.click( screen.getByRole( 'button', { name: /^Add New$/ } ) );
		expect( listener ).toHaveBeenCalled();
		expect( listener.mock.calls[ 0 ][ 0 ].detail ).toEqual( { mode: 'add' } );
		document.removeEventListener( NN_EVENTS.OPEN_MODAL, listener );
	} );

	it( 'dispatches OPEN_MODAL with mode=edit + list when Edit is clicked on a local row', async () => {
		const listener = jest.fn();
		document.addEventListener( NN_EVENTS.OPEN_MODAL, listener );
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByText( 'Local A' ) ).toBeInTheDocument() );
		fireEvent.click( screen.getAllByRole( 'button', { name: /^Edit$/ } )[ 0 ] );
		expect( listener.mock.calls[ 0 ][ 0 ].detail ).toEqual(
			expect.objectContaining( { mode: 'edit', list: expect.objectContaining( { db_id: 1 } ) } )
		);
		document.removeEventListener( NN_EVENTS.OPEN_MODAL, listener );
	} );

	it( 'dispatches OPEN_CONFIRM_DELETE when Delete is clicked on a local row', async () => {
		const listener = jest.fn();
		document.addEventListener( NN_EVENTS.OPEN_CONFIRM_DELETE, listener );
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByText( 'Local A' ) ).toBeInTheDocument() );
		fireEvent.click( screen.getByRole( 'button', { name: /^Delete$/ } ) );
		expect( listener.mock.calls[ 0 ][ 0 ].detail ).toEqual( expect.objectContaining( { list: expect.objectContaining( { db_id: 1 } ) } ) );
		document.removeEventListener( NN_EVENTS.OPEN_CONFIRM_DELETE, listener );
	} );

	it( 'reloads lists when LOCAL_LIST_SAVED fires', async () => {
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		document.dispatchEvent( new CustomEvent( NN_EVENTS.LOCAL_LIST_SAVED, { detail: { listId: 1, mode: 'edit' } } ) );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 2 ) );
	} );

	it( 'reloads lists when LOCAL_LIST_DELETED fires', async () => {
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		document.dispatchEvent( new CustomEvent( NN_EVENTS.LOCAL_LIST_DELETED, { detail: { listId: 1 } } ) );
		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 2 ) );
	} );

	it( 'does not redirect when the bridge mounted before the wizard listener registered', async () => {
		// The flag is already set in beforeEach, simulating the bridge having
		// completed boot before this component mounted. The fallback timer
		// must NOT navigate.
		jest.useFakeTimers();
		const originalHref = window.location.href;
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByRole( 'button', { name: /^Add New$/ } ) ).toBeEnabled() );
		fireEvent.click( screen.getByRole( 'button', { name: /^Add New$/ } ) );
		jest.advanceTimersByTime( 600 );
		expect( window.location.href ).toBe( originalHref );
		jest.useRealTimers();
	} );
} );
