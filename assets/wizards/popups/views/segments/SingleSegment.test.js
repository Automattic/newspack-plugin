import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SingleSegment from './SingleSegment';

const SEGMENTS = [
	{
		name: 'Subscribers',
		configuration: {
			min_posts: 0,
			max_posts: 0,
			min_session_posts: 0,
			max_session_posts: 0,
			is_subscribed: true,
			is_donor: false,
			is_not_subscribed: false,
			is_not_donor: false,
			favorite_categories: [],
			referrers: '',
		},
		id: '5fa056b4b94bc',
		created_at: '2020-11-02',
		updated_at: '2020-11-02',
		priority: 0,
	},
];

describe( 'A new segment creation', () => {
	const mockProps = {
		segmentId: 'new',
		setSegments: jest.fn(),
		wizardApiFetch: ( { data, method } ) =>
			new Promise( resolve => {
				if ( method === 'POST' ) {
					resolve( [ ...SEGMENTS, data ] );
				} else {
					resolve( SEGMENTS );
				}
			} ),
	};

	beforeEach( () => {
		render(
			<MemoryRouter>
				<SingleSegment { ...mockProps } />
			</MemoryRouter>
		);
	} );

	it( 'renders reach notice, title field, and a disabled save button', async () => {
		const noticeText = 'This segment would reach approximately 100% of recorded visitors.';
		await waitFor( () => screen.getByText( noticeText ) );
		expect( screen.getByPlaceholderText( 'Untitled Segment' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Save' ) ).toBeDisabled();
	} );

	it( 'expands and collapses the sections', () => {
		expect( screen.queryByText( 'Articles read' ) ).not.toBeInTheDocument();
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect( screen.queryByText( 'Articles read' ) ).toBeInTheDocument();
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect( screen.queryByText( 'Articles read' ) ).not.toBeInTheDocument();

		expect( screen.queryByText( 'Newsletter' ) ).not.toBeInTheDocument();
		fireEvent.click( screen.getByText( 'Reader Activity' ) );
		expect( screen.queryByText( 'Newsletter' ) ).toBeInTheDocument();
		fireEvent.click( screen.getByText( 'Reader Activity' ) );
		expect( screen.queryByText( 'Newsletter' ) ).not.toBeInTheDocument();

		expect( screen.queryByText( 'Sources to match' ) ).not.toBeInTheDocument();
		fireEvent.click( screen.getByText( 'Referrer Sources' ) );
		expect( screen.queryByText( 'Sources to match' ) ).toBeInTheDocument();
		fireEvent.click( screen.getByText( 'Referrer Sources' ) );
		expect( screen.queryByText( 'Sources to match' ) ).not.toBeInTheDocument();
	} );

	it( 'creates a new segment', async () => {
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		fireEvent.change( screen.getByPlaceholderText( 'Untitled Segment' ), {
			target: { value: 'Big time readers' },
		} );
		expect( screen.getByText( 'Save' ) ).toBeDisabled();

		fireEvent.change( screen.getByPlaceholderText( 'Min. posts' ), { target: { value: '42' } } );
		expect( screen.getByText( 'Save' ) ).not.toBeDisabled();

		fireEvent.click( screen.getByText( 'Save' ) );

		await waitFor( () => expect( mockProps.setSegments ).toHaveBeenCalledTimes( 1 ) );
		expect( mockProps.setSegments ).toHaveBeenCalledWith( [
			...SEGMENTS,
			{
				configuration: {
					favorite_categories: [],
					is_donor: false,
					is_not_donor: false,
					is_not_subscribed: false,
					is_subscribed: false,
					max_posts: 0,
					max_session_posts: 0,
					min_posts: '42',
					min_session_posts: 0,
					referrers: '',
					referrers_not: '',
				},
				name: 'Big time readers',
			},
		] );
	} );

	it( 'disables engagement if referrers is enabled, and vice versa', () => {
		expect( screen.queryByText( 'Articles read' ) ).not.toBeInTheDocument();

		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect( screen.queryByText( 'Articles read' ) ).toBeInTheDocument();

		fireEvent.click( screen.getByText( 'Referrer Sources' ) );
		expect( screen.queryByText( 'Sources to match' ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Disable Referrer Sources in order to use Reader Engagement options.' )
		).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Min. posts' ) ).toBeDisabled();

		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect(
			screen.queryByText( 'Disable Referrer Sources in order to use Reader Engagement options.' )
		).not.toBeInTheDocument();
		expect(
			screen.queryByText( 'Disable Reader Engagement in order to use Referrer Sources options.' )
		).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'Min. posts' ) ).not.toBeDisabled();
		expect( screen.getByPlaceholderText( 'google.com, facebook.com' ) ).toBeDisabled();
	} );
} );
