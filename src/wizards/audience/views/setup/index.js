/* global newspackAudience */

/**
 * Configuration
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState, forwardRef } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import Setup from './setup';
import Campaign from './campaign';
import Complete from './complete';
import { withWizard } from '../../../../../packages/components/src';
import Router from '../../../../../packages/components/src/proxied-imports/router';
import ContentGating from './content-gating';
import Payment from './payment';
import { useWizardData } from '../../../../../packages/components/src/wizard/store/utils';
import PlatformSelection from '../../components/platform-selection';

const { HashRouter, Redirect, Route, Switch } = Router;

function AudienceWizard( { pluginRequirements, wizardApiFetch }, ref ) {
	const [ inFlight, setInFlight ] = useState( false );
	const [ config, setConfig ] = useState( {} );
	const [ prerequisites, setPrerequisites ] = useState( null );
	const [ error, setError ] = useState( false );
	const [ espSyncErrors, setEspSyncErrors ] = useState( [] );

	const fetchConfig = () => {
		setError( false );
		setInFlight( true );
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-audience/audience-management',
		} )
			.then( ( { config: fetchedConfig, prerequisites_status, can_esp_sync } ) => {
				setPrerequisites( prerequisites_status );
				setConfig( fetchedConfig );
				setEspSyncErrors( can_esp_sync.errors );
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	const updateConfig = ( key, val ) => {
		setConfig( { ...config, [ key ]: val } );
	};
	const saveConfig = data => {
		setError( false );
		setInFlight( true );
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-audience/audience-management',
			method: 'post',
			quiet: true,
			data,
		} )
			.then( ( { config: fetchedConfig, prerequisites_status, can_esp_sync } ) => {
				setPrerequisites( prerequisites_status );
				setConfig( fetchedConfig );
				setEspSyncErrors( can_esp_sync.errors );
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};

	useEffect( () => {
		window.scrollTo( 0, 0 );
		fetchConfig();
	}, [] );

	const paymentData = useWizardData( 'newspack-audience/payment' );
	const platform = paymentData?.platform_data?.platform;
	const platformSelected = paymentData?.platform_data?.platform_selected;
	// `null` = undecided until payment data loads. Driven by local state (not the live
	// `platform_selected`) so the chooser stays mounted while plugins auto-install — the
	// save flips `platform_selected` to true before install finishes.
	const [ showChooser, setShowChooser ] = useState( null );
	useEffect( () => {
		if ( showChooser === null && typeof platformSelected === 'boolean' ) {
			setShowChooser( ! platformSelected );
		}
	}, [ platformSelected, showChooser ] );
	const chooserOpen = showChooser === true;

	let tabs = chooserOpen
		? []
		: [
				{
					label: config.enabled ? __( 'Configuration', 'newspack-plugin' ) : __( 'Setup', 'newspack-plugin' ),
					path: '/',
				},
				config.enabled &&
					newspackAudience.has_memberships && {
						label: __( 'Content Gating', 'newspack-plugin' ),
						path: '/content-gating',
					},
				[ 'wc', 'nrh' ].includes( platform ) && {
					label: __( 'Checkout & Payment', 'newspack-plugin' ),
					path: '/payment',
				},
		  ];
	tabs = tabs.filter( tab => tab );

	const getSharedProps = ( configKey, type = 'checkbox' ) => {
		const props = {
			onChange: val => updateConfig( configKey, val ),
		};
		if ( configKey !== 'enabled' ) {
			props.disabled = inFlight;
		}
		switch ( type ) {
			case 'checkbox':
				props.checked = Boolean( config[ configKey ] );
				break;
			case 'text':
				props.value = config[ configKey ] || '';
				break;
		}

		return props;
	};

	const props = {
		headerText: __( 'Audience Management', 'newspack-plugin' ),
		tabbedNavigation: tabs,
		wizardApiFetch,
		inFlight,
		error,
		fetchConfig,
		updateConfig,
		saveConfig,
		setInFlight,
		setError,
		getSharedProps,
		espSyncErrors,
		prerequisites,
		config,
		onChangePlatform: () => setShowChooser( true ),
		platform,
	};

	return (
		<div ref={ ref }>
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ () =>
							chooserOpen ? (
								<PlatformSelection
									onComplete={ () => {
										setShowChooser( false );
										fetchConfig();
									} }
									onCancel={ platformSelected ? () => setShowChooser( false ) : undefined }
								/>
							) : (
								<Setup { ...props } />
							)
						}
					/>
					<Route path="/content-gating" render={ () => <ContentGating { ...props } /> } />
					<Route path="/payment" render={ () => <Payment { ...props } /> } />
					<Route path="/campaign" render={ () => <Campaign { ...props } /> } />
					<Route path="/complete" render={ () => <Complete { ...props } /> } />
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		</div>
	);
}

export default withWizard( forwardRef( AudienceWizard ) );
