/**
 * Newspack - Dashboard, Site Action
 */

/**
 * Dependencies
 */
// WordPress
import { __, _n, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useState, useEffect } from '@wordpress/element';
import { Tooltip } from '@wordpress/components';
// Internal
import SiteActionModal from './site-action-modal';

const defaultStatusLabels = {
	idle: '',
	success: __( 'Connected', 'newspack-plugin' ),
	pending: __( 'Fetching…', 'newspack-plugin' ),
	'pending-install': __( 'Installing…', 'newspack-plugin' ),
	// Error types
	error: __( 'Disconnected', 'newspack-plugin' ),
};

const SiteAction = ( {
	label = '',
	canConnect = true,
	dependencies = null,
	statusLabels,
	endpoint,
	then,
}: SiteAction ) => {
	const [ requestStatus, setRequestStatus ] = useState< Statuses >( 'idle' );
	const [ failedDependencies, setFailedDependencies ] = useState< string[] >( [] );
	const [ isModalVisible, setIsModalVisible ] = useState( false );
	const parsedStatusLabels = { ...defaultStatusLabels, ...statusLabels };

	useEffect( () => {
		// Dependency check
		if ( dependencies && Object.keys( dependencies ).length > 0 ) {
			const failedDeps: string[] = [];
			for ( const [ dependencyName, dependencyInfo ] of Object.entries( dependencies ) ) {
				// Don't process active
				if ( dependencyInfo.isActive ) {
					continue;
				}
				failedDeps.push( dependencyName );
			}
			setFailedDependencies( failedDeps );
			if ( failedDeps.length > 0 ) {
				setRequestStatus( 'error-dependency' );
				return;
			}
		}
		// Preflight check
		if ( ! canConnect ) {
			setRequestStatus( 'error' );
			return;
		}
		// Pending API request
		setRequestStatus( 'pending' );
		apiFetch( {
			path: endpoint,
		} )
			.then( data => {
				setRequestStatus( then( data ) ? 'success' : 'error' );
			} )
			.catch( () => {
				then( false );
				setRequestStatus( 'error' );
			} );
	}, [] );

	const classes = `newspack-site-action newspack-site-action__${ requestStatus }`;

	const statusLabel =
		dependencies && 'error-dependency' === requestStatus ? (
			<Tooltip
				text={ sprintf(
					__( '%s must be installed & activated!' ),
					failedDependencies.map( dep => dependencies[ dep ].label ).join( ', ' )
				) }
			>
				<button
					onClick={ () => setIsModalVisible( true ) }
					className={ `${ classes } newspack-site-action__install` }
				>
					{ label }:{ ' ' }
					<span>
						{ _n(
							'Missing dependency',
							'Missing dependencies',
							failedDependencies.length,
							'newspack-plugin'
						) }
					</span>
					<span className="hidden">
						{ _n(
							'Install dependency',
							'Install dependencies',
							failedDependencies.length,
							'newspack-plugin'
						) }
					</span>
				</button>
			</Tooltip>
		) : (
			<div className={ classes }>
				{ label }:<span> { parsedStatusLabels[ requestStatus ] }</span>
			</div>
		);

	return (
		<>
			{ isModalVisible && (
				<SiteActionModal
					plugins={ failedDependencies }
					onSuccess={ () => console.log( 'Complete' ) }
					onRequestClose={ setIsModalVisible }
				/>
			) }
			{ statusLabel }
		</>
	);
};

export default SiteAction;
