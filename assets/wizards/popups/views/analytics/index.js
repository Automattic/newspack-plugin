/**
 * External dependencies.
 */
import { stringify } from 'qs';
import classnames from 'classnames';

/**
 * WordPress dependencies.
 */
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies.
 */
import { withWizardScreen } from '../../../../components/src';
import Filters from './Filters';
import Chart from './Chart';
import Info from './Info';
import './style.scss';
import { useFiltersState, useAnalyticsState } from './utils';

/**
 * Popups Analytics screen.
 */
const PopupAnalytics = ( { setError, isLoading, startLoading, doneLoading } ) => {
	const [ filtersState, dispatchFilter ] = useFiltersState();
	const [ state, updateState ] = useAnalyticsState();
	const { report, labels, actions, key_metrics, post_edit_link, hasFetchedOnce } = state;

	useEffect( () => {
		startLoading();
		apiFetch( { path: `/newspack/v1/popups-analytics/report/?${ stringify( filtersState ) }` } )
			.then( response => {
				updateState( { type: 'UPDATE_ALL', payload: response } );
				doneLoading();
			} )
			.catch( setError );
	}, [ filtersState ] );

	if ( ! hasFetchedOnce && isLoading ) {
		return null;
	}

	const handleFilterChange = type => payload => dispatchFilter( { type, payload } );

	return (
		<div
			className={ classnames( 'newspack-campaigns-wizard-analytics__wrapper', {
				'newspack-campaigns-wizard-analytics__wrapper--loading': isLoading,
			} ) }
		>
			<Filters
				disabled={ isLoading }
				labelFilters={ labels }
				eventActionFilters={ actions }
				filtersState={ filtersState }
				onChange={ handleFilterChange }
			/>
			{ report && <Chart data={ report } isLoading={ isLoading } /> }
			{ key_metrics && (
				<Info
					keyMetrics={ key_metrics }
					filtersState={ filtersState }
					labelFilters={ labels }
					isLoading={ isLoading }
					postEditLink={ post_edit_link }
				/>
			) }
		</div>
	);
};

export default withWizardScreen( PopupAnalytics );
