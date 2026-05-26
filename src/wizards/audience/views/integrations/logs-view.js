/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useMemo } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { Spinner } from '@wordpress/components';
import { DataViews as WPDataViews } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { Badge, DataViews } from '../../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../packages/components/src/wizard/store';
import { API_BASE, STATUS_MAP, formatTimestamp } from './constants';
import { LogDetailsModal } from './log-details-modal';
import './style.scss';

const DEFAULT_VIEW = {
	type: 'table',
	page: 1,
	perPage: 25,
	sort: { field: 'timestamp', direction: 'desc' },
	search: '',
	fields: [ 'timestamp', 'event', 'status' ],
	filters: [],
	layout: {
		styles: {
			timestamp: { width: '75%' },
			event: { width: '15%' },
			status: { width: '10%' },
		},
	},
};

export const LogsView = ( { integrations, match } ) => {
	const integrationId = match?.params?.integrationId;
	const integration = integrationId ? integrations[ integrationId ] : null;
	const { addNotice, setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );

	const [ data, setData ] = useState( [] );
	const [ total, setTotal ] = useState( 0 );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ hasLoadedOnce, setHasLoadedOnce ] = useState( false );
	const [ view, setView ] = useState( DEFAULT_VIEW );

	useEffect( () => {
		if ( integration ) {
			setHeaderData( {
				sectionName: `${ integration.name } / ${ __( 'Logs', 'newspack-plugin' ) }`,
				actions: [
					{
						type: 'secondary',
						label: __( 'Back to Integrations', 'newspack-plugin' ),
						icon: 'chevronLeft',
						href: '#/settings',
					},
				],
			} );
		}
	}, [ integration, setHeaderData ] );

	const statusFilter = view.filters?.find( f => f.field === 'status' )?.value;

	const fetchLogs = useCallback( () => {
		if ( ! integrationId ) {
			return;
		}
		setIsLoading( true );

		const orderbyMap = {
			timestamp: 'scheduled_date_gmt',
			status: 'status',
		};

		const path = addQueryArgs( `${ API_BASE }/${ integrationId }/logs`, {
			page: view.page,
			per_page: view.perPage,
			orderby: orderbyMap[ view.sort?.field || 'timestamp' ] || 'scheduled_date_gmt',
			order: ( view.sort?.direction || 'desc' ).toUpperCase(),
			search: view.search || undefined,
			status: statusFilter || undefined,
		} );

		apiFetch( { path } )
			.then( response => {
				setData( response.items );
				setTotal( response.total );
			} )
			.catch( () => {
				addNotice( {
					message: __( 'Failed to load activity logs. Please try again.', 'newspack-plugin' ),
					type: 'error',
					id: 'integration-logs-fetch-error',
				} );
			} )
			.finally( () => {
				setIsLoading( false );
				setHasLoadedOnce( true );
			} );
	}, [ integrationId, view.page, view.perPage, view.sort?.field, view.sort?.direction, view.search, statusFilter, addNotice ] );

	useEffect( () => {
		fetchLogs();
	}, [ fetchLogs ] );

	const fields = useMemo(
		() => [
			{
				id: 'timestamp',
				label: __( 'Timestamp', 'newspack-plugin' ),
				render: ( { item } ) => formatTimestamp( item.timestamp ),
				enableSorting: true,
			},
			{
				id: 'event',
				label: __( 'Event', 'newspack-plugin' ),
				getValue: ( { item } ) => item.event,
				enableSorting: false,
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				render: ( { item } ) => {
					const mapped = STATUS_MAP[ item.status ] || { label: item.status, level: 'default' };
					return <Badge text={ mapped.label } level={ mapped.level } />;
				},
				enableSorting: true,
				elements: [
					{ value: 'complete', label: __( 'Success', 'newspack-plugin' ) },
					{ value: 'failed', label: __( 'Failed', 'newspack-plugin' ) },
					{ value: 'pending', label: __( 'Pending', 'newspack-plugin' ) },
					{ value: 'canceled', label: __( 'Canceled', 'newspack-plugin' ) },
				],
				filterBy: {
					operators: [ 'is' ],
				},
			},
		],
		[]
	);

	const runAction = useCallback(
		actionId => {
			apiFetch( {
				path: `${ API_BASE }/${ integrationId }/logs/${ actionId }/run`,
				method: 'POST',
			} )
				.then( response => {
					let message;
					if ( response.status === 'complete' ) {
						message = __( 'Action completed.', 'newspack-plugin' );
					} else if ( response.status === 'failed' ) {
						message = response.message || __( 'Action failed.', 'newspack-plugin' );
					} else {
						message = response.message || __( 'Action processed.', 'newspack-plugin' );
					}
					addNotice( {
						message,
						type: response.status === 'failed' ? 'error' : 'success',
						id: `integration-action-run-${ actionId }`,
					} );
				} )
				.catch( err => {
					const message = err && err.message ? err.message : __( 'Could not run action.', 'newspack-plugin' );
					addNotice( {
						message,
						type: 'error',
						id: `integration-action-run-${ actionId }`,
					} );
				} )
				.finally( () => {
					fetchLogs();
				} );
		},
		[ integrationId, addNotice, fetchLogs ]
	);

	const actions = useMemo(
		() => [
			{
				id: 'view-details',
				label: __( 'View details', 'newspack-plugin' ),
				modalHeader: __( 'Action details', 'newspack-plugin' ),
				RenderModal: ( { items } ) => <LogDetailsModal integrationId={ integrationId } actionId={ items[ 0 ].id } />,
			},
			{
				id: 'run-now',
				label: __( 'Run now', 'newspack-plugin' ),
				isEligible: item => item.status === 'pending',
				callback: items => runAction( items[ 0 ].id ),
			},
		],
		[ integrationId, runAction ]
	);

	const paginationInfo = useMemo(
		() => ( {
			totalItems: total,
			totalPages: Math.ceil( total / ( view.perPage || 25 ) ),
		} ),
		[ total, view.perPage ]
	);

	if ( ! integrationId || ! integration ) {
		return null;
	}

	if ( ! hasLoadedOnce ) {
		return (
			<div style={ { display: 'flex', justifyContent: 'center', alignItems: 'center' } }>
				<Spinner />
			</div>
		);
	}

	return (
		<DataViews
			className="newspack-integration-logs"
			data={ data }
			fields={ fields }
			actions={ actions }
			view={ view }
			onChangeView={ setView }
			paginationInfo={ paginationInfo }
			defaultLayouts={ { table: {} } }
			isLoading={ isLoading }
			getItemId={ item => item.id }
			search
		>
			<div className="dataviews__view-actions">
				<div className="dataviews__search">
					<WPDataViews.Search />
					<WPDataViews.FiltersToggle />
				</div>
			</div>
			<WPDataViews.FiltersToggled className="dataviews-filters__container" />
			<WPDataViews.Layout />
			<WPDataViews.Footer />
		</DataViews>
	);
};
