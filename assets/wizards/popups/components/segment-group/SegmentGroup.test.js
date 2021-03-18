import React from 'react';
import { render, waitForElement, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import SegmentGroup from './index';

// Mock component props.
const CAMPAIGN = {
	campaignData: null,
	campaignId: undefined,
};
const SEGMENT = {
	label: 'Donors',
	configuration: {
		min_posts: 0,
		max_posts: 0,
		min_session_posts: 0,
		max_session_posts: 0,
		is_subscribed: false,
		is_donor: true,
		is_not_subscribed: false,
		is_not_donor: false,
		favorite_categories: [],
		referrers: '',
	},
	id: '603692fc1f548',
	created_at: '2020-11-02',
	updated_at: '2020-11-02',
	priority: 0,
};
const PROMPTS = [
	{
		campaign_groups: [],
		categories: [],
		content: 'Overlay Prompt 1',
		id: 1,
		options: {
			placement: 'center',
			selected_segment_id: SEGMENT.id,
			frequency: 'daily',
		},
		status: 'publish',
		title: 'Overlay Prompt 1',
	},
	{
		campaign_groups: [],
		categories: [],
		content: 'Overlay Prompt 2',
		id: 2,
		options: {
			placement: 'center',
			selected_segment_id: SEGMENT.id,
			frequency: 'daily',
		},
		status: 'publish',
		title: 'Overlay Prompt 2',
	},
	{
		campaign_groups: [],
		categories: [
			{
				name: 'Tech',
				term_id: 1,
			},
		],
		content: 'Overlay Prompt 3 with category',
		id: 3,
		options: {
			placement: 'center',
			selected_segment_id: SEGMENT.id,
			frequency: 'daily',
		},
		status: 'publish',
		title: 'Overlay Prompt 3 with category',
	},
	{
		campaign_groups: [],
		categories: [
			{
				name: 'Tech',
				term_id: 1,
			},
			{
				name: 'News',
				term_id: 2,
			},
		],
		content: 'Overlay Prompt 4 with category',
		id: 4,
		options: {
			placement: 'center',
			selected_segment_id: SEGMENT.id,
			frequency: 'daily',
		},
		status: 'publish',
		title: 'Overlay Prompt 4 with category',
	},
	{
		campaign_groups: [],
		categories: [],
		content: 'Above Header Prompt 1',
		id: 5,
		options: {
			placement: 'above_header',
			selected_segment_id: SEGMENT.id,
			frequency: 'always',
		},
		status: 'publish',
		title: 'Above Header Prompt 1',
	},
	{
		campaign_groups: [],
		categories: [],
		content: 'Above Header Prompt 2',
		id: 6,
		options: {
			placement: 'above_header',
			selected_segment_id: SEGMENT.id,
			frequency: 'always',
		},
		status: 'publish',
		title: 'Above Header Prompt 2',
	},
	{
		campaign_groups: [],
		categories: [
			{
				name: 'Tech',
				term_id: 1,
			},
		],
		content: 'Above Header Prompt 3 with category',
		id: 7,
		options: {
			placement: 'above_header',
			selected_segment_id: SEGMENT.id,
			frequency: 'always',
		},
		status: 'publish',
		title: 'Above Header Prompt 3 with category',
	},
	{
		campaign_groups: [],
		categories: [
			{
				name: 'Tech',
				term_id: 1,
			},
			{
				name: 'News',
				term_id: 2,
			},
		],
		content: 'Above Header Prompt 4 with category',
		id: 8,
		options: {
			placement: 'above_header',
			selected_segment_id: SEGMENT.id,
			frequency: 'always',
		},
		status: 'publish',
		title: 'Above Header Prompt 4 with category',
	},
	{
		campaign_groups: [],
		categories: [],
		content: 'Custom Placement Prompt 1',
		id: 9,
		options: {
			placement: 'custom1',
			selected_segment_id: SEGMENT.id,
			frequency: 'always',
		},
		status: 'publish',
		title: 'Custom Placement Prompt 1',
	},
	{
		campaign_groups: [],
		categories: [],
		content: 'Custom Placement Prompt 2',
		id: 10,
		options: {
			placement: 'custom1',
			selected_segment_id: SEGMENT.id,
			frequency: 'always',
		},
		status: 'publish',
		title: 'Custom Placement Prompt 2',
	},
	{
		campaign_groups: [],
		categories: [
			{
				name: 'Tech',
				term_id: 1,
			},
		],
		content: 'Custom Placement Prompt 3 with category',
		id: 11,
		options: {
			placement: 'custom1',
			selected_segment_id: SEGMENT.id,
			frequency: 'always',
		},
		status: 'publish',
		title: 'Custom Placement Prompt 3 with category',
	},
	{
		campaign_groups: [],
		categories: [
			{
				name: 'Tech',
				term_id: 1,
			},
			{
				name: 'News',
				term_id: 2,
			},
		],
		content: 'Custom Placement Prompt 4 with category',
		id: 12,
		options: {
			placement: 'custom1',
			selected_segment_id: SEGMENT.id,
			frequency: 'always',
		},
		status: 'publish',
		title: 'Custom Placement Prompt 4 with category',
	},
];
SEGMENT.prompts = PROMPTS;

describe( 'A segment with conflicting prompts', () => {
	const mockProps = {
		campaignData: CAMPAIGN.campaignData,
		campaign: CAMPAIGN.campaignId,
		segment: SEGMENT,
	};

	beforeEach( () => {
		// Mock global vars for custom placements.
		window.newspack_popups_wizard_data = {
			custom_placements: {
				custom1: 'Custom Placement 1',
			},
		};

		render(
			<MemoryRouter>
				<SegmentGroup { ...mockProps } />
			</MemoryRouter>
		);
	} );

	it( 'renders a conflict notice for uncategorized overlays in the same segment', async () => {
		await waitForElement( () => screen.getByText( `Segment: ${ SEGMENT.label }` ) );
		const noticeText =
			'If multiple uncategorized overlays share the same segment, only the most recent one will be displayed.';
		const notices = screen.getAllByText( noticeText );
		notices.forEach( overlayNotice => expect( overlayNotice ).toBeInTheDocument() );
	} );

	it( 'renders a conflict notice for categorized overlays in the same segment', async () => {
		await waitForElement( () => screen.getByText( `Segment: ${ SEGMENT.label }` ) );
		const noticeText =
			'If multiple overlays share the same segment and category filtering, only the most recent one will be displayed.';
		const notices = screen.getAllByText( noticeText );
		notices.forEach( overlayNotice => expect( overlayNotice ).toBeInTheDocument() );
	} );

	it( 'renders a conflict notice for uncategorized above-header prompts in the same segment', async () => {
		await waitForElement( () => screen.getByText( `Segment: ${ SEGMENT.label }` ) );
		const noticeText =
			'If multiple uncategorized above-header prompts share the same segment, only the most recent one will be displayed.';
		const notices = screen.getAllByText( noticeText );
		notices.forEach( overlayNotice => expect( overlayNotice ).toBeInTheDocument() );
	} );

	it( 'renders a conflict notice for above-header prompts in the same segment', async () => {
		await waitForElement( () => screen.getByText( `Segment: ${ SEGMENT.label }` ) );
		const noticeText =
			'If multiple above-header prompts share the same segment and category filtering, only the most recent one will be displayed.';
		const notices = screen.getAllByText( noticeText );
		notices.forEach( overlayNotice => expect( overlayNotice ).toBeInTheDocument() );
	} );

	it( 'renders a conflict notice for uncategorized prompts in the same custom placement and segment', async () => {
		await waitForElement( () => screen.getByText( `Segment: ${ SEGMENT.label }` ) );
		const noticeText =
			'If multiple uncategorized prompts in the same custom placement share the same segment, only the most recent one will be displayed.';
		const notices = screen.getAllByText( noticeText );
		notices.forEach( overlayNotice => expect( overlayNotice ).toBeInTheDocument() );
	} );

	it( 'renders a conflict notice for in the same custom placement and segment', async () => {
		await waitForElement( () => screen.getByText( `Segment: ${ SEGMENT.label }` ) );
		const noticeText =
			'If multiple prompts in the same custom placement share the same segment and category filtering, only the most recent one will be displayed.';
		const notices = screen.getAllByText( noticeText );
		notices.forEach( overlayNotice => expect( overlayNotice ).toBeInTheDocument() );
	} );
} );
