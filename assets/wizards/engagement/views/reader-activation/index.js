/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	ActionCard,
	Button,
	Card,
	Grid,
	Notice,
	SectionHeader,
	TextControl,
	Waiting,
	withWizardScreen,
} from '../../../../components/src';
import ActiveCampaign from './active-campaign';

export default withWizardScreen( () => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ config, setConfig ] = useState( {} );
	const [ error, setError ] = useState( false );
	const [ allReady, setAllReady ] = useState( false );
	const [ isActiveCampaign, setIsActiveCampaign ] = useState( false );
	const [ prerequisites, setPrerequisites ] = useState( null );
	const [ showAdvanced, setShowAdvanced ] = useState( false );
	const updateConfig = ( key, val ) => {
		setConfig( { ...config, [ key ]: val } );
	};
	const fetchConfig = () => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
		} )
			.then( ( { config: fetchedConfig, prerequisites_status } ) => {
				setPrerequisites( prerequisites_status );
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
	useEffect( () => {
		const _allReady =
			prerequisites &&
			Object.keys( prerequisites ).reduce( ( acc, key ) => {
				if ( ! prerequisites[ key ]?.active ) {
					return false;
				}

				return acc;
			}, true );

		setAllReady( _allReady );
	}, [ prerequisites ] );

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

	return (
		<>
			<SectionHeader
				title={ __( 'Reader Activation', 'newspack' ) }
				description={ () => (
					<>
						{ __(
							'Newspack’s Reader Activation system is a set of features that aim to increase reader loyalty, promote engagement, and drive revenue. ',
							'newspack'
						) }
						<ExternalLink href={ 'https://help.newspack.com' }>
							{ __( 'Learn more', 'newspack-plugin' ) }
						</ExternalLink>
					</>
				) }
			/>
			{ error && (
				<Notice
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack' ) }
					isError
				/>
			) }
			{ prerequisites && ! allReady && (
				<Notice
					noticeText={ __( 'Complete the settings to enable Reader Activation.', 'newspack' ) }
					isWarning
				/>
			) }
			{ ! prerequisites && (
				<>
					<Waiting isLeft />
					{ __( 'Retrieving status…', 'newspack' ) }
				</>
			) }
			{ prerequisites &&
				Object.keys( prerequisites ).map( key => (
					<ActionCard
						key={ key }
						isMedium
						title={ prerequisites[ key ].label }
						description={
							prerequisites[ key ].active
								? __( 'Status: Ready', 'newspack' )
								: prerequisites[ key ].description
						}
						checkbox={ prerequisites[ key ].active ? 'checked' : 'unchecked' }
						actionText={
							prerequisites[ key ].href ? (
								<Button isLink disabled={ inFlight } href={ prerequisites[ key ].href }>
									{ prerequisites[ key ].active
										? __( 'View setup', 'newspack' )
										: __( 'Set up', 'newspack' ) }
								</Button>
							) : null
						}
					/>
				) ) }

			{ /** TODO: Link this to the new setup wizard. */ }
			{ prerequisites && (
				<ActionCard
					isMedium
					title={ __( 'Reader Activation Campaign', 'newspack' ) }
					description={ __(
						'Building a set of prompts with default segments and settings allows for an improved experience optimized for Reader Activation.',
						'newspack'
					) }
					checkbox="unchecked"
					actionText={ __( 'Waiting for all settings to be ready', 'newspack' ) }
				/>
			) }
			<hr />
			<Button variant="link" onClick={ () => setShowAdvanced( ! showAdvanced ) }>
				{ sprintf(
					// Translators: Show or Hide advanced settings.
					__( '%s Advanced Settings', 'newspack' ),
					showAdvanced ? __( 'Hide', 'newspack' ) : __( 'Show', 'newspack' )
				) }
			</Button>
			{ showAdvanced && (
				<Card noBorder>
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
								title={ __( 'Transactional Emails', 'newspack' ) }
								description={ __( 'Customize the content of transactional emails.', 'newspack' ) }
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
					{ /** TODO: Deprecate this option. This field should be populated by user input in the prompt setup wizard. */ }
					<TextControl
						label={ __( 'Newsletter subscription text on registration', 'newspack' ) }
						help={ __(
							'The text to display while subscribing to newsletters on the registration modal.',
							'newspack'
						) }
						{ ...getSharedProps( 'newsletters_label', 'text' ) }
					/>
					{ config.sync_esp && (
						<>
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
					<div className="newspack-buttons-card">
						<Button isPrimary onClick={ saveConfig } disabled={ inFlight }>
							{ __( 'Save Changes', 'newspack' ) }
						</Button>
					</div>
				</Card>
			) }
		</>
	);
} );
