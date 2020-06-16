/**
 * External dependencies.
 */
import { stringify } from 'qs';
import classnames from 'classnames';

/**
 * WordPress dependencies.
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies.
 */
import { withWizardScreen, Notice } from '../../../../components/src';
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
	const [ siteKitWarningText, setSiteKitWarningText ] = useState();
	const [ state, updateState ] = useAnalyticsState();
	const { report, labels, actions, key_metrics, post_edit_link, hasFetchedOnce } = state;

	useEffect( () => {
		startLoading();
		apiFetch( { path: `/newspack/v1/popups-analytics/report/?${ stringify( filtersState ) }` } )
			.then( response => {
				updateState( { type: 'UPDATE_ALL', payload: response } );
				doneLoading();
			} )
			.catch( error => {
				if (
					error.code === 'newspack_campaign_analytics_sitekit_disconnected' ||
					error.code === 'newspack_campaign_analytics_sitekit_auth'
				) {
					setSiteKitWarningText( error.message );
					doneLoading();
				} else {
					setError( error );
				}
			} );
	}, [ filtersState ] );

	if ( ! hasFetchedOnce && isLoading ) {
		return null;
	}

	const handleFilterChange = type => payload => dispatchFilter( { type, payload } );

	if ( siteKitWarningText ) {
		return (
			<Notice
				rawHTML
				isWarning
				noticeText={ `<a href="/wp-admin/admin.php?page=googlesitekit-splash">${ siteKitWarningText }</a>` }
			/>
		);
	}

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
