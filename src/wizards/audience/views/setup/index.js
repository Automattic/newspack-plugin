/* globals newspackAudience */
/**
 * Configuration
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import Setup from './setup';
import Campaign from './campaign';
import Complete from './complete';
import { withWizard } from '../../../../components/src';
import Router from '../../../../components/src/proxied-imports/router';
import ContentGating from './content-gating';
import TransactionalEmails from './transactional-emails';
import Payment from './payment';

const { HashRouter, Redirect, Route, Switch } = Router;

function AudienceWizard( { pluginRequirements, wizardApiFetch } ) {
	const [ inFlight, setInFlight ] = useState( false );
	const [ config, setConfig ] = useState( {} );
	const [ prerequisites, setPrerequisites ] = useState( null );
	const [ error, setError ] = useState( false );
	const [ espSyncErrors, setEspSyncErrors ] = useState( [] );

	const fetchConfig = () => {
		setError( false );
		setInFlight( true );
		return wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-audience-wizard/reader-activation',
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
			path: '/newspack/v1/wizard/newspack-audience-wizard/reader-activation',
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

	const emails = Object.values( config.emails || {} );

	let tabs = null;

	if ( config.enabled ) {
		tabs = [
			{
				label: __( 'Setup', 'newspack-plugin' ),
				path: '/',
			},
			newspackAudience.has_memberships && {
				label: __( 'Content Gating', 'newspack-plugin' ),
				path: '/content-gating',
			},
			emails.length > 0 && {
				label: __( 'Transacional Emails', 'newspack-plugin' ),
				path: '/transactional-emails',
			},
			{
				label: __( 'Checkout & Payment', 'newspack-plugin' ),
				path: '/payment',
			},
		];
		tabs = tabs.filter( tab => tab );
	}

	const props = {
		headerText: __(
			'Audience Development',
			'newspack-plugin'
		),
		tabbedNavigation: tabs,
		wizardApiFetch,
		inFlight,
		error,
		fetchConfig,
		updateConfig,
		saveConfig,
		espSyncErrors,
		prerequisites,
		config,
		emails,
	};

	return (
		<>
			<HashRouter hashType="slash">
				<Switch>
					{ pluginRequirements }
					<Route
						path="/"
						exact
						render={ () => (
							<Setup { ...props } />
						) }
					/>
					<Route
						path="/content-gating"
						render={ () => (
							<ContentGating { ...props } />
						) }
					/>
					<Route
						path="/transactional-emails"
						render={ () => (
							<TransactionalEmails { ...props } />
						) }
					/>
					<Route
						path="/payment"
						render={ () => (
							<Payment { ...props } />
						) }
					/>
					<Route
						path="/campaign"
						render={ () => (
							<Campaign { ...props } />
						) }
					/>
					<Route
						path="/complete"
						render={ () => (
							<Complete { ...props } />
						) }
					/>
					<Redirect to="/" />
				</Switch>
			</HashRouter>
		</>
	);
}

export default withWizard( AudienceWizard );
