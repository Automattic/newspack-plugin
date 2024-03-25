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
	dependencies: dependenciesProp = null,
	statusLabels,
	endpoint,
	then,
}: SiteAction ) => {
	const [ requestStatus, setRequestStatus ] = useState< Statuses >( 'idle' );
	const [ failedDependencies, setFailedDependencies ] = useState< string[] >( [] );
	const [ isModalVisible, setIsModalVisible ] = useState( false );
	const parsedStatusLabels = { ...defaultStatusLabels, ...statusLabels };

	const dependencies = structuredClone( dependenciesProp ) as Dependencies;

	useEffect( () => {
		makeRequest();
	}, [] );

	const makeRequest = ( pluginInfo = {} ) => {
		// When/if a dependency is activated update reference.
		if ( dependencies && Object.keys( pluginInfo ).length > 0 ) {
			for ( const [ pluginName ] of Object.entries( pluginInfo ) ) {
				dependencies[ pluginName ].isActive = true;
			}
		}
		return new Promise( ( resolve, reject ) => {
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
					resolve( false );
					return;
				}
			}
			// Preflight check
			if ( ! canConnect ) {
				setRequestStatus( 'error' );
				resolve( false );
				return;
			}
			// Pending API request
			setRequestStatus( 'pending' );
			apiFetch( {
				path: endpoint,
			} )
				.then( data => {
					const requestStatus = then( data );
					setRequestStatus( requestStatus ? 'success' : 'error' );
					resolve( requestStatus );
				} )
				.catch( () => {
					then( false );
					setRequestStatus( 'error' );
					reject();
				} );
		} );
	};

	const classes = `newspack-site-action newspack-site-action__${ requestStatus }`;

	const statusLabel =
		dependencies && 'error-dependency' === requestStatus ? (
			<Tooltip
				text={ sprintf(
					// translators: %s is a comma separated list of needed dependencies.
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
					onSuccess={ makeRequest }
					onRequestClose={ setIsModalVisible }
				/>
			) }
			{ statusLabel }
		</>
	);
};

export default SiteAction;
