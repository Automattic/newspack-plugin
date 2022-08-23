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
	SectionHeader,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';
import ActiveCampaign from './active-campaign';

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ config, setConfig ] = useState( {} );
	const [ error, setError ] = useState( false );
	const [ isActiveCampaign, setIsActiveCampaign ] = useState( false );
	const updateConfig = ( key, val ) => {
		setConfig( { ...config, [ key ]: val } );
	};
	const fetchConfig = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
		} )
			.then( setConfig )
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
					checked={ !! config.enabled }
					onChange={ value => updateConfig( 'enabled', value ) }
				/>
				<hr />
				<CheckboxControl
					label={ __( 'Enable Sign In/Account link', 'newspack' ) }
					help={ __(
						'Display an account link in the site header. It will allow readers to register and access their account.',
						'newspack'
					) }
					checked={ !! config.enabled_account_link }
					onChange={ value => updateConfig( 'enabled_account_link', value ) }
				/>
				<Grid columns={ 2 } gutter={ 16 }>
					<TextControl
						label={ __( 'Terms & Conditions Text', 'newspack' ) }
						help={ __( 'Terms and conditions text to display on registration.', 'newspack' ) }
						value={ config.terms_text }
						onChange={ value => updateConfig( 'terms_text', value ) }
					/>
					<TextControl
						label={ __( 'Terms & Conditions URL', 'newspack' ) }
						help={ __( 'URL to the page containing the terms and conditions.', 'newspack' ) }
						value={ config.terms_url }
						onChange={ value => updateConfig( 'terms_url', value ) }
					/>
				</Grid>
				<hr />
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
					value={ config.newsletters_label }
					onChange={ value => updateConfig( 'newsletters_label', value ) }
				/>
				<CheckboxControl
					label={ __( 'Synchronize reader to ESP', 'newspack' ) }
					help={ __(
						'Whether to synchronize reader data to the ESP. A contact will be created on reader registration if the ESP supports contacts without a list subscription.',
						'newspack'
					) }
					checked={ !! config.sync_esp }
					onChange={ value => updateConfig( 'sync_esp', value ) }
				/>
				{ config.sync_esp && (
					<>
						<CheckboxControl
							label={ __( 'Delete contact on reader deletion', 'newspack' ) }
							help={ __(
								"If the reader's email is verified, delete contact from ESP on reader deletion. ESP synchronization must be enabled.",
								'newspack'
							) }
							checked={ !! config.sync_esp_delete }
							onChange={ value => updateConfig( 'sync_esp_delete', value ) }
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
