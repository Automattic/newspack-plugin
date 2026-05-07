/* global newspack_newsletters_wizard */
/**
 * Internal dependencies
 */
import values from 'lodash/values';
import mapValues from 'lodash/mapValues';
import property from 'lodash/property';
import isEmpty from 'lodash/isEmpty';
import once from 'lodash/once';

/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { sprintf, __ } from '@wordpress/i18n';
import {
	CheckboxControl,
	TextareaControl,
	ExternalLink,
	Notice,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';

// Wizard-bridge events. Mirror of `newspack-newsletters/src/wizard-bridge/events.js`
// — kept locally so this file is self-contained without a cross-repo import.
const NN_EVENT_NAMESPACE = 'newspack-newsletters';
const NN_EVENTS = {
	BRIDGE_MOUNTED: `${ NN_EVENT_NAMESPACE }:bridge-mounted`,
	OPEN_MODAL: `${ NN_EVENT_NAMESPACE }:open-local-list-modal`,
	OPEN_CONFIRM_DELETE: `${ NN_EVENT_NAMESPACE }:open-local-list-confirm-delete`,
	LOCAL_LIST_SAVED: `${ NN_EVENT_NAMESPACE }:local-list-saved`,
	LOCAL_LIST_DELETED: `${ NN_EVENT_NAMESPACE }:local-list-deleted`,
};
const NN_FALLBACK_TIMEOUT_MS = 500;

let bridgeMounted = false;
if ( typeof document !== 'undefined' ) {
	document.addEventListener( NN_EVENTS.BRIDGE_MOUNTED, () => {
		bridgeMounted = true;
	} );
}

/**
 * Internal dependencies
 */
import {
	Button,
	Card,
	ActionCard,
	Grid,
	PluginInstaller,
	SelectControl,
	TextControl,
	Waiting,
	hooks,
	withWizardScreen,
} from '../../../../../packages/components/src';

import './style.scss';

export const Settings = ( {
	onUpdate,
	newslettersConfig,
	isOnboarding = true,
	authUrl = false,
	provider,
	setProvider = () => {},
	setAuthUrl = () => {},
	setLockedLists = () => {},
} ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ config, updateConfig ] = hooks.useObjectState( {} );
	// Handle provider updates.
	useEffect( () => {
		const newProvider = newslettersConfig?.newspack_newsletters_service_provider || '';
		if ( provider !== newProvider ) {
			setError( false );
			setProvider( newProvider );
			// Don't lock lists if we are setting the initial provider and a key is already set.
			if ( ! provider && hasSelectedProviderKey() ) {
				setLockedLists( false );
			} else {
				setLockedLists( true );
			}
		}
	}, [ newslettersConfig?.newspack_newsletters_service_provider ] );
	// Verify token for OAuth providers.
	useEffect( () => {
		verifyToken( newslettersConfig?.newspack_newsletters_service_provider );
	}, [ newslettersConfig?.newspack_newsletters_service_provider ] );

	const verifyToken = serviceProvider => {
		setAuthUrl( false );
		if ( ! serviceProvider ) {
			return;
		}
		// Constant Contact is the only provider using an OAuth strategy.
		if ( 'constant_contact' !== serviceProvider ) {
			return;
		}
		setInFlight( true );
		apiFetch( { path: `/newspack-newsletters/v1/${ serviceProvider }/verify_token` } )
			.then( response => {
				if ( ! response.valid && response.auth_url ) {
					setAuthUrl( response.auth_url );
				} else {
					setAuthUrl( false );
				}
			} )
			.catch( () => {
				setAuthUrl( false );
			} )
			.finally( () => {
				setInFlight( false );
			} );
	};

	const performConfigUpdate = update => {
		updateConfig( update );
		if ( onUpdate ) {
			onUpdate( mapValues( update.settings, property( 'value' ) ) );
		}
	};
	const fetchConfiguration = () => {
		setError( false );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-newsletters/settings',
		} )
			.then( performConfigUpdate )
			.catch( setError );
	};
	const getSelectedProviderName = () => {
		const configItem = config.settings.newspack_newsletters_service_provider;
		const value = configItem?.value;
		return configItem?.options?.find( option => option.value === value )?.name;
	};
	const hasSelectedProviderKey = () => {
		const selectedProvider = newslettersConfig?.newspack_newsletters_service_provider;
		if ( ! selectedProvider ) {
			return false;
		}
		const regex = new RegExp( `${ selectedProvider }.*key` );
		const configKeys = Object.keys( newslettersConfig ).filter( key => regex.test( key ) );
		return configKeys.some( key => !! newslettersConfig[ key ] );
	};
	const handleAuth = () => {
		if ( authUrl ) {
			const authWindow = window.open( authUrl, 'esp_oauth', 'width=500,height=600' );
			authWindow.opener = {
				verify: once( () => {
					window.location.reload();
				} ),
			};
		}
	};
	const saveNewslettersData = async () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-newsletters/settings',
			method: 'POST',
			data: newslettersConfig,
		} ).finally( () => {
			setProvider( newslettersConfig?.newspack_newsletters_service_provider );
			verifyToken( newslettersConfig?.newspack_newsletters_service_provider );
			setLockedLists( false );
			setInFlight( false );
		} );
	};
	useEffect( fetchConfiguration, [] );
	const getSettingProps = key => ( {
		disabled: inFlight,
		value: config.settings[ key ]?.value || '',
		checked: Boolean( config.settings[ key ]?.value ),
		label: config.settings[ key ]?.description,
		placeholder: config.settings[ key ]?.placeholder,
		options:
			config.settings[ key ]?.options?.map( option => ( {
				value: option.value,
				label: option.name,
			} ) ) || null,
		onChange: value => performConfigUpdate( { settings: { [ key ]: { value } } } ),
	} );

	const renderProviderSettings = () => {
		const providerSelectProps = getSettingProps( 'newspack_newsletters_service_provider' );
		return (
			<ActionCard
				isMedium
				title={ __( 'Email Service Provider', 'newspack-plugin' ) }
				description={ __( 'Connect an email service provider (ESP) to author and send newsletters.', 'newspack-plugin' ) }
				notification={ error ? error?.message || __( 'Something went wrong.', 'newspack-plugin' ) : null }
				notificationLevel="error"
				hasGreyHeader
				actionContent={
					<Button disabled={ inFlight } variant="primary" onClick={ saveNewslettersData }>
						{ __( 'Save Settings', 'newspack-plugin' ) }
					</Button>
				}
				disabled={ inFlight }
			>
				<Grid gutter={ 16 } columns={ 1 }>
					{ false !== authUrl && (
						<Card isSmall>
							<h3>{ __( 'Authorize Application', 'newspack-plugin' ) }</h3>
							<p>
								{ sprintf(
									// translators: %s is the name of the ESP.
									__( 'Authorize %s to connect to Newspack.', 'newspack-plugin' ),
									getSelectedProviderName()
								) }
							</p>
							<Button isSecondary onClick={ handleAuth }>
								{ __( 'Authorize', 'newspack-plugin' ) }
							</Button>
						</Card>
					) }
					{ 'campaign_monitor' === config?.settings?.newspack_newsletters_service_provider?.value && (
						<Notice status="warning" isDismissible={ false }>
							<h2>{ __( 'Campaign Monitor support will be deprecated', 'newspack-plugin' ) }</h2>
							<p>{ __( 'Please connect a different service provider to ensure continued support.', 'newspack-' ) }</p>
						</Notice>
					) }
					{ values( config.settings )
						.filter( setting => ! setting.provider || setting.provider === providerSelectProps.value )
						.map( setting => {
							if ( isOnboarding && ! setting.onboarding ) {
								return null;
							}
							switch ( setting.type ) {
								case 'select':
									return <SelectControl key={ setting.key } { ...getSettingProps( setting.key ) } />;
								case 'checkbox':
									return <CheckboxControl key={ setting.key } { ...getSettingProps( setting.key ) } />;
								default:
									return (
										<Grid columns={ 1 } gutter={ 8 } key={ setting.key }>
											<TextControl { ...getSettingProps( setting.key ) } />
											{ setting.help && setting.helpURL && (
												<p>
													<ExternalLink href={ setting.helpURL }>{ setting.help }</ExternalLink>
												</p>
											) }
										</Grid>
									);
							}
						} ) }
				</Grid>
			</ActionCard>
		);
	};
	if ( ! error && isEmpty( config ) ) {
		return (
			<div className="flex justify-around mt4">
				<Waiting />
			</div>
		);
	}

	return (
		<>
			{ config.configured === false && (
				<PluginInstaller
					plugins={ [ 'newspack-newsletters' ] }
					withoutFooterButton
					onStatus={ ( { complete } ) => complete && fetchConfiguration() }
				/>
			) }
			{ config.configured === true && renderProviderSettings() }
		</>
	);
};

export const SubscriptionLists = ( { lockedLists, onUpdate, provider } ) => {
	const [ error, setError ] = useState( false );
	const [ inFlight, setInFlight ] = useState( false );
	const [ lists, setLists ] = useState( [] );
	const fallbackTimerRef = useRef( null );

	const updateConfig = data => {
		setLists( data );
		if ( typeof onUpdate === 'function' ) {
			onUpdate( data );
		}
	};
	const fetchLists = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack-newsletters/v1/lists',
		} )
			.then( updateConfig )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	const saveLists = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack-newsletters/v1/lists',
			method: 'post',
			data: { lists },
		} )
			.then( updateConfig )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	const handleChange = ( index, name ) => value => {
		const newLists = [ ...lists ];
		newLists[ index ][ name ] = value;
		updateConfig( newLists );
	};

	useEffect( () => {
		setError( false );
		if ( provider && ! lockedLists ) {
			setLists( [] );
			fetchLists();
		}
	}, [ provider, lockedLists ] );

	useEffect( () => {
		const reload = () => fetchLists();
		document.addEventListener( NN_EVENTS.LOCAL_LIST_SAVED, reload );
		document.addEventListener( NN_EVENTS.LOCAL_LIST_DELETED, reload );
		return () => {
			document.removeEventListener( NN_EVENTS.LOCAL_LIST_SAVED, reload );
			document.removeEventListener( NN_EVENTS.LOCAL_LIST_DELETED, reload );
		};
	}, [] );

	const startFallbackTimer = fallbackUrl => {
		if ( bridgeMounted || ! fallbackUrl ) {
			return;
		}
		clearTimeout( fallbackTimerRef.current );
		fallbackTimerRef.current = setTimeout( () => {
			if ( ! bridgeMounted ) {
				window.location.href = fallbackUrl;
			}
		}, NN_FALLBACK_TIMEOUT_MS );
	};

	const dispatchOpenAdd = () => {
		document.dispatchEvent( new CustomEvent( NN_EVENTS.OPEN_MODAL, { detail: { mode: 'add' } } ) );
		startFallbackTimer( newspack_newsletters_wizard.new_subscription_lists_url );
	};
	const dispatchOpenEdit = list => {
		document.dispatchEvent( new CustomEvent( NN_EVENTS.OPEN_MODAL, { detail: { mode: 'edit', list } } ) );
		startFallbackTimer( list?.edit_link );
	};
	const dispatchConfirmDelete = list => {
		document.dispatchEvent( new CustomEvent( NN_EVENTS.OPEN_CONFIRM_DELETE, { detail: { list } } ) );
		startFallbackTimer( list?.edit_link );
	};

	if ( ! inFlight && ! lists?.length && ! error ) {
		return null;
	}
	if ( inFlight && ! lists?.length && ! error ) {
		return (
			<div className="flex justify-around mt4">
				<Waiting />
			</div>
		);
	}

	/* eslint-disable no-nested-ternary */
	const notification = lockedLists
		? __( 'Please save your ESP settings before changing your subscription lists.', 'newspack-plugin' )
		: error
		? error?.message || __( 'Something went wrong.', 'newspack-plugin' )
		: null;

	return (
		<ActionCard
			isMedium
			title={ __( 'Subscription Lists', 'newspack-plugin' ) }
			description={ __( 'Manage the lists available to readers for subscription.', 'newspack-plugin' ) }
			notification={ notification }
			notificationLevel={ error ? 'error' : 'warning' }
			hasGreyHeader
			actionContent={
				<>
					{ newspack_newsletters_wizard.new_subscription_lists_url && (
						<Button variant="secondary" disabled={ inFlight || lockedLists } onClick={ dispatchOpenAdd }>
							{ __( 'Add New', 'newspack-plugin' ) }
						</Button>
					) }
					<Button isPrimary onClick={ saveLists } disabled={ inFlight || lockedLists }>
						{ __( 'Save Subscription Lists', 'newspack-plugin' ) }
					</Button>
				</>
			}
			disabled={ inFlight || lockedLists }
		>
			{ ! lockedLists &&
				! error &&
				lists.map( ( list, index ) => {
					const isLocal = 'local' === list?.type;
					return (
						<ActionCard
							key={ index }
							isSmall
							simple
							hasWhiteHeader
							title={ list.name }
							description={ list?.type_label ? list.type_label : null }
							disabled={ inFlight }
							toggleOnChange={ handleChange( index, 'active' ) }
							toggleChecked={ list.active }
							className={
								list?.id && ( list.id.startsWith( 'group' ) || list.id.startsWith( 'tag' ) )
									? 'newspack-newsletters-sub-list-item'
									: ''
							}
							actionText={
								isLocal ? (
									<HStack spacing={ 2 } justify="flex-end" expanded={ false }>
										<Button variant="link" onClick={ () => dispatchOpenEdit( list ) } disabled={ inFlight }>
											{ __( 'Edit', 'newspack-plugin' ) }
										</Button>
										<Button variant="link" isDestructive onClick={ () => dispatchConfirmDelete( list ) } disabled={ inFlight }>
											{ __( 'Delete', 'newspack-plugin' ) }
										</Button>
									</HStack>
								) : list?.edit_link ? (
									<ExternalLink href={ list.edit_link }>{ __( 'Edit', 'newspack-plugin' ) }</ExternalLink>
								) : null
							}
						>
							{ list.active && ! isLocal && (
								<>
									<TextControl
										label={ __( 'List title', 'newspack-plugin' ) }
										value={ list.title }
										disabled={ inFlight || isLocal }
										onChange={ handleChange( index, 'title' ) }
									/>
									<TextareaControl
										label={ __( 'List description', 'newspack-plugin' ) }
										value={ list.description }
										disabled={ inFlight || isLocal }
										onChange={ handleChange( index, 'description' ) }
									/>
								</>
							) }
						</ActionCard>
					);
				} ) }
		</ActionCard>
	);
};

const NewslettersSettings = () => {
	const [ { newslettersConfig }, updateConfiguration ] = hooks.useObjectState( {} );
	const [ provider, setProvider ] = useState( '' );
	const [ lockedLists, setLockedLists ] = useState( false );
	const [ authUrl, setAuthUrl ] = useState( false );

	return (
		<>
			<h1>{ __( 'Settings', 'newspack-plugin' ) }</h1>
			<Settings
				isOnboarding={ false }
				onUpdate={ config => updateConfiguration( { newslettersConfig: config } ) }
				authUrl={ authUrl }
				newslettersConfig={ newslettersConfig }
				provider={ provider }
				setProvider={ setProvider }
				setAuthUrl={ setAuthUrl }
				setLockedLists={ setLockedLists }
			/>
			<SubscriptionLists lockedLists={ lockedLists } provider={ provider } />
		</>
	);
};

export default withWizardScreen( () => <NewslettersSettings /> );
