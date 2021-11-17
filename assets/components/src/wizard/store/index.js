/**
 * External dependencies.
 */
import { set, get } from 'lodash';

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register, dispatch, select } from '@wordpress/data';

import { createAction } from './utils.js';

export const WIZARD_STORE_NAMESPACE = 'newspack/wizards';

const DEFAULT_STATE = {
	isLoading: true,
	isQuietLoading: false,
	apiData: {},
	error: null,
};

/**
 * wordpress/data does not trigger a component re-render
 * on deep state change (via lodash's set function)
 * unless the state was cloned first.
 */
const clone = objectToClone => JSON.parse( JSON.stringify( objectToClone ) );

const reducer = ( state = DEFAULT_STATE, { type, payload = {} } ) => {
	switch ( type ) {
		case 'START_LOADING_DATA':
			if ( payload.isQuietLoading ) {
				return { ...state, isQuietLoading: true };
			}
			return { ...state, isLoading: true };
		case 'FINISH_LOADING_DATA':
			return { ...state, isLoading: false, isQuietLoading: false };
		case 'SET_API_DATA':
			return set( clone( state ), [ 'apiData', payload.slug ], payload.data );
		case 'UPDATE_WIZARD_SETTINGS':
			return set( clone( state ), [ 'apiData', payload.slug, ...payload.path ], payload.value );
		case 'SET_ERROR':
			return { ...state, error: payload };
		default:
			return state;
	}
};

const actions = {
	// Regular actions.
	startLoadingData: createAction( 'START_LOADING_DATA' ),
	finishLoadingData: createAction( 'FINISH_LOADING_DATA' ),
	fetchFromAPI: createAction( 'FETCH_FROM_API' ),
	setAPIDataForWizard: createAction( 'SET_API_DATA' ),
	updateWizardSettings: createAction( 'UPDATE_WIZARD_SETTINGS' ),
	setError: createAction( 'SET_ERROR' ),

	// Async actions. These will not show up in Redux devtools.
	*saveWizardSettings( { slug, section = '', payloadPath = [], updatePayload = null } ) {
		// Optionally data can be updated before saving - an immediate update case
		// (without an explicit "save" action).
		if ( updatePayload ) {
			yield actions.updateWizardSettings( { slug, ...updatePayload } );
		}
		const wizardState = select( WIZARD_STORE_NAMESPACE ).getWizardAPIData( slug );
		const updatedData = yield actions.fetchFromAPI( {
			path: `/newspack/v1/wizard/${ slug }/${ section }`,
			method: 'POST',
			data: get( wizardState, payloadPath ),
			isQuietFetch: true,
		} );
		return actions.setAPIDataForWizard( { slug, data: updatedData } );
	},
	*wizardApiFetch( fetchConfig ) {
		// Just a proxy to fetchFromAPI, but it has to be a generator.
		const result = yield actions.fetchFromAPI( fetchConfig );
		return result;
	},
};

const selectors = {
	isLoading: state => state.isLoading,
	isQuietLoading: state => state.isQuietLoading,
	getWizardAPIData: ( state, slug ) => state.apiData[ slug ] || {},
	getError: state => state.error,
};

const store = createReduxStore( WIZARD_STORE_NAMESPACE, {
	reducer,
	actions,
	selectors,

	controls: {
		FETCH_FROM_API: action => {
			dispatch( WIZARD_STORE_NAMESPACE ).startLoadingData( {
				isQuietLoading: Boolean( action.payload.isQuietFetch ),
			} );
			return apiFetch( action.payload )
				.catch( error => {
					dispatch( WIZARD_STORE_NAMESPACE ).setError( error );
				} )
				.finally( () => {
					dispatch( WIZARD_STORE_NAMESPACE ).finishLoadingData();
				} );
		},
	},

	resolvers: {
		*getWizardAPIData( slug ) {
			const data = yield actions.fetchFromAPI( {
				path: `/newspack/v1/wizard/${ slug }`,
			} );
			return actions.setAPIDataForWizard( { slug, data } );
		},
	},
} );

export default () => register( store );
