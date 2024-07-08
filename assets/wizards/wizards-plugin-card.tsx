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

/**
 * Helper for managing plugins API requests.
 *
 * @param slug Plugin slug to fetch
 * @param action Endpoint action to request
 * @param apiFetch Wizard API Fetch instance
 * @param callbacks Wizard API Fetch callbacks
 * @return Wizard API Fetch response
 */
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

/**
 * Wizard Plugin Action Card component.
 *
 * @param {Object} props Component props.
 * @param {boolean} props.isLoading Whether the plugin is performing an API request.
 * @param {boolean} props.isSetup Whether the plugin is install, active and configured.
 * @param {boolean} props.isActive Whether the plugin is active.
 * @param {Function} props.onActivate Callback to activate the plugin.
 * @param {Function} props.onInstall Callback to install the plugin.
 * @param {boolean} props.isInstalled Whether the plugin is installed.
 * @param {string} props.status Plugin status.
 * @param {string} props.title Plugin title.
 * @param {string} props.editLink Plugin edit link.
 */
function WizardsPluginCardButton( {
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

/**
 * Wizard Plugin Card component.
 *
 * @param {Object} props Component props.
 * @param {string} props.slug Plugin slug.
 * @param {string} props.title Plugin title.
 * @param {string} props.subTitle Plugin subtitle. String appended to title.
 * @param {string} props.editLink Plugin edit link.
 * @param {string} props.description Plugin description.
 * @param {string} props.statusDescription Plugin status description.
 */
function WizardsPluginCard( {
	slug,
	title,
	subTitle,
	editLink,
	description,
	statusDescription,
	onStatusChange = () => {},
}: PluginCard & { onStatusChange?: ( statuses: Record< string, boolean > ) => void } ) {
	const { wizardApiFetch, errorMessage } = useWizardApiFetch(
		`/newspack/wizards/plugins/${ slug }`
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
		isError: Boolean( errorMessage ),
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

	useEffect( () => {
		onStatusChange( statuses );
	}, [ statuses ] );

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
		if ( statuses.isError ) {
			return __( 'Status: Error!', 'newspack-plugin' );
		}
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
		<WizardsActionCard
			title={ `${ title }${ subTitle ? `: ${ subTitle }` : '' }` }
			description={ getDescription }
			actionText={
				! statuses.isSetup && ! statuses.isError ? (
					<WizardsPluginCardButton
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
	);
}

export default WizardsPluginCard;
