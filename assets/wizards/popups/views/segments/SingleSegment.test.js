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

	it( 'renders title field, and a disabled save button', () => {
		expect( screen.getByPlaceholderText( 'Untitled Segment' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Save' ) ).toBeDisabled();
	} );

	it( 'shows the reach notice when you start adding criteria.', () => {
		const noticeText = 'This segment would reach approximately 100% of recorded visitors.';

		// Reach notice doesn't appear until a section is enabled.
		expect( screen.queryByText( noticeText ) ).not.toBeInTheDocument();

		// Toggle on a section.
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect( screen.queryByText( noticeText ) ).toBeInTheDocument();

		// Toggle off the section.
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );

		// Reach notice doesn't appear if no criteria are enabled.
		expect( screen.queryByText( noticeText ) ).not.toBeInTheDocument();
	} );

	it( 'enables child fields when a section is toggled on', () => {
		expect( screen.queryByTestId( 'min-articles-input' ) ).toBeDisabled();
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect( screen.queryByTestId( 'min-articles-input' ) ).not.toBeDisabled();
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect( screen.queryByTestId( 'min-articles-input' ) ).toBeDisabled();

		expect( screen.queryByTestId( 'subscriber-select' ) ).toBeDisabled();
		fireEvent.click( screen.getByText( 'Reader Activity' ) );
		expect( screen.queryByTestId( 'subscriber-select' ) ).not.toBeDisabled();
		fireEvent.click( screen.getByText( 'Reader Activity' ) );
		expect( screen.queryByTestId( 'subscriber-select' ) ).toBeDisabled();

		expect( screen.queryByTestId( 'referrers-input' ) ).toBeDisabled();
		fireEvent.click( screen.getByText( 'Referrer Sources' ) );
		expect( screen.queryByTestId( 'referrers-input' ) ).not.toBeDisabled();
		fireEvent.click( screen.getByText( 'Referrer Sources' ) );
		expect( screen.queryByTestId( 'referrers-input' ) ).toBeDisabled();
	} );

	it( 'creates a new segment', async () => {
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		fireEvent.change( screen.getByPlaceholderText( 'Untitled Segment' ), {
			target: { value: 'Big time readers' },
		} );
		expect( screen.getByText( 'Save' ) ).toBeDisabled();

		fireEvent.change( screen.getByPlaceholderText( 'Min posts' ), { target: { value: '42' } } );
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

	it( 'disables referrers section if engagement section is enabled, and vice versa', () => {
		// Toggle on Reader Engagement section.
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect( screen.queryByTestId( 'min-articles-input' ) ).not.toBeDisabled();
		expect(
			screen.queryByText( 'Disable Reader Engagement in order to use Referrer Sources options.' )
		).toBeInTheDocument();

		// Ensure the Referrer Sources section is disabled.
		fireEvent.click( screen.getByText( 'Referrer Sources' ) );
		expect( screen.queryByTestId( 'referrers-input' ) ).toBeDisabled();

		// Toggle off Reader Engagement section.
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect(
			screen.queryByText( 'Disable Reader Engagement in order to use Referrer Sources options.' )
		).not.toBeInTheDocument();

		// Toggle on Referrer Sources section.
		fireEvent.click( screen.getByText( 'Referrer Sources' ) );
		expect( screen.queryByTestId( 'referrers-input' ) ).not.toBeDisabled();
		expect(
			screen.queryByText( 'Disable Referrer Sources in order to use Reader Engagement options.' )
		).toBeInTheDocument();

		// Ensure the Reader Engagement section is disabled.
		fireEvent.click( screen.getByText( 'Reader Engagement' ) );
		expect( screen.queryByTestId( 'min-articles-input' ) ).toBeDisabled();
	} );
} );
