// @jest-environment jsdom

/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

jest.mock( './emails.scss', () => ( {} ) );
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/icons', () => ( {
	Icon: ( { icon } ) => <span data-testid="icon">{ icon }</span>,
	envelope: 'envelope',
} ) );

jest.mock( '@wordpress/dataviews', () => ( {
	filterSortAndPaginate: data => ( {
		data,
		paginationInfo: { totalItems: data.length, totalPages: 1 },
	} ),
} ) );

// Use mock-prefixed name so Jest's hoisted jest.mock can close over it.
let mockCapturedActions = [];

jest.mock( '../../../../../../packages/components/src', () => {
	function renderField( field, item ) {
		if ( field.render ) {
			return field.render( { item } );
		}
		if ( field.getValue ) {
			return field.getValue( { item } );
		}
		return null;
	}
	return {
		Badge: ( { text } ) => <span>{ text }</span>,
		DataViews: ( { data, fields, actions } ) => {
			mockCapturedActions = actions || [];
			return (
				<table data-testid="dataviews">
					<tbody>
						{ data.map( ( item, i ) => (
							<tr key={ i }>
								{ fields.map( field => (
									<td key={ field.id }>{ renderField( field, item ) }</td>
								) ) }
							</tr>
						) ) }
					</tbody>
				</table>
			);
		},
		Card: ( { children } ) => <div data-testid="card">{ children }</div>,
		Notice: ( { noticeText } ) => <div data-testid="notice">{ noticeText }</div>,
		utils: {
			confirmAction: jest.fn( () => true ),
		},
	};
} );

jest.mock(
	'../../../../wizards-plugin-card',
	() =>
		function MockPluginCard( props ) {
			return <div data-testid="plugin-card">{ props.slug }</div>;
		}
);

const mockEmails = [
	{
		label: 'Payment receipt',
		post_id: 1,
		edit_link: '/edit/1',
		status: 'publish',
		type: 'receipt',
		category: 'reader-revenue',
		trigger_description: 'Sent after a successful payment.',
		registry_slug: 'receipt',
		recipient: 'reader',
		source: 'newspack',
	},
	{
		label: 'Cancellation confirmation',
		post_id: 2,
		edit_link: '/edit/2',
		status: 'publish',
		type: 'cancellation',
		category: 'reader-revenue',
		trigger_description: 'Sent when a reader cancels their subscription.',
		registry_slug: 'cancellation',
		recipient: 'reader',
		source: 'newspack',
	},
	{
		label: 'Reader verification',
		post_id: 3,
		edit_link: '/edit/3',
		status: 'publish',
		type: 'reader-activation-verification',
		category: 'reader-activation',
		trigger_description: 'Sent when a reader needs to verify their email address.',
		registry_slug: 'verification',
		recipient: 'reader',
		source: 'newspack',
	},
	{
		label: 'Account deletion',
		post_id: 4,
		edit_link: '/edit/4',
		status: 'draft',
		type: 'reader-activation-delete-account',
		category: 'reader-activation',
		trigger_description: 'Sent when a reader requests to delete their account.',
		registry_slug: 'delete-account',
		recipient: 'reader',
		source: 'newspack',
	},
	{
		label: 'New order (admin)',
		post_id: 5,
		edit_link: '/edit/5',
		status: 'publish',
		type: 'new_order',
		category: 'woocommerce',
		trigger_description: 'Sent to the admin when a new order is placed.',
		registry_slug: 'woo-new-order',
		recipient: 'admin',
		source: 'woocommerce',
	},
	{
		label: 'Order on hold',
		post_id: 6,
		edit_link: '/edit/6',
		status: 'draft',
		type: 'customer_on_hold_order',
		category: 'woocommerce',
		trigger_description: 'Sent when an order is placed on hold.',
		registry_slug: 'woo-on-hold-order',
		recipient: 'reader',
		source: 'woocommerce',
	},
];

describe( 'Emails', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		window.newspackSettings = {
			emails: {
				sections: {
					emails: {
						dependencies: {
							newspackNewsletters: true,
						},
						postType: 'newspack_rr_email',
						all: {},
						isEmailEnhancementsActive: false,
					},
				},
			},
		};
		apiFetch.mockResolvedValue( {
			newspack_emails: mockEmails,
			post_type: 'newspack_rr_email',
		} );
	} );

	it( 'renders all emails in a single view', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByText( 'Payment receipt' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Cancellation confirmation' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Reader verification' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Account deletion' ) ).toBeInTheDocument();
			expect( screen.getByText( 'New order (admin)' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Order on hold' ) ).toBeInTheDocument();
		} );
	} );

	it( 'does not render tabs, show-all toggle, or subtitle', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		expect( screen.queryByText( 'Essentials' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'All enabled' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Show all emails' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Manage the transactional emails your readers receive.' ) ).not.toBeInTheDocument();
	} );

	it( 'renders Recipient column with correct values', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			const readerCells = screen.getAllByText( 'Reader' );
			expect( readerCells.length ).toBeGreaterThanOrEqual( 4 );
			expect( screen.getByText( 'Admin' ) ).toBeInTheDocument();
		} );
	} );

	it( 'renders status as Enabled / Disabled', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			const enabledCells = screen.getAllByText( 'Enabled' );
			expect( enabledCells.length ).toBeGreaterThanOrEqual( 3 );
			const disabledCells = screen.getAllByText( 'Disabled' );
			expect( disabledCells.length ).toBeGreaterThanOrEqual( 2 );
		} );
	} );

	it( 'deactivate action calls apiFetch with draft status', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		const deactivate = mockCapturedActions.find( a => a.id === 'deactivate' );
		deactivate.callback( [ mockEmails[ 0 ] ] );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/newspack_rr_email/1',
				method: 'POST',
				data: { status: 'draft' },
			} );
		} );
	} );

	it( 'deactivate optimistically updates status and reverts on failure', async () => {
		apiFetch
			.mockResolvedValueOnce( { newspack_emails: mockEmails, post_type: 'newspack_rr_email' } )
			.mockRejectedValueOnce( new Error( 'fail' ) );

		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		// Before deactivation, count Enabled badges.
		const enabledBefore = screen.getAllByText( 'Enabled' ).length;

		const deactivate = mockCapturedActions.find( a => a.id === 'deactivate' );
		deactivate.callback( [ mockEmails[ 0 ] ] );

		// After rejection, error notice should appear and status should revert.
		await waitFor( () => {
			expect( screen.getByTestId( 'notice' ) ).toBeInTheDocument();
			expect( screen.getAllByText( 'Enabled' ).length ).toBe( enabledBefore );
		} );
	} );

	it( 'activate action calls apiFetch with publish status', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		const activate = mockCapturedActions.find( a => a.id === 'activate' );
		// mockEmails[3] (Account deletion) is newspack + draft — eligible for activate.
		activate.callback( [ mockEmails[ 3 ] ] );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/newspack_rr_email/4',
				method: 'POST',
				data: { status: 'publish' },
			} );
		} );
	} );

	it( 'deactivate/activate are not eligible for reader-activation or woocommerce emails', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		const deactivate = mockCapturedActions.find( a => a.id === 'deactivate' );
		const activate = mockCapturedActions.find( a => a.id === 'activate' );

		// Reader-activation emails cannot be toggled.
		expect( deactivate.isEligible( mockEmails[ 2 ] ) ).toBe( false );
		// WooCommerce emails cannot be toggled.
		expect( deactivate.isEligible( mockEmails[ 4 ] ) ).toBe( false );
		// Newspack reader-revenue email can be deactivated.
		expect( deactivate.isEligible( mockEmails[ 0 ] ) ).toBe( true );
		// Draft reader-activation email cannot be activated.
		expect( activate.isEligible( mockEmails[ 3 ] ) ).toBe( false );
		// Draft WooCommerce email cannot be activated.
		expect( activate.isEligible( mockEmails[ 5 ] ) ).toBe( false );
	} );

	it( 'reset action calls apiFetch with DELETE after confirmation', async () => {
		const { utils } = require( '../../../../../../packages/components/src' );
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		const reset = mockCapturedActions.find( a => a.id === 'reset' );
		reset.callback( [ mockEmails[ 0 ] ] );

		expect( utils.confirmAction ).toHaveBeenCalled();

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/newspack/v1/wizard/newspack-audience-donations/emails/1',
				method: 'DELETE',
			} );
		} );
	} );

	it( 'reset is eligible for newspack-source emails with a registry_slug', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		const reset = mockCapturedActions.find( a => a.id === 'reset' );
		// Newspack email with registry_slug — eligible.
		expect( reset.isEligible( mockEmails[ 0 ] ) ).toBe( true );
		// WooCommerce email — not eligible.
		expect( reset.isEligible( mockEmails[ 4 ] ) ).toBe( false );
		// Email without registry_slug — not eligible.
		expect( reset.isEligible( { ...mockEmails[ 0 ], registry_slug: '' } ) ).toBe( false );
	} );
} );
