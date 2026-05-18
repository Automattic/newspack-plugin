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
		{ id: 'group-1', name: 'Remote group', type: 'group', active: true, db_id: 2, edit_link: 'https://example.test/edit-remote' },
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
		await waitFor( () => expect( screen.getByRole( 'button', { name: /Add new local list/ } ) ).toBeEnabled() );
		fireEvent.click( screen.getByRole( 'button', { name: /Add new local list/ } ) );
		expect( listener ).toHaveBeenCalled();
		expect( listener.mock.calls[ 0 ][ 0 ].detail ).toEqual( { mode: 'add' } );
		document.removeEventListener( NN_EVENTS.OPEN_MODAL, listener );
	} );

	it( 'dispatches OPEN_MODAL with mode=edit + kind=local when Edit is clicked on a local row', async () => {
		const listener = jest.fn();
		document.addEventListener( NN_EVENTS.OPEN_MODAL, listener );
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByText( 'Local A' ) ).toBeInTheDocument() );
		fireEvent.click( screen.getAllByRole( 'button', { name: /^Edit$/ } )[ 0 ] );
		expect( listener.mock.calls[ 0 ][ 0 ].detail ).toEqual(
			expect.objectContaining( { mode: 'edit', kind: 'local', list: expect.objectContaining( { db_id: 1 } ) } )
		);
		document.removeEventListener( NN_EVENTS.OPEN_MODAL, listener );
	} );

	it( 'dispatches OPEN_MODAL with mode=edit + kind=esp when Edit is clicked on a remote row', async () => {
		const listener = jest.fn();
		document.addEventListener( NN_EVENTS.OPEN_MODAL, listener );
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByText( 'Remote group' ) ).toBeInTheDocument() );
		// Remote rows now have an Edit button too — second one in the list.
		fireEvent.click( screen.getAllByRole( 'button', { name: /^Edit$/ } )[ 1 ] );
		expect( listener.mock.calls[ 0 ][ 0 ].detail ).toEqual(
			expect.objectContaining( { mode: 'edit', kind: 'esp', list: expect.objectContaining( { db_id: 2 } ) } )
		);
		document.removeEventListener( NN_EVENTS.OPEN_MODAL, listener );
	} );

	it( 'commits the active toggle immediately via PATCH /lists/{db_id}', async () => {
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByText( 'Local A' ) ).toBeInTheDocument() );
		// Configure the next response (a successful PATCH echoing the row).
		apiFetch.mockResolvedValueOnce( { id: 'tag-1', db_id: 1, active: true } );
		fireEvent.click( screen.getAllByRole( 'checkbox' )[ 0 ] );
		await waitFor( () =>
			expect( apiFetch ).toHaveBeenLastCalledWith( {
				path: '/newspack-newsletters/v1/lists/1',
				method: 'PATCH',
				data: { active: true },
			} )
		);
	} );

	it( 'does not render the bulk Save Subscription Lists button', async () => {
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByText( 'Local A' ) ).toBeInTheDocument() );
		expect( screen.queryByRole( 'button', { name: /Save Subscription Lists/ } ) ).not.toBeInTheDocument();
	} );

	it( 'does not render inline title/description fields on remote rows', async () => {
		render( <SubscriptionLists lockedLists={ false } provider="mailchimp" /> );
		await waitFor( () => expect( screen.getByText( 'Remote group' ) ).toBeInTheDocument() );
		expect( screen.queryByLabelText( /List title/ ) ).not.toBeInTheDocument();
		expect( screen.queryByLabelText( /List description/ ) ).not.toBeInTheDocument();
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
		await waitFor( () => expect( screen.getByRole( 'button', { name: /Add new local list/ } ) ).toBeEnabled() );
		fireEvent.click( screen.getByRole( 'button', { name: /Add new local list/ } ) );
		jest.advanceTimersByTime( 600 );
		expect( window.location.href ).toBe( originalHref );
		jest.useRealTimers();
	} );
} );
