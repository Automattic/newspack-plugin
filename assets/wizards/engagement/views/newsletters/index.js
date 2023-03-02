/* global newspack_engagement_wizard */
/**
 * Internal dependencies
 */
import { values, mapValues, property, isEmpty, once } from 'lodash';

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
	Notice,
	PluginInstaller,
	SectionHeader,
	SelectControl,
	TextControl,
	Waiting,
	hooks,
	withWizardScreen,
} from '../../../../components/src';

export const NewspackNewsletters = ( {
	className,
	onUpdate,
	authUrl = false,
	isOnboarding = true,
} ) => {
	const [ error, setError ] = useState();
	const [ config, updateConfig ] = hooks.useObjectState( {} );
	const performConfigUpdate = update => {
		updateConfig( update );
		if ( onUpdate ) {
			onUpdate( mapValues( update.settings, property( 'value' ) ) );
		}
	};
	const fetchConfiguration = () => {
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
	useEffect( fetchConfiguration, [] );
	const getSettingProps = key => ( {
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
					.filter( setting => ! setting.provider || setting.provider === providerSelectProps.value )
					.map( setting => {
						if ( isOnboarding && ! setting.onboarding ) {
							return null;
						}
						switch ( setting.type ) {
							case 'select':
								return <SelectControl key={ setting.key } { ...getSettingProps( setting.key ) } />;
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
		);
	};
	if ( ! error && isEmpty( config ) ) {
		return (
			<div className="flex justify-around mt4">
				<Waiting />
			</div>
		);
	}

	if ( error ) {
		return (
			<Notice noticeText={ error.message || __( 'Something went wrong.', 'newspack' ) } isError />
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

export const SubscriptionLists = ( { onUpdate } ) => {
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
	useEffect( fetchLists, [] );
	if ( ! lists?.length && ! error ) {
		return null;
	}
	return (
		<>
			<Card headerActions noBorder>
				<SectionHeader
					title={ __( 'Subscription Lists', 'newspack' ) }
					description={ __( 'Manage the lists available for subscription.', 'newspack' ) }
				/>
				{ newspack_engagement_wizard.new_subscription_lists_url && (
					<Button
						variant="secondary"
						href={ newspack_engagement_wizard.new_subscription_lists_url }
					>
						{ __( 'Add New', 'newspack' ) }
					</Button>
				) }
			</Card>
			{ error && (
				<Notice
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
					isError
				/>
			) }
			{ lists.map( ( list, index ) => (
				<ActionCard
					key={ list.id }
					title={ list.name }
					description={ list?.type_label ? list.type_label : null }
					disabled={ inFlight }
					toggleOnChange={ handleChange( index, 'active' ) }
					toggleChecked={ list.active }
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
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ saveLists } disabled={ inFlight }>
					{ __( 'Save Subscription Lists', 'newspack' ) }
				</Button>
			</div>
		</>
	);
};

const Newsletters = () => {
	const [ { newslettersConfig }, updateConfiguration ] = hooks.useObjectState( {} );
	const [ initialProvider, setInitialProvider ] = useState( '' );
	const [ lockedLists, setLockedLists ] = useState( false );
	const [ authUrl, setAuthUrl ] = useState( false );

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

	const verifyToken = provider => {
		setAuthUrl( false );
		if ( ! provider ) {
			return;
		}
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
			} );
	};
	useEffect( () => {
		verifyToken( newslettersConfig?.newspack_newsletters_service_provider );
	}, [ newslettersConfig?.newspack_newsletters_service_provider ] );

	const saveNewslettersData = async () =>
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters',
			method: 'POST',
			data: newslettersConfig,
		} ).finally( () => {
			setInitialProvider( newslettersConfig?.newspack_newsletters_service_provider );
			verifyToken( newslettersConfig?.newspack_newsletters_service_provider );
			setLockedLists( false );
		} );

	return (
		<>
			<Card headerActions noBorder>
				<h2>{ __( 'Authoring', 'newspack' ) }</h2>
				<Button variant="primary" onClick={ saveNewslettersData }>
					{ __( 'Save Settings', 'newspack' ) }
				</Button>
			</Card>
			<NewspackNewsletters
				isOnboarding={ false }
				onUpdate={ config => updateConfiguration( { newslettersConfig: config } ) }
				authUrl={ authUrl }
			/>
			{ lockedLists ? (
				<Notice
					noticeText={ __(
						'Please save your settings before changing your subscription lists.',
						'newspack'
					) }
					isWarning
				/>
			) : (
				<SubscriptionLists />
			) }
		</>
	);
};

export default withWizardScreen( () => (
	<>
		<Newsletters />
		<SectionHeader title={ __( 'WooCommerce integration', 'newspack' ) } />
		<PluginInstaller plugins={ [ 'mailchimp-for-woocommerce' ] } withoutFooterButton />
	</>
) );
