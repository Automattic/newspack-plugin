// @jest-environment jsdom

/**
 * External dependencies
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/dataviews', () => ( {
	filterSortAndPaginate: data => ( {
		data,
		paginationInfo: { totalItems: data.length, totalPages: 1 },
	} ),
} ) );

jest.mock( '../../../../../../packages/components/src', () => {
	const React = require( 'react' );
	return {
		DataViews: ( { data, fields } ) => (
			<table data-testid="dataviews">
				<tbody>
					{ data.map( ( item, i ) => (
						<tr key={ i }>
							{ fields.map( field => (
								<td key={ field.id }>{ field.render( { item } ) }</td>
							) ) }
						</tr>
					) ) }
				</tbody>
			</table>
		),
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
		label: 'Reader verification',
		description: 'Verification email',
		post_id: 1,
		edit_link: '/edit/1',
		subject: 'Verify your email',
		from_name: 'Test',
		from_email: 'test@example.com',
		reply_to_email: 'test@example.com',
		status: 'publish',
		type: 'reader-activation-verification',
		category: 'reader-activation',
		default_shown: true,
		trigger_description: 'Sent when a reader needs to verify their email address.',
		registry_slug: 'verification',
		recipient: 'reader',
	},
	{
		label: 'Payment receipt',
		description: 'Receipt email',
		post_id: 2,
		edit_link: '/edit/2',
		subject: 'Your receipt',
		from_name: 'Test',
		from_email: 'test@example.com',
		reply_to_email: 'test@example.com',
		status: 'publish',
		type: 'receipt',
		category: 'reader-revenue',
		default_shown: true,
		trigger_description: 'Sent after a successful payment.',
		registry_slug: 'receipt',
		recipient: 'reader',
	},
	{
		label: 'Account deletion',
		description: 'Delete account email',
		post_id: 3,
		edit_link: '/edit/3',
		subject: 'Account deleted',
		from_name: 'Test',
		from_email: 'test@example.com',
		reply_to_email: 'test@example.com',
		status: 'publish',
		type: 'reader-activation-delete-account',
		category: 'reader-activation',
		default_shown: false,
		trigger_description: 'Sent when a reader requests to delete their account.',
		registry_slug: 'delete-account',
		recipient: 'reader',
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

	it( 'renders DataViews with email data', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		expect( screen.getByText( 'Reader verification' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Payment receipt' ) ).toBeInTheDocument();
	} );

	it( 'renders Recipient column with correct values', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		// All mock emails have recipient: 'reader'.
		const readerCells = screen.getAllByText( 'Reader' );
		expect( readerCells.length ).toBeGreaterThanOrEqual( 2 );
	} );

	it( 'renders status as Enabled / Disabled', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		// All mock emails have status: 'publish'.
		const enabledCells = screen.getAllByText( 'Enabled' );
		expect( enabledCells.length ).toBeGreaterThanOrEqual( 2 );
	} );

	it( '"Show all" toggle changes filter', async () => {
		const Emails = require( './emails' ).default;
		render( <Emails /> );

		await waitFor( () => {
			expect( screen.getByTestId( 'dataviews' ) ).toBeInTheDocument();
		} );

		// Default: only default_shown emails.
		expect( screen.getByText( 'Reader verification' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Payment receipt' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Account deletion' ) ).not.toBeInTheDocument();

		// Click "Show all emails".
		fireEvent.click( screen.getByText( 'Show all emails' ) );

		// Now all emails should be visible.
		expect( screen.getByText( 'Reader verification' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Payment receipt' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Account deletion' ) ).toBeInTheDocument();

		// Toggle text should change.
		expect( screen.getByText( 'Show default emails' ) ).toBeInTheDocument();
	} );
} );
