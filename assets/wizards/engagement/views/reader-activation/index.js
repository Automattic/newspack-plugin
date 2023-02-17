/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	Button,
	Card,
	Grid,
	Notice,
	PluginInstaller,
	SectionHeader,
	TextControl,
	withWizardScreen,
	ActionCard,
} from '../../../../components/src';
import ActiveCampaign from './active-campaign';

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ config, setConfig ] = useState( {} );
	const [ error, setError ] = useState( false );
	const [ isActiveCampaign, setIsActiveCampaign ] = useState( false );
	const [ hasPlugins, setHasPlugins ] = useState( null );
	const updateConfig = ( key, val ) => {
		setConfig( { ...config, [ key ]: val } );
	};
	const fetchConfig = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
		} )
			.then( ( { config: fetchedConfig, pluginsStatus } ) => {
				setHasPlugins( pluginsStatus );
				setConfig( fetchedConfig );
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	const saveConfig = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
			method: 'post',
			data: config,
		} )
			.then( setConfig )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	useEffect( fetchConfig, [] );
	useEffect( () => {
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters',
		} ).then( data => {
			setIsActiveCampaign(
				data?.settings?.newspack_newsletters_service_provider?.value === 'active_campaign'
			);
		} );
	}, [] );

	const getSharedProps = ( configKey, type = 'checkbox' ) => {
		const props = {
			onChange: val => updateConfig( configKey, val ),
		};
		if ( configKey !== 'enabled' ) {
			props.disabled = inFlight || ! config.enabled;
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

	const emails = Object.values( config.emails || {} );

	if ( false === hasPlugins ) {
		return (
			<>
				<Notice isError>
					{ __(
						'Please activate WooCommerce and WooCommerce Subscriptions plugins to use Reader Activation features.',
						'newspack'
					) }
				</Notice>
				<PluginInstaller
					isWaiting={ inFlight }
					plugins={ [ 'woocommerce', 'woocommerce-subscriptions', 'woocommerce-name-your-price' ] }
					onStatus={ ( { complete } ) => complete && fetchConfig() }
					withoutFooterButton={ true }
				/>
			</>
		);
	}

	return (
		<>
			{ error && (
				<Notice
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
					isError
				/>
			) }
			<Card noBorder>
				<SectionHeader
					title={ __( 'Reader Activation', 'newspack' ) }
					description={ __( 'Configure a set of features for reader activation.', 'newspack' ) }
				/>
				<CheckboxControl
					label={ __( 'Enable Reader Activation', 'newspack' ) }
					help={ __( 'Whether to enable reader activation features for your site.', 'newspack' ) }
					{ ...getSharedProps( 'enabled' ) }
				/>
				<hr />
				<CheckboxControl
					label={ __( 'Enable Sign In/Account link', 'newspack' ) }
					help={ __(
						'Display an account link in the site header. It will allow readers to register and access their account.',
						'newspack'
					) }
					{ ...getSharedProps( 'enabled_account_link' ) }
				/>
				<Grid columns={ 2 } gutter={ 16 }>
					<TextControl
						label={ __( 'Terms & Conditions Text', 'newspack' ) }
						help={ __( 'Terms and conditions text to display on registration.', 'newspack' ) }
						{ ...getSharedProps( 'terms_text', 'text' ) }
					/>
					<TextControl
						label={ __( 'Terms & Conditions URL', 'newspack' ) }
						help={ __( 'URL to the page containing the terms and conditions.', 'newspack' ) }
						{ ...getSharedProps( 'terms_url', 'text' ) }
					/>
				</Grid>
				<hr />
				{ emails?.length > 0 && (
					<>
						<SectionHeader
							title={ __( 'Emails', 'newspack' ) }
							description={ __( 'Customize emails sent to readers.', 'newspack' ) }
						/>
						<TextControl
							label={ __( 'Sender name', 'newspack' ) }
							{ ...getSharedProps( 'sender_name', 'text' ) }
						/>
						<Grid columns={ 2 } gutter={ 16 }>
							<TextControl
								label={ __( 'Sender email address', 'newspack' ) }
								{ ...getSharedProps( 'sender_email_address', 'text' ) }
							/>
							<TextControl
								label={ __( 'Contact email address', 'newspack' ) }
								help={ __(
									'This email will be used as "Reply-To" for transactional emails as well.',
									'newspack'
								) }
								{ ...getSharedProps( 'contact_email_address', 'text' ) }
							/>
						</Grid>
						{ emails.map( email => (
							<ActionCard
								key={ email.post_id }
								title={ email.label }
								titleLink={ email.edit_link }
								href={ email.edit_link }
								description={ email.description }
								actionText={ __( 'Edit', 'newspack' ) }
							/>
						) ) }
						<hr />
					</>
				) }

				<SectionHeader
					title={ __( 'Email Service Provider Settings', 'newspack' ) }
					description={ __( 'Settings for Newspack Newsletters integration.', 'newspack' ) }
				/>
				<TextControl
					label={ __( 'Newsletter subscription text on registration', 'newspack' ) }
					help={ __(
						'The text to display while subscribing to newsletters on the registration modal.',
						'newspack'
					) }
					{ ...getSharedProps( 'newsletters_label', 'text' ) }
				/>
				<CheckboxControl
					label={ __( 'Synchronize reader to ESP', 'newspack' ) }
					help={ __(
						'Whether to synchronize reader data to the ESP. A contact will be created on reader registration if the ESP supports contacts without a list subscription.',
						'newspack'
					) }
					{ ...getSharedProps( 'sync_esp' ) }
				/>
				{ config.sync_esp && (
					<>
						<CheckboxControl
							label={ __( 'Delete contact on reader deletion', 'newspack' ) }
							help={ __(
								"If the reader's email is verified, delete contact from ESP on reader deletion. ESP synchronization must be enabled.",
								'newspack'
							) }
							{ ...getSharedProps( 'sync_esp_delete' ) }
						/>
						<TextControl
							label={ __( 'Metadata field prefix', 'newspack' ) }
							help={ __(
								'A string to prefix metadata fields attached to each contact synced to the ESP. Required to ensure that metadata field names are unique. Default: NP_',
								'newspack'
							) }
							{ ...getSharedProps( 'metadata_prefix', 'text' ) }
						/>
						{ isActiveCampaign && (
							<ActiveCampaign
								value={ { masterList: config.active_campaign_master_list } }
								onChange={ ( key, value ) => {
									if ( key === 'masterList' ) {
										updateConfig( 'active_campaign_master_list', value );
									}
								} }
							/>
						) }
					</>
				) }
			</Card>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ saveConfig } disabled={ inFlight }>
					{ __( 'Save Changes', 'newspack' ) }
				</Button>
			</div>
		</>
	);
} );
