/**
 * Action Scheduler DataViews component.
 *
 * Reusable DataViews table for ActionScheduler actions.
 * When initialized with a `group` prop, actions are filtered to that group
 * and the group column/filter is hidden.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useCallback, useMemo, useRef, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { DataViews } from '@wordpress/dataviews';
/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { Button, Spinner, __experimentalHStack as HStack, __experimentalVStack as VStack } from '@wordpress/components';
/* eslint-enable @wordpress/no-unsafe-wp-apis */
import type { Action, Field, View, SupportedLayouts } from '@wordpress/dataviews';

interface ScheduledAction {
	id: number;
	hook: string;
	status: string;
	group: string;
	scheduled: string;
	last_attempt: string | null;
	claim_id: number;
	extended_args: string;
	args: string;
}

interface RetryLogEntry {
	message: string;
	date: string;
}

interface RetryAction {
	id: number;
	status: string;
	group: string;
	scheduled: string | null;
	retry_count: number | null;
	max_retries: number | null;
	reason: string;
	logs: RetryLogEntry[];
}

interface ActionsResponse {
	actions: ScheduledAction[];
	total: number;
	page: number;
	total_pages: number;
}

interface ActionSchedulerProps {
	group?: string;
}

const STATUS_OPTIONS = [
	{ value: 'pending', label: __( 'Pending', 'newspack-plugin' ) },
	{ value: 'complete', label: __( 'Complete', 'newspack-plugin' ) },
	{ value: 'failed', label: __( 'Failed', 'newspack-plugin' ) },
	{ value: 'canceled', label: __( 'Canceled', 'newspack-plugin' ) },
];

const defaultLayouts: SupportedLayouts = { table: {} };

function StatusBadge( { status }: { status: string } ) {
	const colors: Record< string, { bg: string; fg: string } > = {
		pending: { bg: '#FFF3CD', fg: '#856404' },
		complete: { bg: '#D4EDDA', fg: '#155724' },
		failed: { bg: '#F8D7DA', fg: '#721C24' },
		canceled: { bg: '#E2E3E5', fg: '#383D41' },
	};
	const { bg, fg } = colors[ status ] || colors.canceled;
	return (
		<span
			style={ {
				backgroundColor: bg,
				color: fg,
				padding: '2px 8px',
				borderRadius: '3px',
				fontSize: '12px',
				fontWeight: 500,
			} }
		>
			{ status }
		</span>
	);
}

function formatDate( value: string | null ) {
	if ( ! value || value === '0000-00-00 00:00:00' ) {
		return __( 'N/A', 'newspack-plugin' );
	}
	return new Date( value + 'Z' ).toLocaleString();
}

function formatArgs( args: string ) {
	if ( ! args || args === '[]' || args === 'null' ) {
		return null;
	}
	try {
		return JSON.stringify( JSON.parse( args ), null, 2 );
	} catch {
		return args;
	}
}

function parseActionArgs( item: ScheduledAction ): Record< string, unknown > | null {
	const raw = item.extended_args || item.args;
	try {
		const parsed = JSON.parse( raw );
		return parsed?.[ 0 ] ?? null;
	} catch {
		return null;
	}
}

function getActionArg( item: ScheduledAction, key: string ): string | null {
	const args = parseActionArgs( item );
	if ( ! args || args[ key ] === undefined || args[ key ] === null ) {
		return null;
	}
	return String( args[ key ] );
}

function getUserId( item: ScheduledAction ): string | null {
	// Direct user_id arg (e.g. retries).
	const direct = getActionArg( item, 'user_id' );
	if ( direct ) {
		return direct;
	}

	// Data event handler: look for data.user_id in the dispatches array.
	if ( item.hook === 'newspack_data_events_handle' ) {
		const raw = item.extended_args || item.args;
		try {
			const parsed = JSON.parse( raw );
			const dispatches = parsed?.[ 0 ];
			if ( Array.isArray( dispatches ) ) {
				for ( const dispatch of dispatches ) {
					const uid = dispatch?.data?.user_id;
					if ( uid !== undefined && uid !== null ) {
						return String( uid );
					}
				}
			}
		} catch {
			// Ignore parse errors.
		}
	}

	return null;
}

function getDetailRows( item: ScheduledAction ): { label: string; value: string }[] {
	const raw = item.extended_args || item.args;
	let parsed: unknown;
	try {
		parsed = JSON.parse( raw );
	} catch {
		return [];
	}
	if ( ! Array.isArray( parsed ) || parsed.length === 0 ) {
		return [];
	}

	// Data event handler: AS args is [ dispatches[] ], so parsed[0] is the dispatches array.
	if ( item.hook === 'newspack_data_events_handle' ) {
		const dispatches = parsed[ 0 ];
		if ( ! Array.isArray( dispatches ) ) {
			return [];
		}
		const names = dispatches.map( ( d: Record< string, unknown > ) => d?.action_name ).filter( Boolean ) as string[];
		if ( ! names.length ) {
			return [];
		}
		return [ { label: __( 'Actions', 'newspack-plugin' ), value: names.join( ', ' ) } ];
	}

	// Sync retry / data event retry: single object at [0] with context and reason.
	const first = parsed[ 0 ] as Record< string, unknown > | undefined;
	if ( ! first ) {
		return [];
	}
	const rows: { label: string; value: string }[] = [];
	if ( first.retry_count !== undefined && first.max_retries !== undefined ) {
		rows.push( { label: __( 'Retry', 'newspack-plugin' ), value: `${ first.retry_count }/${ first.max_retries }` } );
	}
	if ( first.context ) {
		rows.push( { label: __( 'Context', 'newspack-plugin' ), value: String( first.context ) } );
	}
	if ( first.reason ) {
		rows.push( { label: __( 'Reason', 'newspack-plugin' ), value: String( first.reason ) } );
	}
	return rows;
}

interface LogEntry {
	id: number;
	message: string;
	date: string;
}

function ActionLogs( { actionId }: { actionId: number } ) {
	const [ logs, setLogs ] = useState< LogEntry[] | null >( null );

	useEffect( () => {
		apiFetch< LogEntry[] >( {
			path: `/newspack/v1/action-scheduler/actions/${ actionId }/logs`,
		} ).then( setLogs );
	}, [ actionId ] );

	if ( logs === null ) {
		return <Spinner />;
	}

	if ( logs.length === 0 ) {
		return <em>{ __( 'No log entries.', 'newspack-plugin' ) }</em>;
	}

	return (
		<table className="widefat striped" style={ { margin: 0 } }>
			<thead>
				<tr>
					<th style={ { width: '180px' } }>{ __( 'Date', 'newspack-plugin' ) }</th>
					<th>{ __( 'Message', 'newspack-plugin' ) }</th>
				</tr>
			</thead>
			<tbody>
				{ logs.map( log => (
					<tr key={ log.id }>
						<td style={ { fontSize: '12px', whiteSpace: 'nowrap' } }>{ formatDate( log.date ) }</td>
						<td style={ { fontSize: '12px' } }>{ log.message }</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}

function getRetryId( item: ScheduledAction ): string | null {
	const raw = item.extended_args || item.args;
	try {
		const parsed = JSON.parse( raw );
		return parsed?.[ 0 ]?.retry_id || null;
	} catch {
		return null;
	}
}

function RetryTimeline( { actionId }: { actionId: number } ) {
	const [ retries, setRetries ] = useState< RetryAction[] | null >( null );

	useEffect( () => {
		apiFetch< RetryAction[] >( {
			path: `/newspack/v1/action-scheduler/actions/${ actionId }/retries`,
		} ).then( setRetries );
	}, [ actionId ] );

	if ( retries === null ) {
		return <Spinner />;
	}

	if ( retries.length === 0 ) {
		return <em>{ __( 'No related retries found.', 'newspack-plugin' ) }</em>;
	}

	return (
		<table className="widefat striped" style={ { margin: 0 } }>
			<thead>
				<tr>
					<th style={ { width: '80px' } }>{ __( 'Retry', 'newspack-plugin' ) }</th>
					<th style={ { width: '180px' } }>{ __( 'Scheduled', 'newspack-plugin' ) }</th>
					<th>{ __( 'Reason', 'newspack-plugin' ) }</th>
				</tr>
			</thead>
			<tbody>
				{ retries.map( retry => (
					<tr key={ retry.id } style={ retry.id === actionId ? { backgroundColor: '#f0f6fc' } : {} }>
						<td style={ { fontSize: '12px' } }>
							<strong>{ `${ retry.retry_count ?? '?' }/${ retry.max_retries ?? '?' }` }</strong>
						</td>
						<td style={ { fontSize: '12px', whiteSpace: 'nowrap' } }>{ formatDate( retry.scheduled ) }</td>
						<td style={ { fontSize: '12px' } }>
							{ retry.reason ? (
								<span style={ { color: '#721C24' } }>{ retry.reason }</span>
							) : (
								<span style={ { color: '#155724' } }>{ __( 'Succeeded', 'newspack-plugin' ) }</span>
							) }
						</td>
					</tr>
				) ) }
			</tbody>
		</table>
	);
}

export default function ActionScheduler( { group }: ActionSchedulerProps ) {
	const hasGroup = Boolean( group );

	const defaultView: View = useMemo(
		() => ( {
			type: 'table',
			search: '',
			page: 1,
			perPage: 20,
			sort: {
				field: 'scheduled',
				direction: 'desc',
			},
			fields: [ ...( hasGroup ? [] : [ 'group' ] ), 'hook', 'status', 'scheduled', 'user_id', 'details' ],
			filters: [],
		} ),
		[ hasGroup ]
	);

	const [ data, setData ] = useState< ScheduledAction[] >( [] );
	const [ totalItems, setTotalItems ] = useState( 0 );
	const [ totalPages, setTotalPages ] = useState( 0 );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ view, setView ] = useState< View >( defaultView );
	const [ groups, setGroups ] = useState< string[] >( [] );
	const [ hooks, setHooks ] = useState< string[] >( [] );
	const [ labels, setLabels ] = useState< { hooks: Record< string, string >; groups: Record< string, string > } >( { hooks: {}, groups: {} } );

	// Fetch available groups, hooks, and labels on mount.
	useEffect( () => {
		if ( ! hasGroup ) {
			apiFetch< string[] >( {
				path: '/newspack/v1/action-scheduler/groups',
			} ).then( setGroups );
		}
		apiFetch< string[] >( {
			path: '/newspack/v1/action-scheduler/hooks',
		} ).then( setHooks );
		apiFetch< { hooks: Record< string, string >; groups: Record< string, string > } >( {
			path: '/newspack/v1/action-scheduler/labels',
		} ).then( setLabels );
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	const groupOptions = useMemo( () => groups.map( g => ( { value: g, label: labels.groups[ g ] || g } ) ), [ groups, labels ] );
	const hookOptions = useMemo( () => hooks.map( h => ( { value: h, label: labels.hooks[ h ] || h } ) ), [ hooks, labels ] );

	// Keep a ref to the latest view so fetchActions can read it without being recreated.
	const viewRef = useRef( view );
	viewRef.current = view;

	// Stable fetch function that reads from viewRef.
	const fetchActions = useCallback(
		( silent = false ) => {
			const currentView = viewRef.current;
			if ( ! silent ) {
				setIsLoading( true );
			}

			const params = new URLSearchParams( {
				per_page: String( currentView.perPage || 20 ),
				page: String( currentView.page || 1 ),
			} );

			if ( group ) {
				params.set( 'group', group );
			}

			if ( currentView.sort?.field ) {
				const orderbyMap: Record< string, string > = {
					scheduled: 'scheduled_date_gmt',
					hook: 'hook',
					status: 'status',
					id: 'action_id',
				};
				params.set( 'orderby', orderbyMap[ currentView.sort.field ] || 'scheduled_date_gmt' );
				params.set( 'order', currentView.sort.direction?.toUpperCase() || 'DESC' );
			}

			if ( currentView.search ) {
				params.set( 'search', currentView.search );
			}

			if ( currentView.filters ) {
				for ( const filter of currentView.filters ) {
					if ( filter.field === 'scheduled' && filter.operator && filter.value ) {
						params.set( 'scheduled_op', filter.operator );
						params.set( 'scheduled_value', JSON.stringify( filter.value ) );
						continue;
					}
					const val = typeof filter.value === 'string' ? filter.value : '';
					if ( filter.field === 'status' && val ) {
						params.set( 'status', val );
					}
					if ( filter.field === 'group' && val && ! group ) {
						params.set( 'group', val );
					}
					if ( filter.field === 'hook' && val ) {
						params.set( 'hook', val );
					}
				}
			}

			apiFetch< ActionsResponse >( {
				path: `/newspack/v1/action-scheduler/actions?${ params.toString() }`,
			} )
				.then( response => {
					setData( response.actions );
					setTotalItems( response.total );
					setTotalPages( response.total_pages );
				} )
				.finally( () => {
					if ( ! silent ) {
						setIsLoading( false );
					}
				} );
		},
		[ group ]
	);

	const fetchRef = useRef( fetchActions );
	fetchRef.current = fetchActions;

	// Serialize view properties that should trigger an immediate fetch (excluding search).
	const viewKey = JSON.stringify( {
		perPage: view.perPage,
		page: view.page,
		sort: view.sort,
		filters: view.filters,
	} );

	// Fetch immediately when non-search view properties change.
	useEffect( () => {
		fetchActions();
	}, [ viewKey ] ); // eslint-disable-line react-hooks/exhaustive-deps

	// Debounce search changes.
	const debounceRef = useRef< ReturnType< typeof setTimeout > >();
	useEffect( () => {
		debounceRef.current = setTimeout( () => fetchActions(), 300 );
		return () => clearTimeout( debounceRef.current );
	}, [ view.search ] ); // eslint-disable-line react-hooks/exhaustive-deps

	const fields: Field< ScheduledAction >[] = useMemo(
		() => [
			{
				id: 'hook',
				label: __( 'Hook', 'newspack-plugin' ),
				enableSorting: true,
				enableGlobalSearch: true,
				elements: hookOptions,
				filterBy: {
					operators: [ 'is' as const ],
					isPrimary: true,
				},
				render: ( { item } ) => {
					const hookLabel = labels.hooks[ item.hook ];
					return hookLabel ? (
						<span title={ item.hook } style={ { fontSize: '12px' } }>
							{ hookLabel }
						</span>
					) : (
						<code style={ { fontSize: '12px' } }>{ item.hook }</code>
					);
				},
			},
			{
				id: 'status',
				label: __( 'Status', 'newspack-plugin' ),
				enableSorting: true,
				elements: STATUS_OPTIONS,
				filterBy: {
					operators: [ 'is' as const ],
					isPrimary: true,
				},
				render: ( { item } ) => <StatusBadge status={ item.status } />,
			},
			...( hasGroup
				? []
				: [
						{
							id: 'group',
							label: __( 'Group', 'newspack-plugin' ),
							enableSorting: false,
							elements: groupOptions,
							filterBy: {
								operators: [ 'is' as const ],
								isPrimary: true,
							},
							render: ( { item }: { item: ScheduledAction } ) => {
								const groupLabel = labels.groups[ item.group ];
								return groupLabel ? (
									<span title={ item.group } style={ { fontSize: '12px' } }>
										{ groupLabel }
									</span>
								) : (
									<code style={ { fontSize: '12px' } }>{ item.group }</code>
								);
							},
						} as Field< ScheduledAction >,
				  ] ),
			{
				id: 'scheduled',
				type: 'datetime' as const,
				label: __( 'Scheduled', 'newspack-plugin' ),
				enableSorting: true,
				getValue: ( { item }: { item: ScheduledAction } ) => {
					if ( ! item.scheduled || item.scheduled === '0000-00-00 00:00:00' ) {
						return '';
					}
					return item.scheduled.replace( ' ', 'T' ) + 'Z';
				},
				filterBy: {
					isPrimary: true,
				},
				render: ( { item } ) => {
					if ( ! item.scheduled || item.scheduled === '0000-00-00 00:00:00' ) {
						return <em>{ __( 'N/A', 'newspack-plugin' ) }</em>;
					}
					const date = new Date( item.scheduled + 'Z' );
					return <time dateTime={ date.toISOString() }>{ date.toLocaleString() }</time>;
				},
			},
			{
				id: 'user_id',
				label: __( 'User ID', 'newspack-plugin' ),
				enableSorting: false,
				enableHiding: true,
				render: ( { item } ) => {
					const userId = getUserId( item );
					return userId ? <code style={ { fontSize: '12px' } }>{ userId }</code> : <em>{ __( 'N/A', 'newspack-plugin' ) }</em>;
				},
			},
			{
				id: 'details',
				label: __( 'Details', 'newspack-plugin' ),
				enableSorting: false,
				enableHiding: true,
				render: ( { item } ) => {
					const rows = getDetailRows( item );
					if ( ! rows.length ) {
						return <em>{ __( 'N/A', 'newspack-plugin' ) }</em>;
					}
					return (
						<span style={ { fontSize: '11px' } }>
							{ rows.map( ( row, i ) => (
								<Fragment key={ i }>
									{ i > 0 && <br /> }
									<strong>{ row.label }: </strong>
									{ row.value }
								</Fragment>
							) ) }
						</span>
					);
				},
			},
		],
		[ groupOptions, hookOptions, labels, hasGroup ]
	);

	const actions: Action< ScheduledAction >[] = useMemo(
		() => [
			{
				id: 'run',
				label: ( items: ScheduledAction[] ) =>
					items.length === 1 && items[ 0 ]?.status === 'failed' ? __( 'Try again', 'newspack-plugin' ) : __( 'Run now', 'newspack-plugin' ),
				isPrimary: true,
				isEligible: item => item.status !== 'complete',
				RenderModal: ( { items, closeModal } ) => {
					const item = items[ 0 ];
					const isFailed = item.status === 'failed';
					const runLabel = isFailed ? __( 'Try again', 'newspack-plugin' ) : __( 'Run now', 'newspack-plugin' );
					const [ isRunning, setIsRunning ] = useState( false );
					const [ result, setResult ] = useState< { success?: boolean; error?: string } | null >( null );

					const onRun = () => {
						setIsRunning( true );
						apiFetch< { success: boolean; status: string } >( {
							path: `/newspack/v1/action-scheduler/actions/${ item.id }/run`,
							method: 'POST',
						} )
							.then( response => {
								setResult( { success: response.success } );
								fetchRef.current( true );
							} )
							.catch( ( error: Error & { message?: string } ) => {
								setResult( { error: error.message || __( 'Failed to run action.', 'newspack-plugin' ) } );
							} )
							.finally( () => setIsRunning( false ) );
					};

					if ( result ) {
						return (
							<VStack spacing={ 4 }>
								{ result.success ? (
									<p style={ { color: '#155724' } }>{ __( 'Action executed successfully.', 'newspack-plugin' ) }</p>
								) : (
									<p style={ { color: '#721C24' } }>{ result.error }</p>
								) }
								<HStack justify="flex-end">
									<Button variant="tertiary" onClick={ closeModal }>
										{ __( 'Close', 'newspack-plugin' ) }
									</Button>
								</HStack>
							</VStack>
						);
					}

					return (
						<VStack spacing={ 4 }>
							<p>{ __( 'Run this action immediately?', 'newspack-plugin' ) }</p>
							<table className="widefat striped" style={ { margin: 0 } }>
								<tbody>
									<tr>
										<th style={ { width: '100px' } }>{ __( 'Hook', 'newspack-plugin' ) }</th>
										<td>
											<code>{ item.hook }</code>
										</td>
									</tr>
									<tr>
										<th>{ __( 'Status', 'newspack-plugin' ) }</th>
										<td>
											<StatusBadge status={ item.status } />
										</td>
									</tr>
									<tr>
										<th>{ __( 'Group', 'newspack-plugin' ) }</th>
										<td>
											<code>{ item.group }</code>
										</td>
									</tr>
								</tbody>
							</table>
							<HStack justify="flex-end">
								<Button variant="tertiary" onClick={ closeModal }>
									{ __( 'Cancel', 'newspack-plugin' ) }
								</Button>
								<Button variant="primary" onClick={ onRun } isBusy={ isRunning } disabled={ isRunning }>
									{ isRunning ? __( 'Running…', 'newspack-plugin' ) : runLabel }
								</Button>
							</HStack>
						</VStack>
					);
				},
				modalHeader: ( items: ScheduledAction[] ) =>
					`${ items[ 0 ]?.status === 'failed' ? __( 'Retry action', 'newspack-plugin' ) : __( 'Run action', 'newspack-plugin' ) } #${
						items[ 0 ].id
					}`,
			},
			{
				id: 'view',
				label: __( 'View details', 'newspack-plugin' ),
				isPrimary: true,
				RenderModal: ( { items, closeModal } ) => {
					const item = items[ 0 ];
					const argsFormatted = formatArgs( item.extended_args || item.args );
					const retryId = getRetryId( item );
					const detailRows = getDetailRows( item );
					return (
						<VStack spacing={ 4 }>
							<table className="widefat striped" style={ { margin: 0 } }>
								<tbody>
									<tr>
										<th style={ { width: '140px' } }>{ __( 'ID', 'newspack-plugin' ) }</th>
										<td>{ item.id }</td>
									</tr>
									<tr>
										<th>{ __( 'Hook', 'newspack-plugin' ) }</th>
										<td>
											<code>{ item.hook }</code>
										</td>
									</tr>
									<tr>
										<th>{ __( 'Status', 'newspack-plugin' ) }</th>
										<td>
											<StatusBadge status={ item.status } />
										</td>
									</tr>
									<tr>
										<th>{ __( 'Group', 'newspack-plugin' ) }</th>
										<td>
											<code>{ item.group }</code>
										</td>
									</tr>
									<tr>
										<th>{ __( 'Scheduled', 'newspack-plugin' ) }</th>
										<td>{ formatDate( item.scheduled ) }</td>
									</tr>
									<tr>
										<th>{ __( 'Last attempt', 'newspack-plugin' ) }</th>
										<td>{ formatDate( item.last_attempt ) }</td>
									</tr>
									{ item.claim_id > 0 && (
										<tr>
											<th>{ __( 'Claim ID', 'newspack-plugin' ) }</th>
											<td>{ item.claim_id }</td>
										</tr>
									) }
									{ detailRows.map( ( row, i ) => (
										<tr key={ i }>
											<th>{ row.label }</th>
											<td>{ row.value }</td>
										</tr>
									) ) }
								</tbody>
							</table>
							{ argsFormatted && (
								<Fragment>
									<h4 style={ { margin: 0 } }>{ __( 'Arguments', 'newspack-plugin' ) }</h4>
									<pre
										style={ {
											margin: 0,
											padding: '8px',
											backgroundColor: '#f0f0f0',
											borderRadius: '3px',
											fontSize: '12px',
											maxHeight: '200px',
											overflow: 'auto',
											whiteSpace: 'pre-wrap',
											wordBreak: 'break-word',
										} }
									>
										{ argsFormatted }
									</pre>
								</Fragment>
							) }
							<h4 style={ { margin: 0 } }>{ __( 'Logs', 'newspack-plugin' ) }</h4>
							<ActionLogs actionId={ item.id } />
							{ retryId && (
								<Fragment>
									<h4 style={ { margin: 0 } }>{ __( 'Retry timeline', 'newspack-plugin' ) }</h4>
									<RetryTimeline actionId={ item.id } />
								</Fragment>
							) }
							<HStack justify="flex-end">
								<Button variant="tertiary" onClick={ closeModal }>
									{ __( 'Close', 'newspack-plugin' ) }
								</Button>
							</HStack>
						</VStack>
					);
				},
				modalHeader: ( items: ScheduledAction[] ) => `#${ items[ 0 ].id } — ${ items[ 0 ].hook }`,
			},
		],
		[]
	);

	const paginationInfo = useMemo( () => ( { totalItems, totalPages } ), [ totalItems, totalPages ] );
	const getItemId = useCallback( ( item: ScheduledAction ) => String( item.id ), [] );

	return (
		<DataViews
			data={ data }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			actions={ actions }
			paginationInfo={ paginationInfo }
			defaultLayouts={ defaultLayouts }
			isLoading={ isLoading }
			getItemId={ getItemId }
			search
		/>
	);
}
