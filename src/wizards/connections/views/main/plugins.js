/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { ActionCard, Button, hooks, Waiting } from '../../../../components/src';

async function fetchHandler( slug, action = '' ) {
	const path = action
		? `/newspack/v1/plugins/${ slug }/${ action }`
		: `/newspack/v1/plugins/${ slug }`;
	const method = action ? 'POST' : 'GET';
	const result = await apiFetch( { path, method } );
	return {
		status: result.Status,
		configured: result.Configured,
	};
}

const PLUGINS = {
	jetpack: {
		pluginSlug: 'jetpack',
		editLink: 'admin.php?page=jetpack#/settings',
		title: 'Jetpack',
		init: () => fetchHandler( 'jetpack' ),
		activate: () => fetchHandler( 'jetpack', 'activate' ),
		install: () => fetchHandler( 'jetpack', 'install' ),
	},
	'google-site-kit': {
		pluginSlug: 'google-site-kit',
		editLink: 'admin.php?page=googlesitekit-splash',
		title: __( 'Site Kit by Google', 'newspack-plugin' ),
		statusDescription: {
			notConfigured: __( 'Not connected for this user', 'newspack-plugin' ),
		},
		init: () => fetchHandler( 'google-site-kit' ),
		activate: () => fetchHandler( 'google-site-kit', 'activate' ),
		install: () => fetchHandler( 'google-site-kit', 'install' ),
	},
	everlit: {
		pluginSlug: 'everlit',
		editLink: 'admin.php?page=everlit_settings',
		title: __( 'Everlit', 'newspack-plugin' ),
		subTitle: __( 'AI-Generated Audio Stories', 'newspack-plugin' ),
		hidden: window.newspack_connections_data.can_use_everlit !== '1',
		description: (
			<>
				{ __(
					'Complete setup and licensing agreement to unlock 5 free audio stories per month.',
					'newspack-plugin'
				) }{ ' ' }
				<a href="https://everlit.audio/" target="_blank" rel="noreferrer">
					{ __( 'Learn more', 'newspack-plugin' ) }
				</a>
			</>
		),
		statusDescription: {
			uninstalled: __( 'Not installed.', 'newspack-plugin' ),
			inactive: __( 'Inactive.', 'newspack-plugin' ),
			notConfigured: __( 'Pending.', 'newspack-plugin' ),
		},
		init: () => fetchHandler( 'everlit' ),
		activate: () => fetchHandler( 'everlit', 'activate' ),
		install: () => fetchHandler( 'everlit', 'install' ),
	},
};

const pluginConnectButton = ( {
	isLoading,
	isSetup,
	isActive,
	onActivate,
	onInstall,
	isInstalled,
	...plugin
} ) => {
	if ( plugin.status === 'page-reload' ) {
		return <span className="gray">{ __( 'Page reloading…', 'newspack-plugin' ) }</span>;
	}
	if ( isLoading ) {
		return <Waiting />;
	}
	if ( ! isInstalled ) {
		return (
			<Button isLink onClick={ onInstall }>
				{
					/* translators: %s: Plugin name */
					sprintf( __( 'Install %s', 'newspack-plugin' ), plugin.title )
				}
			</Button>
		);
	}
	if ( ! isActive ) {
		return (
			<Button isLink onClick={ onActivate }>
				{
					/* translators: %s: Plugin name */
					sprintf( __( 'Activate %s', 'newspack-plugin' ), plugin.title )
				}
			</Button>
		);
	}
	if ( ! isSetup ) {
		return <a href={ plugin.editLink }>{ __( 'Complete Setup', 'newspack-plugin' ) }</a>;
	}
};

const Plugin = ( { plugin, setError } ) => {
	const [ pluginState, setPluginState ] = hooks.useObjectState( plugin );
	const { title, subTitle } = pluginState;
	const isActive = pluginState.status === 'active';
	const isInstalled = pluginState.status !== 'uninstalled';
	const isConfigured = pluginState.configured;
	const isSetup = isActive && isConfigured;
	const isLoading = ! pluginState.status;

	useEffect( () => {
		plugin
			.init()
			.then( update => setPluginState( update ) )
			.catch( setError );
	}, [] );

	const getDescription = () => {
		if ( isLoading ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		const descriptionSuffix = plugin.description ?? '';
		let description = '';
		if ( ! isInstalled ) {
			description =
				pluginState.statusDescription?.uninstalled ?? __( 'Uninstalled.', 'newspack-plugin' );
		} else if ( ! isActive ) {
			description = pluginState.statusDescription?.inactive ?? __( 'Inactive.', 'newspack-plugin' );
		} else if ( ! isConfigured ) {
			description =
				pluginState.statusDescription?.notConfigured ?? __( 'Not connected.', 'newspack-plugin' );
		} else {
			description = __( 'Connected', 'newspack-plugin' );
		}
		return (
			<>
				{ __( 'Status:', 'newspack-plugin' ) } { description }{ ' ' }
				{ ! isSetup ? descriptionSuffix : '' }
			</>
		);
	};

	const onActivate = () => {
		setPluginState( { status: '' } );
		pluginState
			.activate()
			.then( () => setPluginState( { status: 'page-reload' } ) )
			.finally( () => {
				window.location.reload();
			} );
	};

	const onInstall = () => {
		setPluginState( { status: '' } );
		pluginState.install().then( update => setPluginState( update ) );
	};

	return (
		<ActionCard
			title={ `${ title }${ subTitle ? `: ${ subTitle }` : '' }` }
			description={ getDescription }
			actionText={
				! isSetup
					? pluginConnectButton( {
							isSetup,
							isActive,
							isLoading,
							isInstalled,
							onActivate,
							onInstall,
							...pluginState,
					  } )
					: null
			}
			disabled={ isLoading }
			checkbox={ ! isSetup || isLoading ? 'unchecked' : 'checked' }
			isMedium
		/>
	);
};

const Plugins = ( { setError } ) => {
	return (
		<>
			{ Object.entries( PLUGINS ).map( ( [ slug, plugin ] ) => {
				return (
					! Boolean( plugin.hidden ) && (
						<Plugin key={ slug } plugin={ plugin } setError={ setError } />
					)
				);
			} ) }
		</>
	);
};

export default Plugins;
