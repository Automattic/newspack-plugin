/* global newspack_engagement_wizard */
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
	const [ membershipsConfig, setMembershipsConfig ] = useState( {} );
	const [ error, setError ] = useState( false );
	const [ allReady, setAllReady ] = useState( false );
	const [ isActiveCampaign, setIsActiveCampaign ] = useState( false );
	const [ prerequisites, setPrerequisites ] = useState( null );
	const [ showAdvanced, setShowAdvanced ] = useState( false );
	const updateConfig = ( key, val ) => {
		setConfig( { ...config, [ key ]: val } );
	};
	const fetchConfig = ( updateInFlight = true ) => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
		} )
			.then( ( { config: fetchedConfig, prerequisites_status, memberships } ) => {
				setPrerequisites( prerequisites_status );
				setConfig( fetchedConfig );
				setMembershipsConfig( memberships );
			} )
			.catch( setError )
			.finally( () => updateInFlight && setInFlight( false ) );
	};
	const saveConfig = data => {
		setError( false );
		setInFlight( true );
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
			method: 'post',
			data,
		} )
			.then( ( { config: fetchedConfig, prerequisites_status, memberships } ) => {
				setPrerequisites( prerequisites_status );
				setConfig( fetchedConfig );
				setMembershipsConfig( memberships );
			} )
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

	const getContentGateDescription = () => {
		let message = __(
			'Configure the gate rendered on content with restricted access.',
			'newspack'
		);
		if ( 'publish' === membershipsConfig?.gate_status ) {
			message += ' ' + __( 'The gate is currently published.', 'newspack' );
		} else if (
			'draft' === membershipsConfig?.gate_status ||
			'trash' === membershipsConfig?.gate_status
		) {
			message += ' ' + __( 'The gate is currently a draft.', 'newspack' );
		}
		return message;
	};

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
						{ /** TODO: Update this URL with the real one once the docs are ready. */ }
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
						expandable // TODO: If the status goes from Pending to Ready, close the card.
						collapse={ prerequisites[ key ].active }
						title={ prerequisites[ key ].label }
						description={ sprintf(
							/* translators: %s: Prerequisite status */
							__( 'Status: %s', 'newspack' ),
							prerequisites[ key ].active ? __( 'Ready', 'newspack' ) : __( 'Pending', 'newspack' )
						) }
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
					>
						{
							// Inner card content.
							<>
								{ prerequisites[ key ].description && (
									<p>
										{ prerequisites[ key ].description }
										{ prerequisites[ key ].help_url && (
											<>
												{ ' ' }
												<ExternalLink href={ prerequisites[ key ].help_url }>
													{ __( 'Learn more', 'newspack-plugin' ) }
												</ExternalLink>
											</>
										) }
									</p>
								) }
								{
									// Form fields.
									// TODO: Refactor so that the save button saves only these fields.
									prerequisites[ key ].fields && (
										<Grid columns={ 2 } gutter={ 16 }>
											<div>
												{ Object.keys( prerequisites[ key ].fields ).map( fieldName => (
													<TextControl
														key={ fieldName }
														label={ prerequisites[ key ].fields[ fieldName ].label }
														help={ prerequisites[ key ].fields[ fieldName ].description }
														{ ...getSharedProps( fieldName, 'text' ) }
													/>
												) ) }

												<Button
													isPrimary
													onClick={ () => {
														const dataToSave = {};

														Object.keys( prerequisites[ key ].fields ).forEach( fieldName => {
															dataToSave[ fieldName ] = config[ fieldName ];
														} );

														saveConfig( dataToSave );
													} }
													disabled={ inFlight }
												>
													{ inFlight
														? __( 'Saving…', 'newspack' )
														: sprintf(
																// Translators: Save or Update settings.
																__( '%s settings', 'newspack' ),
																prerequisites[ key ].active
																	? __( 'Update', 'newspack' )
																	: __( 'Save', 'newspack' )
														  ) }
												</Button>
											</div>
										</Grid>
									)
								}
								{
									// Link to another settings page.
									prerequisites[ key ].href && prerequisites[ key ].action_text && (
										<Grid columns={ 2 } gutter={ 16 }>
											<div>
												<Button isPrimary href={ prerequisites[ key ].href }>
													{ ( prerequisites[ key ].active
														? __( 'Update ', 'newspack' )
														: __( 'Save ', 'newspack' ) ) + prerequisites[ key ].action_text }
												</Button>
											</div>
										</Grid>
									)
								}
							</>
						}
					</ActionCard>
				) ) }

			{ /** TODO: Link this to the new setup wizard. */ }
			{ prerequisites && (
				<ActionCard
					isMedium
					expandable
					title={ __( 'Reader Activation Campaign', 'newspack' ) }
					description={ __( 'Status: Pending', 'newspack' ) } // TODO: Update this once the campaign UI is ready.
					checkbox="unchecked"
				>
					<>
						<p>
							<>
								{ __(
									'Building a set of prompts with default segments and settings allows for an improved experience optimized for Reader Activation. ',
									'newspack'
								) }

								{ /** TODO: Update this URL with the real one once the docs are ready. */ }
								<ExternalLink href={ 'https://help.newspack.com' }>
									{ __( 'Learn more', 'newspack-plugin' ) }
								</ExternalLink>
							</>
						</p>
						<Grid columns={ 2 } gutter={ 16 }>
							<div>
								<Button variant={ allReady ? 'primary' : 'secondary' } disabled={ ! allReady }>
									{ allReady
										? __( 'Set up Reader Activation campaign', 'newspack' )
										: __( 'Waiting for all settings to be ready', 'newspack' ) }
								</Button>
							</div>
						</Grid>
					</>
				</ActionCard>
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
					{ newspack_engagement_wizard.has_memberships && membershipsConfig ? (
						<>
							<SectionHeader
								title={ __( 'Memberships Integration', 'newspack' ) }
								description={ __( 'Improve the reader experience on content gating.', 'newspack' ) }
							/>
							<ActionCard
								title={ __( 'Content Gate', 'newspack' ) }
								titleLink={ membershipsConfig.edit_gate_url }
								href={ membershipsConfig.edit_gate_url }
								description={ getContentGateDescription() }
								actionText={ __( 'Configure', 'newspack' ) }
							/>
							<hr />
						</>
					) : null }

					{ emails?.length > 0 && (
						<>
							<SectionHeader
								title={ __( 'Transactional Email Content', 'newspack' ) }
								description={ __( 'Customize the content of transactional emails.', 'newspack' ) }
							/>
							{ emails.map( email => (
								<ActionCard
									key={ email.post_id }
									title={ email.label }
									titleLink={ email.edit_link }
									href={ email.edit_link }
									description={ email.description }
									actionText={ __( 'Edit', 'newspack' ) }
									isSmall
								/>
							) ) }
							<hr />
						</>
					) }

					<SectionHeader
						title={ __( 'Email Service Provider (ESP) Advanced Settings', 'newspack' ) }
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
						<Button
							isPrimary
							onClick={ () => {
								saveConfig( {
									newsletters_label: config.newsletters_label, // TODO: Deprecate this in favor of user input via the prompt copy wizard.
									metadata_prefix: config.metadata_prefix,
									active_campaign_master_list: config.active_campaign_master_list,
								} );
							} }
							disabled={ inFlight }
						>
							{
								// TODO: Refactor so that this button only saves advanced settings.
								__( 'Save advanced settings', 'newspack' )
							}
						</Button>
					</div>
				</Card>
			) }
		</>
	);
} );
