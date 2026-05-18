/* global newspack_newsletters_wizard */
/**
 * External dependencies
 */
import values from 'lodash/values';
import mapValues from 'lodash/mapValues';
import property from 'lodash/property';
import isEmpty from 'lodash/isEmpty';
import once from 'lodash/once';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';
import { sprintf, __ } from '@wordpress/i18n';
import {
	ExternalLink,
	Notice as WpNotice,
	ToggleControl,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { atSymbol } from '@wordpress/icons';

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

// Read the bridge-readiness flag synchronously rather than relying on a
// one-shot `BRIDGE_MOUNTED` event. The bridge sets the flag before
// dispatching, so listeners that register late still observe a ready
// bridge — avoiding a spurious fallback redirect.
const isBridgeReady = () => typeof window !== 'undefined' && window.newspackNewslettersBridgeReady === true;

/**
 * Internal dependencies
 */
import {
	Badge,
	Button,
	Card,
	CardSettingsGroup,
	Divider,
	Grid,
	PluginInstaller,
	SectionHeader,
	SelectControl,
	TextControl,
	Waiting,
	hooks,
	integrationIcons,
	useUnsavedChangesDialog,
} from '../../../../../packages/components/src';
import { WIZARD_STORE_NAMESPACE } from '../../../../../packages/components/src/wizard/store';
import Tracking from '../tracking';

import './style.scss';

const LETTERHEAD_KEY = 'newspack_newsletters_letterhead_api_key';

export const Settings = ( {
	onUpdate,
	onLabels,
	onLetterheadSetting,
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
			.then( response => {
				performConfigUpdate( response );
				if ( onLabels && response?.labels ) {
					onLabels( response.labels );
				}
				if ( onLetterheadSetting && response?.settings?.[ LETTERHEAD_KEY ] ) {
					onLetterheadSetting( response.settings[ LETTERHEAD_KEY ] );
				}
			} )
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

	const providerSelectProps = config.settings ? getSettingProps( 'newspack_newsletters_service_provider' ) : null;

	const ESP_PROVIDER_KEY = 'newspack_newsletters_service_provider';

	const isESPSetting = setting => setting.key === ESP_PROVIDER_KEY || !! setting.provider;
	const isPostSetting = setting => ! setting.provider && setting.key !== ESP_PROVIDER_KEY && setting.key !== LETTERHEAD_KEY;

	const renderSettingControl = setting => {
		if ( isOnboarding && ! setting.onboarding ) {
			return null;
		}
		switch ( setting.type ) {
			case 'select':
				return <SelectControl key={ setting.key } { ...getSettingProps( setting.key ) } />;
			case 'checkbox': {
				const props = getSettingProps( setting.key );
				return (
					<ToggleControl
						key={ setting.key }
						label={ props.label }
						checked={ props.checked }
						onChange={ props.onChange }
						disabled={ props.disabled }
						__nextHasNoMarginBottom
					/>
				);
			}
			default:
				return (
					<VStack key={ setting.key } spacing={ 2 }>
						<TextControl { ...getSettingProps( setting.key ) } withMargin={ false } />
						{ setting.help && setting.helpURL && (
							<p style={ { margin: 0 } }>
								<ExternalLink href={ setting.helpURL }>{ setting.help }</ExternalLink>
							</p>
						) }
					</VStack>
				);
		}
	};

	const espSettings = values( config.settings ).filter(
		setting => isESPSetting( setting ) && ( ! setting.provider || setting.provider === providerSelectProps?.value )
	);
	const postSettings = values( config.settings ).filter( isPostSetting );

	const PROVIDER_ORDER = [ 'active_campaign', 'mailchimp', 'constant_contact', 'manual' ];
	const PROVIDER_ICONS = {
		active_campaign: integrationIcons.activeCampaign,
		mailchimp: integrationIcons.mailchimp,
		constant_contact: integrationIcons.constantContact,
		manual: atSymbol,
	};
	const PROVIDER_ICON_SIZES = {
		active_campaign: 16,
		constant_contact: 18,
	};
	const providerOptions = ( config.settings?.newspack_newsletters_service_provider?.options || [] )
		.filter( opt => opt.value !== '' )
		.sort( ( a, b ) => {
			const aIdx = PROVIDER_ORDER.indexOf( a.value );
			const bIdx = PROVIDER_ORDER.indexOf( b.value );
			if ( aIdx === -1 && bIdx === -1 ) {
				return 0;
			}
			if ( aIdx === -1 ) {
				return 1;
			}
			if ( bIdx === -1 ) {
				return -1;
			}
			return aIdx - bIdx;
		} );
	const selectedProviderValue = providerSelectProps?.value;

	const renderAuthorizeBlock = () =>
		false !== authUrl && (
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
		);

	const renderProviderControls = () => (
		<VStack spacing={ 6 } className="newspack-newsletters-settings-stack">
			{ error && (
				<WpNotice status="error" isDismissible={ false }>
					{ error?.message || __( 'Something went wrong.', 'newspack-plugin' ) }
				</WpNotice>
			) }
			{ 'campaign_monitor' === selectedProviderValue && (
				<WpNotice status="warning" isDismissible={ false }>
					<h2>{ __( 'Campaign Monitor support will be deprecated', 'newspack-plugin' ) }</h2>
					<p>{ __( 'Please connect a different service provider to ensure continued support.', 'newspack-plugin' ) }</p>
				</WpNotice>
			) }
			{ isOnboarding ? (
				values( config.settings )
					.filter( setting => ! setting.provider || setting.provider === selectedProviderValue )
					.map( renderSettingControl )
			) : (
				<>
					<Grid columns={ 2 } gutter={ 16 } noMargin>
						{ providerOptions.map( option => (
							<CardSettingsGroup
								key={ option.value }
								className={ `newspack-newsletters-esp-card newspack-newsletters-esp-card--${ option.value.replace( /_/g, '-' ) }` }
								icon={ PROVIDER_ICONS[ option.value ] }
								iconSize={ PROVIDER_ICON_SIZES[ option.value ] || 24 }
								title={ option.name }
								isActive={ option.value === selectedProviderValue }
								onEnable={ () => providerSelectProps.onChange( option.value ) }
								onHeaderClick={ () => providerSelectProps.onChange( option.value ) }
							/>
						) ) }
					</Grid>
					{ selectedProviderValue && (
						<VStack spacing={ 4 } className="newspack-newsletters-settings-stack">
							{ selectedProviderValue === 'constant_contact' && renderAuthorizeBlock() }
							{ espSettings.filter( s => s.provider === selectedProviderValue ).map( renderSettingControl ) }
						</VStack>
					) }
				</>
			) }
			{ isOnboarding && (
				<HStack justify="flex-start" expanded={ false }>
					<Button disabled={ inFlight } variant="primary" onClick={ saveNewslettersData }>
						{ __( 'Save', 'newspack-plugin' ) }
					</Button>
				</HStack>
			) }
		</VStack>
	);

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
			{ config.configured === true &&
				( isOnboarding ? (
					renderProviderControls()
				) : (
					<>
						<Grid columns={ 2 } gutter={ 32 } noMargin>
							<SectionHeader
								heading={ 2 }
								title={ __( 'Email service provider', 'newspack-plugin' ) }
								description={ __( 'Connect an email service provider (ESP) to author and send newsletters.', 'newspack-plugin' ) }
								noMargin
							/>
							{ renderProviderControls() }
						</Grid>
						{ postSettings.length > 0 && (
							<>
								<Divider alignment="full-width" variant="tertiary" />
								<Grid columns={ 2 } gutter={ 32 } noMargin>
									<SectionHeader
										heading={ 2 }
										title={ __( 'Newsletter posts', 'newspack-plugin' ) }
										description={ __(
											'Settings for how published newsletters appear as posts on your site.',
											'newspack-plugin'
										) }
										noMargin
									/>
									<VStack spacing={ 4 } className="newspack-newsletters-settings-stack">
										{ postSettings.map( renderSettingControl ) }
									</VStack>
								</Grid>
							</>
						) }
					</>
				) ) }
		</>
	);
};

export const SubscriptionLists = ( { lockedLists, onUpdate, provider, labels = {} } ) => {
	const [ error, setError ] = useState( false );
	const [ inFlight, setInFlight ] = useState( false );
	const [ togglingIds, setTogglingIds ] = useState( () => new Set() );
	const [ lists, setLists ] = useState( [] );
	const fallbackTimerRef = useRef( null );

	const updateLists = updater => {
		setLists( prev => {
			const nextLists = typeof updater === 'function' ? updater( prev ) : updater;
			if ( typeof onUpdate === 'function' ) {
				onUpdate( nextLists );
			}
			return nextLists;
		} );
	};
	const fetchLists = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack-newsletters/v1/lists',
		} )
			.then( updateLists )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	const handleToggleActive = async ( list, next ) => {
		if ( ! list?.db_id ) {
			return;
		}
		const dbId = list.db_id;
		const previousActive = list.active;
		updateLists( prev => prev.map( row => ( row.db_id === dbId ? { ...row, active: next } : row ) ) );
		setTogglingIds( prev => {
			const updated = new Set( prev );
			updated.add( dbId );
			return updated;
		} );
		setError( false );
		try {
			const response = await apiFetch( {
				path: `/newspack-newsletters/v1/lists/${ dbId }`,
				method: 'PATCH',
				data: { active: next },
			} );
			updateLists( prev => prev.map( row => ( row.db_id === dbId ? { ...row, ...response } : row ) ) );
		} catch ( err ) {
			updateLists( prev => prev.map( row => ( row.db_id === dbId ? { ...row, active: previousActive } : row ) ) );
			setError( err );
		} finally {
			setTogglingIds( prev => {
				const updated = new Set( prev );
				updated.delete( dbId );
				return updated;
			} );
		}
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
		if ( isBridgeReady() || ! fallbackUrl ) {
			return;
		}
		clearTimeout( fallbackTimerRef.current );
		fallbackTimerRef.current = setTimeout( () => {
			if ( ! isBridgeReady() ) {
				window.location.href = fallbackUrl;
			}
		}, NN_FALLBACK_TIMEOUT_MS );
	};

	const dispatchOpenAdd = () => {
		document.dispatchEvent( new CustomEvent( NN_EVENTS.OPEN_MODAL, { detail: { mode: 'add' } } ) );
		startFallbackTimer( newspack_newsletters_wizard.new_subscription_lists_url );
	};
	const dispatchOpenEdit = ( list, kind ) => {
		document.dispatchEvent( new CustomEvent( NN_EVENTS.OPEN_MODAL, { detail: { mode: 'edit', kind, list } } ) );
		startFallbackTimer( list?.edit_link );
	};
	const dispatchConfirmDelete = list => {
		document.dispatchEvent( new CustomEvent( NN_EVENTS.OPEN_CONFIRM_DELETE, { detail: { list } } ) );
		startFallbackTimer( list?.edit_link );
	};

	if ( ! inFlight && ! lists?.length && ! error && ! lockedLists ) {
		return null;
	}

	const showAddNew = !! newspack_newsletters_wizard.new_subscription_lists_url;

	return (
		<>
			<Divider alignment="full-width" variant="tertiary" />
			<Grid columns={ 2 } gutter={ 32 } noMargin>
				<SectionHeader
					heading={ 2 }
					title={ __( 'Subscription lists', 'newspack-plugin' ) }
					description={ __( 'Manage the lists available to readers for subscription.', 'newspack-plugin' ) }
					noMargin
				/>
				<VStack spacing={ 4 } className="newspack-newsletters-settings-stack">
					{ lockedLists && (
						<WpNotice status="warning" isDismissible={ false }>
							{ __( 'Please save your ESP settings before changing your subscription lists.', 'newspack-plugin' ) }
						</WpNotice>
					) }
					{ ! lockedLists && error && (
						<WpNotice status="error" isDismissible={ false }>
							{ error?.message || __( 'Something went wrong.', 'newspack-plugin' ) }
						</WpNotice>
					) }
					{ inFlight && ! lists?.length && ! error && (
						<div className="flex justify-around mt4">
							<Waiting />
						</div>
					) }
					{ ! lockedLists &&
						! error &&
						lists.map( ( list, index ) => {
							const isLocal = 'local' === list?.type;
							const rowDisabled = inFlight || togglingIds.has( list?.db_id );
							const isSubList = list?.id && ( list.id.startsWith( 'group' ) || list.id.startsWith( 'tag' ) );
							return (
								<Fragment key={ list.db_id || index }>
									{ index > 0 && <Divider alignment="none" variant="default" marginTop={ 0 } marginBottom={ 0 } /> }
									<HStack
										alignment="top"
										justify="space-between"
										className={ isSubList ? 'newspack-newsletters-sub-list-item' : undefined }
									>
										<VStack spacing={ 2 } className="newspack-newsletters-list-item__content">
											<ToggleControl
												label={ list.name }
												help={ list.description || undefined }
												checked={ !! list.active }
												onChange={ next => handleToggleActive( list, next ) }
												disabled={ rowDisabled }
												__nextHasNoMarginBottom
											/>
											{ ( isLocal || list?.type_label ) && (
												<HStack expanded={ false } justify="flex-start" className="newspack-newsletters-list-item__badge">
													<Badge text={ isLocal ? __( 'Local', 'newspack-plugin' ) : list.type_label } />
												</HStack>
											) }
										</VStack>
										<HStack expanded={ false } spacing={ 2 } justify="flex-end">
											<Button
												variant="link"
												onClick={ () => dispatchOpenEdit( list, isLocal ? 'local' : 'esp' ) }
												disabled={ rowDisabled }
												aria-label={ sprintf(
													// translators: %s is the list name.
													__( 'Edit %s', 'newspack-plugin' ),
													list.name
												) }
											>
												{ __( 'Edit', 'newspack-plugin' ) }
											</Button>
											{ isLocal && (
												<Button
													variant="link"
													isDestructive
													onClick={ () => dispatchConfirmDelete( list ) }
													disabled={ rowDisabled }
													aria-label={ sprintf(
														// translators: %s is the list name.
														__( 'Delete %s', 'newspack-plugin' ),
														list.name
													) }
												>
													{ __( 'Delete', 'newspack-plugin' ) }
												</Button>
											) }
										</HStack>
									</HStack>
								</Fragment>
							);
						} ) }
					{ ! lockedLists && ! error && showAddNew && (
						<>
							<Divider alignment="none" variant="default" marginTop={ 0 } marginBottom={ 0 } />
							<VStack spacing={ 3 }>
								<p style={ { margin: 0 } }>
									{ labels?.local_list_explanation
										? sprintf(
												// translators: %s is the provider-specific local list label, e.g. "Mailchimp Group" or "Active Campaign Tag".
												__( 'Local lists are managed in WordPress and synced to your ESP as: %s.', 'newspack-plugin' ),
												labels.local_list_explanation
										  )
										: __( 'Local lists are managed in WordPress and synced to an entity in your ESP.', 'newspack-plugin' ) }
								</p>
								<HStack expanded={ false } justify="flex-start">
									<Button variant="secondary" onClick={ dispatchOpenAdd }>
										{ __( 'Add new local list', 'newspack-plugin' ) }
									</Button>
								</HStack>
							</VStack>
						</>
					) }
				</VStack>
			</Grid>
		</>
	);
};

const NewslettersSettings = () => {
	const [ { newslettersConfig }, updateConfiguration ] = hooks.useObjectState( {} );
	const [ provider, setProvider ] = useState( '' );
	const [ lockedLists, setLockedLists ] = useState( false );
	const [ authUrl, setAuthUrl ] = useState( false );
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ savedConfig, setSavedConfig ] = useState( null );
	const [ labels, setLabels ] = useState( {} );
	const [ letterheadSetting, setLetterheadSetting ] = useState( null );
	const { setHeaderData } = useDispatch( WIZARD_STORE_NAMESPACE );

	useEffect( () => {
		if ( savedConfig === null && newslettersConfig && Object.keys( newslettersConfig ).length > 0 ) {
			setSavedConfig( newslettersConfig );
		}
	}, [ newslettersConfig, savedConfig ] );

	const isDirty = savedConfig !== null && JSON.stringify( newslettersConfig ) !== JSON.stringify( savedConfig );

	const saveSettings = async () => {
		setError( false );
		setInFlight( true );
		try {
			const response = await apiFetch( {
				path: '/newspack/v1/wizard/newspack-newsletters/settings',
				method: 'POST',
				data: newslettersConfig,
			} );
			setProvider( newslettersConfig?.newspack_newsletters_service_provider );
			setLockedLists( false );
			setSavedConfig( newslettersConfig );
			if ( response?.labels ) {
				setLabels( response.labels );
			}
		} catch ( err ) {
			setError( err );
		} finally {
			setInFlight( false );
		}
	};

	useEffect( () => {
		setHeaderData( {
			sectionName: __( 'Settings', 'newspack-plugin' ),
			sectionTitle: __( 'Settings', 'newspack-plugin' ),
			actions: [
				{
					type: 'primary',
					label: __( 'Save', 'newspack-plugin' ),
					action: saveSettings,
					disabled: inFlight || ! isDirty,
				},
			],
		} );
	}, [ inFlight, isDirty, newslettersConfig ] );

	const { confirmDialog: navBlockDialog } = useUnsavedChangesDialog( {
		when: isDirty && ! inFlight,
	} );

	return (
		<>
			{ navBlockDialog }
			{ error && (
				<WpNotice status="error" isDismissible={ false }>
					{ error?.message || __( 'Something went wrong.', 'newspack-plugin' ) }
				</WpNotice>
			) }
			<Settings
				isOnboarding={ false }
				onUpdate={ config => updateConfiguration( { newslettersConfig: config } ) }
				onLabels={ setLabels }
				onLetterheadSetting={ setLetterheadSetting }
				authUrl={ authUrl }
				newslettersConfig={ newslettersConfig }
				provider={ provider }
				setProvider={ setProvider }
				setAuthUrl={ setAuthUrl }
				setLockedLists={ setLockedLists }
			/>
			<SubscriptionLists lockedLists={ lockedLists } provider={ provider } labels={ labels } />
			<Tracking />
			{ letterheadSetting && (
				<>
					<Divider alignment="full-width" variant="tertiary" />
					<Grid columns={ 2 } gutter={ 32 } noMargin>
						<SectionHeader
							heading={ 2 }
							title={ __( 'Letterhead', 'newspack-plugin' ) }
							description={ __( 'Connect Letterhead to insert promotions into your newsletters.', 'newspack-plugin' ) }
							noMargin
						/>
						<VStack spacing={ 4 } className="newspack-newsletters-settings-stack">
							<VStack spacing={ 2 }>
								<TextControl
									label={ letterheadSetting.description }
									value={ newslettersConfig?.[ letterheadSetting.key ] || '' }
									onChange={ value => updateConfiguration( { newslettersConfig: { [ letterheadSetting.key ]: value } } ) }
									withMargin={ false }
								/>
								{ letterheadSetting.help && letterheadSetting.helpURL && (
									<p style={ { margin: 0 } }>
										<ExternalLink href={ letterheadSetting.helpURL }>{ letterheadSetting.help }</ExternalLink>
									</p>
								) }
							</VStack>
						</VStack>
					</Grid>
				</>
			) }
		</>
	);
};

export default NewslettersSettings;
