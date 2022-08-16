/**
 * External dependencies.
 */
import { uniqBy } from 'lodash';
import { subDays } from 'date-fns';

/**
 * WordPress dependencies.
 */
import { useReducer } from '@wordpress/element';

import { formatDate } from '../../utils';

const filtersInitialState = {
	event_label_id: '',
	event_action: '',
	start_date: formatDate( subDays( new Date(), 7 ) ),
	end_date: formatDate(),
};

const filtersReducer = ( state, action ) => {
	switch ( action.type ) {
		case 'SET_RANGE_FILTER':
			return { ...state, start_date: action.payload.start_date, end_date: action.payload.end_date };
		case 'SET_EVENT_LABEL_FILTER':
			return { ...state, event_label_id: action.payload };
		case 'SET_EVENT_ACTION_FILTER':
			return { ...state, event_action: action.payload };
		default:
			return state;
	}
};

export const useFiltersState = () => useReducer( filtersReducer, filtersInitialState );

const analyticsInitialState = {
	labels: [],
	actions: [],
};

const analyticsReducer = ( state, action ) => {
	switch ( action.type ) {
		case 'UPDATE_ALL':
			const { labels, actions, ...rest } = action.payload;
			const newState = {
				...state,
				...rest,
				// Persist all fetched labels and actions, so the select options do not disappear
				labels: uniqBy( [ ...state.labels, ...labels ], 'value' ),
				actions: uniqBy( [ ...state.actions, ...actions ], 'value' ),
			};
			return newState;
		default:
			return state;
	}
};

export const useAnalyticsState = () => useReducer( analyticsReducer, analyticsInitialState );
