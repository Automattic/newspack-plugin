/**
 * Settings Wizard: Plugin Card component.
 */

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Button, hooks, Waiting } from '../components/src';
import WizardsActionCard from './wizards-action-card';
import { useWizardApiFetch } from './hooks/use-wizard-api-fetch';

function fetchHandler(
	slug: string,
	action = '',
	apiFetch: WizardApiFetch< { Status: string; Configured: boolean } >,
	callbacks?: ApiFetchCallbacks< { Status: string; Configured: boolean } >
) {
	const path = action
		? `/newspack/v1/plugins/${ slug }/${ action }`
		: `/newspack/v1/plugins/${ slug }`;
	const method = action ? 'POST' : 'GET';
	return apiFetch( { path, method }, callbacks );
}

function WizardsPluginConnectButton( {
	isLoading,
	isSetup,
	isActive,
	onActivate,
	onInstall,
	isInstalled,
	...plugin
}: {
	status: string;
	title: string;
	editLink?: string;
	isLoading: boolean;
	isSetup: boolean;
	isActive: boolean;
	onActivate: () => void;
	onInstall: () => void;
	isInstalled: boolean;
} ) {
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
	if ( ! isSetup && plugin.editLink ) {
		return <a href={ plugin.editLink }>{ __( 'Complete Setup', 'newspack-plugin' ) }</a>;
	}
	return null;
}

function WizardsPluginCard( {
	slug,
	title,
	subTitle,
	editLink,
	description,
	statusDescription,
}: PluginCard ) {
	const { wizardApiFetch, errorMessage } = useWizardApiFetch(
		`/newspack-settings/connections/plugins/${ slug }`
	);
	const [ pluginState, setPluginState ] = hooks.useObjectState( {
		slug,
		status: '',
		statusDescription,
		configured: false,
	} );

	const statuses = {
		isSetup: pluginState.status === 'active' && pluginState.configured,
		isActive: pluginState.status === 'active',
		isLoading: ! pluginState.status,
		isInstalled: pluginState.status !== 'uninstalled',
		isConfigured: pluginState.configured,
	};

	const on: PluginCallbacks = {
		init: fetchCallbacks =>
			fetchHandler( pluginState.slug, undefined, wizardApiFetch, fetchCallbacks ),
		activate: fetchCallbacks =>
			fetchHandler( pluginState.slug, 'activate', wizardApiFetch, fetchCallbacks ),
		install: fetchCallbacks =>
			fetchHandler( pluginState.slug, 'install', wizardApiFetch, fetchCallbacks ),
	};

	useEffect( () => {
		on.init( {
			onSuccess( update ) {
				setPluginState( {
					status: update.Status,
					configured: update.Configured,
				} );
			},
		} );
	}, [] );

	function onActivate() {
		setPluginState( { status: '' } );
		on.activate( {
			onSuccess() {
				setPluginState( { status: 'page-reload' } );
			},
			onFinally() {
				window.location.reload();
			},
		} );
	}

	function onInstall() {
		setPluginState( { status: '' } );
		on.install( {
			onSuccess( update ) {
				setPluginState( {
					status: update.Status,
					configured: update.Configured,
				} );
			},
		} );
	}

	function getDescription() {
		if ( statuses.isLoading ) {
			return __( 'Loading…', 'newspack-plugin' );
		}
		const descriptionSuffix = description ?? '';
		let newDescription = '';
		if ( ! statuses.isInstalled ) {
			newDescription =
				pluginState.statusDescription?.uninstalled ?? __( 'Uninstalled.', 'newspack-plugin' );
		} else if ( ! statuses.isActive ) {
			newDescription =
				pluginState.statusDescription?.inactive ?? __( 'Inactive.', 'newspack-plugin' );
		} else if ( ! statuses.isConfigured ) {
			newDescription =
				pluginState.statusDescription?.notConfigured ?? __( 'Not connected.', 'newspack-plugin' );
		} else {
			newDescription = __( 'Connected.', 'newspack-plugin' );
		}
		return (
			<>
				{
					// Translators: %s: Plugin description
					sprintf( __( 'Status: %s', 'newspack-plugin' ), newDescription )
				}{ ' ' }
				{ ! statuses.isSetup ? descriptionSuffix : '' }
			</>
		);
	}

	return (
		<>
			{ /* <pre>{ JSON.stringify( { statuses }, null, 2 ) }</pre> */ }
			<WizardsActionCard
				title={ `${ title }${ subTitle ? `: ${ subTitle }` : '' }` }
				description={ getDescription }
				actionText={
					! statuses.isSetup ? (
						<WizardsPluginConnectButton
							{ ...{
								title,
								editLink,
								onActivate,
								onInstall,
								...statuses,
								...pluginState,
							} }
						/>
					) : null
				}
				isChecked={ statuses.isSetup }
				error={ errorMessage }
				isMedium
			/>
		</>
	);
}

export default WizardsPluginCard;
