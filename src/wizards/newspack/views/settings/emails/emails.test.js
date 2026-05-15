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
		description: 'Receipt email',
		post_id: 1,
		edit_link: '/edit/1',
		subject: 'Your receipt',
		from_name: 'Test',
		from_email: 'test@example.com',
		reply_to_email: 'test@example.com',
		status: 'publish',
		type: 'receipt',
		category: 'reader-revenue',
		recommended: true,
		trigger_description: 'Sent after a successful payment.',
		registry_slug: 'receipt',
		recipient: 'reader',
	},
	{
		label: 'Cancellation confirmation',
		description: 'Cancellation email',
		post_id: 2,
		edit_link: '/edit/2',
		subject: 'Subscription cancelled',
		from_name: 'Test',
		from_email: 'test@example.com',
		reply_to_email: 'test@example.com',
		status: 'publish',
		type: 'cancellation',
		category: 'reader-revenue',
		recommended: true,
		trigger_description: 'Sent when a reader cancels their subscription.',
		registry_slug: 'cancellation',
		recipient: 'reader',
	},
	{
		label: 'Reader verification',
		description: 'Verification email',
		post_id: 3,
		edit_link: '/edit/3',
		subject: 'Verify your email',
		from_name: 'Test',
		from_email: 'test@example.com',
		reply_to_email: 'test@example.com',
		status: 'publish',
		type: 'reader-activation-verification',
		category: 'reader-activation',
		recommended: true,
		trigger_description: 'Sent when a reader needs to verify their email address.',
		registry_slug: 'verification',
		recipient: 'reader',
	},
	{
		label: 'Account deletion',
		description: 'Delete account email',
		post_id: 4,
		edit_link: '/edit/4',
		subject: 'Account deleted',
		from_name: 'Test',
		from_email: 'test@example.com',
		reply_to_email: 'test@example.com',
		status: 'draft',
		type: 'reader-activation-delete-account',
		category: 'reader-activation',
		recommended: false,
		trigger_description: 'Sent when a reader requests to delete their account.',
		registry_slug: 'delete-account',
		recipient: 'reader',
	},
	{
		label: 'New order (admin)',
		description: 'New order admin notification',
		post_id: 5,
		edit_link: '/edit/5',
		subject: 'New order',
		from_name: 'Test',
		from_email: 'test@example.com',
		reply_to_email: 'test@example.com',
		status: 'publish',
		type: 'new_order',
		category: 'woocommerce',
		recommended: false,
		trigger_description: 'Sent to the admin when a new order is placed.',
		registry_slug: 'woo-new-order',
		recipient: 'admin',
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
			// Emails from across the spectrum are all visible.
			expect( screen.getByText( 'Payment receipt' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Cancellation confirmation' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Reader verification' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Account deletion' ) ).toBeInTheDocument();
			expect( screen.getByText( 'New order (admin)' ) ).toBeInTheDocument();
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
			// Admin recipient.
			expect( screen.getByText( 'Admin' ) ).toBeInTheDocument();
		} );
	} );

	it( 'renders status as Enabled / Disabled', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			const enabledCells = screen.getAllByText( 'Enabled' );
			expect( enabledCells.length ).toBeGreaterThanOrEqual( 4 );
			// Account deletion is draft.
			expect( screen.getByText( 'Disabled' ) ).toBeInTheDocument();
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

	it( 'activate action calls apiFetch with publish status', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		const activate = mockCapturedActions.find( a => a.id === 'activate' );
		// mockEmails[4] (New order) is woocommerce + publish, so use a draft
		// woocommerce email to test activate eligibility correctly.
		// Account deletion (mockEmails[3]) is reader-activation and excluded by isEligible.
		// Instead, create an inline eligible item: woocommerce + draft.
		const eligibleItem = { ...mockEmails[ 4 ], status: 'draft' };
		activate.callback( [ eligibleItem ] );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/newspack_rr_email/5',
				method: 'POST',
				data: { status: 'publish' },
			} );
		} );
	} );

	it( 'reset action calls apiFetch with DELETE after confirmation', async () => {
		const { utils } = require( '../../../../../../packages/components/src' );
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		const reset = mockCapturedActions.find( a => a.id === 'reset' );
		// mockEmails[0] (Payment receipt) has type 'receipt', so eligible for reset.
		reset.callback( [ mockEmails[ 0 ] ] );

		expect( utils.confirmAction ).toHaveBeenCalled();

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/newspack/v1/wizard/newspack-audience-donations/emails/1',
				method: 'DELETE',
			} );
		} );
	} );
} );
