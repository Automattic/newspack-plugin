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
	Notice,
	PluginInstaller,
	SectionHeader,
	TextControl,
	Waiting,
	withWizardScreen,
} from '../../../../components/src';
import Prerequisite from '../../components/prerequisite';
import ActiveCampaign from '../../components/active-campaign';
import MetadataFields from '../../components/metadata-fields';
import Mailchimp from '../../components/mailchimp';
import { HANDOFF_KEY } from '../../../../components/src/consts';
import SortableNewsletterListControl from '../../../../components/src/sortable-newsletter-list-control';

export default withWizardScreen( ( { wizardApiFetch } ) => {
	const [ inFlight, setInFlight ] = useState( false );
	const [ config, setConfig ] = useState( {} );
	const [ membershipsConfig, setMembershipsConfig ] = useState( {} );
	const [ error, setError ] = useState( false );
	const [ allReady, setAllReady ] = useState( false );
	const [ isActiveCampaign, setIsActiveCampaign ] = useState( false );
	const [ isMailchimp, setIsMailchimp ] = useState( false );
	const [ prerequisites, setPrerequisites ] = useState( null );
	const [ missingPlugins, setMissingPlugins ] = useState( [] );
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
			.then( ( { config: fetchedConfig, prerequisites_status, memberships } ) => {
				setPrerequisites( prerequisites_status );
				setConfig( fetchedConfig );
				setMembershipsConfig( memberships );
			} )
			.catch( setError )
			.finally( () => setInFlight( false ) );
	};
	const saveConfig = data => {
		setError( false );
		setInFlight( true );
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/reader-activation',
			method: 'post',
			quiet: true,
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
	useEffect( () => {
		window.scrollTo( 0, 0 );
		fetchConfig();

		// Clear the handoff when the component mounts.
		window.localStorage.removeItem( HANDOFF_KEY );
	}, [] );
	useEffect( () => {
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters',
		} ).then( data => {
			setIsMailchimp(
				data?.settings?.newspack_newsletters_service_provider?.value === 'mailchimp'
			);
			setIsActiveCampaign(
				data?.settings?.newspack_newsletters_service_provider?.value === 'active_campaign'
			);
		} );
	}, [] );
	useEffect( () => {
		const _allReady =
			! missingPlugins.length &&
			prerequisites &&
			Object.keys( prerequisites ).every( key => prerequisites[ key ]?.active );

		setAllReady( _allReady );

		if ( prerequisites ) {
			setMissingPlugins(
				Object.keys( prerequisites ).reduce( ( acc, slug ) => {
					const prerequisite = prerequisites[ slug ];
					if ( prerequisite.plugins ) {
						for ( const pluginSlug in prerequisite.plugins ) {
							if ( ! prerequisite.plugins[ pluginSlug ] ) {
								acc.push( pluginSlug );
							}
						}
					}
					return acc;
				}, [] )
			);
		}
	}, [ prerequisites ] );

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

	const emails = Object.values( config.emails || {} );

	const getContentGateDescription = () => {
		let message = __(
			'Configure the gate rendered on content with restricted access.',
			'newspack-plugin'
		);
		if ( 'publish' === membershipsConfig?.gate_status ) {
			message += ' ' + __( 'The gate is currently published.', 'newspack-plugin' );
		} else if (
			'draft' === membershipsConfig?.gate_status ||
			'trash' === membershipsConfig?.gate_status
		) {
			message += ' ' + __( 'The gate is currently a draft.', 'newspack-plugin' );
		}
		return message;
	};

	return (
		<>
			<SectionHeader
				title={ __( 'Reader Activation', 'newspack-plugin' ) }
				description={ () => (
					<>
						{ __(
							'Newspack’s Reader Activation system is a set of features that aim to increase reader loyalty, promote engagement, and drive revenue. ',
							'newspack-plugin'
						) }
						<ExternalLink href={ 'https://help.newspack.com/engagement/reader-activation-system' }>
							{ __( 'Learn more', 'newspack-plugin' ) }
						</ExternalLink>
					</>
				) }
			/>
			{ error && (
				<Notice
					noticeText={ error?.message || __( 'Something went wrong.', 'newspack-plugin' ) }
					isError
				/>
			) }
			{ 0 < missingPlugins.length && (
				<Notice
					noticeText={ __( 'The following plugins are required.', 'newspack-plugin' ) }
					isWarning
				/>
			) }
			{ 0 === missingPlugins.length && prerequisites && ! allReady && (
				<Notice
					noticeText={ __(
						'Complete these settings to enable Reader Activation.',
						'newspack-plugin'
					) }
					isWarning
				/>
			) }
			{ prerequisites && allReady && config.enabled && (
				<Notice noticeText={ __( 'Reader Activation is enabled.', 'newspack-plugin' ) } isSuccess />
			) }
			{ ! prerequisites && (
				<>
					<Waiting isLeft />
					{ __( 'Retrieving status…', 'newspack-plugin' ) }
				</>
			) }
			{ 0 < missingPlugins.length && prerequisites && (
				<PluginInstaller
					plugins={ missingPlugins }
					withoutFooterButton
					onStatus={ ( { complete } ) => complete && fetchConfig() }
				/>
			) }
			{ ! missingPlugins.length &&
				prerequisites &&
				Object.keys( prerequisites ).map( key => (
					<Prerequisite
						key={ key }
						config={ config }
						getSharedProps={ getSharedProps }
						inFlight={ inFlight }
						prerequisite={ prerequisites[ key ] }
						fetchConfig={ fetchConfig }
						saveConfig={ saveConfig }
					/>
				) ) }
			{ config.enabled && (
				<>
					<hr />
					<Button variant="secondary" onClick={ () => setShowAdvanced( ! showAdvanced ) }>
						{ sprintf(
							// Translators: Show or Hide advanced settings.
							__( '%s Advanced Settings', 'newspack-plugin' ),
							showAdvanced ? __( 'Hide', 'newspack-plugin' ) : __( 'Show', 'newspack-plugin' )
						) }
					</Button>
				</>
			) }
			{ showAdvanced && (
				<Card noBorder>
					{ newspack_engagement_wizard.has_memberships && membershipsConfig ? (
						<>
							<SectionHeader
								title={ __( 'Memberships Integration', 'newspack-plugin' ) }
								description={ __(
									'Improve the reader experience on content gating.',
									'newspack-plugin'
								) }
							/>
							<ActionCard
								title={ __( 'Content Gate', 'newspack-plugin' ) }
								titleLink={ membershipsConfig.edit_gate_url }
								href={ membershipsConfig.edit_gate_url }
								description={ getContentGateDescription() }
								actionText={ __( 'Configure', 'newspack-plugin' ) }
							/>
							{ membershipsConfig?.plans && 1 < membershipsConfig.plans.length && (
								<ActionCard
									title={ __( 'Require membership in all plans', 'newspack-plugin' ) }
									description={ __(
										'When enabled, readers must belong to all membership plans that apply to a restricted content item before they are granted access. Otherwise, they will be able to unlock access to that item with membership in any single plan that applies to it.',
										'newspack-plugin'
									) }
									toggleOnChange={ value =>
										setMembershipsConfig( { ...membershipsConfig, require_all_plans: value } )
									}
									toggleChecked={ membershipsConfig.require_all_plans }
								/>
							) }
							<hr />
						</>
					) : null }

					{ emails?.length > 0 && (
						<>
							<SectionHeader
								title={ __( 'Transactional Email Content', 'newspack-plugin' ) }
								description={ __(
									'Customize the content of transactional emails.',
									'newspack-plugin'
								) }
							/>
							{ emails.map( email => (
								<ActionCard
									key={ email.post_id }
									title={ email.label }
									titleLink={ email.edit_link }
									href={ email.edit_link }
									description={ email.description }
									actionText={ __( 'Edit', 'newspack-plugin' ) }
									isSmall
								/>
							) ) }
							<hr />
						</>
					) }

					<SectionHeader title={ __( 'Newsletter Subscription Lists', 'newspack-plugin' ) } />
					<ActionCard
						title={ __( 'Custom newsletter lists on registration', 'newspack-plugin' ) }
						description={ __(
							"Choose which of the Newspack Newsletters's subscription lists should be available upon registration.",
							'newspack-plugin'
						) }
						toggleChecked={ config.use_custom_lists }
						toggleOnChange={ value => updateConfig( 'use_custom_lists', value ) }
					/>
					{ config.use_custom_lists && (
						<SortableNewsletterListControl
							lists={ newspack_engagement_wizard.available_newsletter_lists }
							selected={ config.newsletter_lists }
							onChange={ selected => updateConfig( 'newsletter_lists', selected ) }
						/>
					) }

					<hr />

					<SectionHeader
						title={ __( 'Email Service Provider (ESP) Advanced Settings', 'newspack-plugin' ) }
						description={ __(
							'Settings for Newspack Newsletters integration.',
							'newspack-plugin'
						) }
					/>
					<TextControl
						label={ __( 'Newsletter subscription text on registration', 'newspack-plugin' ) }
						help={ __(
							'The text to display while subscribing to newsletters from the sign-in modal.',
							'newspack-plugin'
						) }
						{ ...getSharedProps( 'newsletters_label', 'text' ) }
					/>
					<ActionCard
						description={ __(
							'Configure options for syncing reader data to the connected ESP.',
							'newspack-plugin'
						) }
						hasGreyHeader={ true }
						isMedium
						title={ __( 'Sync contacts to ESP', 'newspack-plugin' ) }
						toggleChecked={ config.sync_esp }
						toggleOnChange={ value => updateConfig( 'sync_esp', value ) }
					>
						{ config.sync_esp && (
							<>
								{ isMailchimp && (
									<Mailchimp
										value={ {
											audienceId: config.mailchimp_audience_id,
											readerDefaultStatus: config.mailchimp_reader_default_status,
										} }
										onChange={ ( key, value ) => {
											if ( key === 'audienceId' ) {
												updateConfig( 'mailchimp_audience_id', value );
											}
											if ( key === 'readerDefaultStatus' ) {
												updateConfig( 'mailchimp_reader_default_status', value );
											}
										} }
									/>
								) }
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
								<MetadataFields
									availableFields={ newspack_engagement_wizard.esp_metadata_fields || [] }
									selectedFields={ config.metadata_fields }
									updateConfig={ updateConfig }
									getSharedProps={ getSharedProps }
								/>
							</>
						) }
					</ActionCard>
					<div className="newspack-buttons-card">
						<Button
							isPrimary
							onClick={ () => {
								saveConfig( {
									newsletters_label: config.newsletters_label, // TODO: Deprecate this in favor of user input via the prompt copy wizard.
									mailchimp_audience_id: config.mailchimp_audience_id,
									mailchimp_reader_default_status: config.mailchimp_reader_default_status,
									active_campaign_master_list: config.active_campaign_master_list,
									memberships_require_all_plans: membershipsConfig.require_all_plans,
									use_custom_lists: config.use_custom_lists,
									newsletter_lists: config.newsletter_lists,
									sync_esp: config.sync_esp,
									metadata_fields: config.metadata_fields,
									metadata_prefix: config.metadata_prefix,
								} );
							} }
							disabled={ inFlight }
						>
							{ __( 'Save advanced settings', 'newspack-plugin' ) }
						</Button>
					</div>
				</Card>
			) }
		</>
	);
} );
