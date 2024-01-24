/* global newspack_engagement_wizard */
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
import { useEffect, useState, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { sprintf, __ } from '@wordpress/i18n';
import { CheckboxControl, TextareaControl, ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	Button,
	Card,
	ActionCard,
	Grid,
	PluginInstaller,
	SectionHeader,
	SelectControl,
	TextControl,
	Waiting,
	hooks,
	withWizardScreen,
} from '../../../../components/src';

import './style.scss';

export const NewspackNewsletters = ( {
	className,
	onUpdate,
	initialProvider,
	newslettersConfig,
	isOnboarding = true,
	authUrl = false,
	setInitialProvider = () => {},
	setAuthUrl = () => {},
	setLockedLists = () => {},
} ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( false );
	const [ config, updateConfig ] = hooks.useObjectState( {} );

	useEffect( () => {
		const provider = newslettersConfig?.newspack_newsletters_service_provider;
		if ( initialProvider && provider !== initialProvider ) {
			setLockedLists( true );
		} else {
			setLockedLists( false );
		}
		if ( ! initialProvider && provider ) {
			setInitialProvider( provider );
		}
	}, [ newslettersConfig?.newspack_newsletters_service_provider ] );

	useEffect( () => {
		verifyToken( newslettersConfig?.newspack_newsletters_service_provider );
	}, [ newslettersConfig?.newspack_newsletters_service_provider ] );

	const verifyToken = provider => {
		setAuthUrl( false );
		if ( ! provider ) {
			return;
		}
		// Constant Contact is the only provider using an OAuth strategy.
		if ( 'constant_contact' !== provider ) {
			return;
		}
		setInFlight( true );
		apiFetch( { path: `/newspack-newsletters/v1/${ provider }/verify_token` } )
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
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters',
		} )
			.then( performConfigUpdate )
			.catch( setError );
	};
	const getSelectedProviderName = () => {
		const configItem = config.settings.newspack_newsletters_service_provider;
		const value = configItem?.value;
		return configItem?.options?.find( option => option.value === value )?.name;
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
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters',
			method: 'POST',
			data: newslettersConfig,
		} ).finally( () => {
			setInitialProvider( newslettersConfig?.newspack_newsletters_service_provider );
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
				title={ __( 'Email Service Provider', 'newspack' ) }
				description={ __(
					'Connect an email service provider (ESP) to author and send newsletters.',
					'newspack'
				) }
				notification={ error ? error?.message || __( 'Something went wrong.', 'newspack' ) : null }
				notificationLevel="error"
				hasGreyHeader
				actionContent={
					<Button disabled={ inFlight } variant="primary" onClick={ saveNewslettersData }>
						{ __( 'Save Settings', 'newspack' ) }
					</Button>
				}
				disabled={ inFlight }
			>
				<Grid gutter={ 16 } columns={ 1 }>
					{ false !== authUrl && (
						<Card isSmall>
							<h3>{ __( 'Authorize Application', 'newspack' ) }</h3>
							<p>
								{ sprintf(
									// translators: %s is the name of the ESP.
									__( 'Authorize %s to connect to Newspack.', 'newspack-newsletters' ),
									getSelectedProviderName()
								) }
							</p>
							<Button isSecondary onClick={ handleAuth }>
								{ __( 'Authorize', 'newspack' ) }
							</Button>
						</Card>
					) }
					{ values( config.settings )
						.filter(
							setting => ! setting.provider || setting.provider === providerSelectProps.value
						)
						.map( setting => {
							if ( isOnboarding && ! setting.onboarding ) {
								return null;
							}
							switch ( setting.type ) {
								case 'select':
									return (
										<SelectControl key={ setting.key } { ...getSettingProps( setting.key ) } />
									);
								case 'checkbox':
									return (
										<CheckboxControl key={ setting.key } { ...getSettingProps( setting.key ) } />
									);
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
		<div className={ className }>
			{ config.configured === false && (
				<PluginInstaller
					plugins={ [ 'newspack-newsletters' ] }
					withoutFooterButton
					onStatus={ ( { complete } ) => complete && fetchConfiguration() }
				/>
			) }
			{ config.configured === true && renderProviderSettings() }
		</div>
	);
};

export const SubscriptionLists = ( { lockedLists, onUpdate, initialProvider } ) => {
	const [ error, setError ] = useState( false );
	const [ inFlight, setInFlight ] = useState( false );
	const [ lists, setLists ] = useState( [] );
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
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters/lists',
		} )
			.then( updateConfig )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	const saveLists = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters/lists',
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
	useEffect( fetchLists, [ initialProvider ] );

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

	return (
		<>
			<ActionCard
				isMedium
				title={ __( 'Subscription Lists', 'newspack' ) }
				description={ __( 'Manage the lists available to readers for subscription.', 'newspack' ) }
				notification={
					/* eslint-disable no-nested-ternary */
					error
						? error?.message || __( 'Something went wrong.', 'newspack' )
						: lockedLists
						? __(
								'Please save your ESP settings before changing your subscription lists.',
								'newspack'
						  )
						: null
				}
				notificationLevel={ error ? 'error' : 'warning' }
				hasGreyHeader
				actionContent={
					<>
						{ newspack_engagement_wizard.new_subscription_lists_url && (
							<Button
								variant="secondary"
								disabled={ inFlight || lockedLists }
								href={ newspack_engagement_wizard.new_subscription_lists_url }
							>
								{ __( 'Add New', 'newspack' ) }
							</Button>
						) }
						<Button isPrimary onClick={ saveLists } disabled={ inFlight || lockedLists }>
							{ __( 'Save Subscription Lists', 'newspack' ) }
						</Button>
					</>
				}
				disabled={ inFlight || lockedLists }
			>
				{ ! lockedLists &&
					lists.map( ( list, index ) => (
						<ActionCard
							key={ list.id }
							isSmall
							simple
							hasWhiteHeader
							title={ list.name }
							description={ list?.type_label ? list.type_label : null }
							disabled={ inFlight }
							toggleOnChange={ handleChange( index, 'active' ) }
							toggleChecked={ list.active }
							className={
								list?.id && list.id.startsWith( 'group' )
									? 'newspack-newsletters-group-list-item'
									: ''
							}
							actionText={
								list?.edit_link ? (
									<ExternalLink href={ list.edit_link }>
										{ __( 'Edit', 'newspack_newsletters' ) }
									</ExternalLink>
								) : null
							}
						>
							{ list.active && 'local' !== list?.type && (
								<>
									<TextControl
										label={ __( 'List title', 'newspack' ) }
										value={ list.title }
										disabled={ inFlight || 'local' === list?.type }
										onChange={ handleChange( index, 'title' ) }
									/>
									<TextareaControl
										label={ __( 'List description', 'newspack' ) }
										value={ list.description }
										disabled={ inFlight || 'local' === list?.type }
										onChange={ handleChange( index, 'description' ) }
									/>
								</>
							) }
						</ActionCard>
					) ) }
			</ActionCard>
		</>
	);
};

const Newsletters = () => {
	const [ { newslettersConfig }, updateConfiguration ] = hooks.useObjectState( {} );
	const [ initialProvider, setInitialProvider ] = useState( '' );
	const [ lockedLists, setLockedLists ] = useState( false );
	const [ authUrl, setAuthUrl ] = useState( false );

	return (
		<>
			<NewspackNewsletters
				isOnboarding={ false }
				onUpdate={ config => updateConfiguration( { newslettersConfig: config } ) }
				authUrl={ authUrl }
				setAuthUrl={ setAuthUrl }
				newslettersConfig={ newslettersConfig }
				setLockedLists={ setLockedLists }
				initialProvider={ initialProvider }
				setInitialProvider={ setInitialProvider }
			/>
			<SubscriptionLists lockedLists={ lockedLists } initialProvider={ initialProvider } />
			{ 'mailchimp' === newslettersConfig?.newspack_newsletters_service_provider && (
				<>
					<hr />
					<SectionHeader title={ __( 'WooCommerce integration', 'newspack' ) } />
					<PluginInstaller plugins={ [ 'mailchimp-for-woocommerce' ] } withoutFooterButton />
				</>
			) }
		</>
	);
};

export default withWizardScreen( () => (
	<>
		<Newsletters />
	</>
) );
