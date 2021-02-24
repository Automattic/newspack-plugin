/**
 * Internal dependencies
 */
import { values, startCase, uniq, mapValues, property } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useEffect, Fragment } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	Notice,
	TextControl,
	CheckboxControl,
	SelectControl,
	PluginInstaller,
	withWizardScreen,
	SectionHeader,
	Button,
	Grid,
	hooks,
} from '../../../../components/src';
import { fetchJetpackMailchimpStatus } from '../../../../utils';

export const NewspackNewsletters = ( { className, onUpdate, mailchimpOnly = true } ) => {
	const [ config, updateConfig ] = hooks.useObjectState( {} );
	const [ allProviders, setAllProviders ] = useState( [] );
	const performConfigUpdate = update => {
		updateConfig( update );
		if ( onUpdate ) {
			onUpdate( mapValues( update.settings, property( 'value' ) ) );
		}
	};
	useEffect( () => {
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters',
		} ).then( res => {
			setAllProviders(
				uniq( res.settings.reduce( ( acc, setting ) => [ ...acc, setting.provider ], [] ) ).filter(
					Boolean
				)
			);
			performConfigUpdate( {
				...res,
				settings: res.settings.reduce(
					( acc, setting ) => ( { ...acc, [ setting.key ]: setting } ),
					{}
				),
			} );
		} );
	}, [] );
	const getSettingProps = key => ( {
		value: config.settings[ key ]?.value,
		checked: Boolean( config.settings[ key ]?.value ),
		label: config.settings[ key ]?.description,
		onChange: value => performConfigUpdate( { settings: { [ key ]: { value } } } ),
	} );

	const renderMailchimpSettings = () => (
		<>
			<SectionHeader
				title={ __( 'Mailchimp', 'newspack' ) }
				description={ () => (
					<>
						{ __( 'Configure Mailchimp and enter your API key', 'newspack' ) }
						<br />
						<ExternalLink href="https://us1.admin.mailchimp.com/account/api/">
							{ __( 'Generate Mailchimp API key', 'newspack' ) }
						</ExternalLink>
					</>
				) }
			/>
			<Grid gutter={ 32 } columns={ 2 }>
				<TextControl
					label={ __( 'Application ID', 'newspack' ) }
					{ ...getSettingProps( 'newspack_newsletters_mailchimp_api_key' ) }
				/>
			</Grid>
		</>
	);
	const renderProviderSettings = () => {
		const providerSelectProps = getSettingProps( 'newspack_newsletters_service_provider' );
		return (
			<Grid gutter={ 32 } columns={ 2 }>
				<SelectControl
					label={ __( 'Service Provider', 'newspack' ) }
					options={ allProviders.map( value => ( { value, label: startCase( value ) } ) ) }
					{ ...providerSelectProps }
				/>
				<br />
				{ values( config.settings )
					.filter( setting => setting.provider === providerSelectProps.value )
					.map( setting => {
						switch ( setting.type ) {
							case 'checkbox':
								return (
									<CheckboxControl key={ setting.key } { ...getSettingProps( setting.key ) } />
								);
							default:
								return <TextControl key={ setting.key } { ...getSettingProps( setting.key ) } />;
						}
					} ) }
			</Grid>
		);
	};

	return (
		<div className={ className }>
			{ config.configured === false && (
				<PluginInstaller plugins={ [ 'newspack-newsletters' ] } withoutFooterButton />
			) }
			{ config.configured === true && (
				<Fragment>
					{ mailchimpOnly ? renderMailchimpSettings() : renderProviderSettings() }
					<SectionHeader
						title={ __( 'MJML', 'newspack' ) }
						description={ () => (
							<>
								{ __(
									'Helps turn the markup generated by the editor into something that will display nicely in email clients',
									'newspack'
								) }
								<br />
								<ExternalLink href="https://mjml.io/api">
									{ __( 'Request MJML API keys', 'newspack' ) }
								</ExternalLink>
							</>
						) }
					/>
					<Grid gutter={ 32 }>
						<TextControl
							label={ __( 'Application ID', 'newspack' ) }
							{ ...getSettingProps( 'newspack_newsletters_mjml_api_key' ) }
						/>
						<TextControl
							label={ __( 'Application Secret', 'newspack' ) }
							{ ...getSettingProps( 'newspack_newsletters_mjml_api_secret' ) }
						/>
					</Grid>
				</Fragment>
			) }
		</div>
	);
};

const Newsletters = () => {
	const [ { status, url, error, newslettersConfig }, updateConfiguration ] = hooks.useObjectState(
		{}
	);
	useEffect( () => {
		fetchJetpackMailchimpStatus().then( updateConfiguration );
	}, [] );
	const isConnected = status === 'active';

	const saveNewslettersData = async () =>
		apiFetch( {
			path: '/newspack/v1/wizard/newspack-engagement-wizard/newsletters',
			method: 'POST',
			data: newslettersConfig,
		} );

	return (
		<Fragment>
			<SectionHeader
				title={ __( 'Signup forms', 'newspack' ) }
				description={ () => (
					<>
						{ __(
							'Connects your site to Mailchimp and sets up a Mailchimp block you can use to get new subscribers for your newsletter',
							'newspack'
						) }
						<br />
						{ __(
							'The Mailchimp connection to your site for this feature is managed through Jetpack and WordPress.com',
							'newspack'
						) }
						<br />
						{ url ? (
							<ExternalLink href={ url }>
								{ isConnected
									? __( 'Manage your Mailchimp connection' )
									: __( 'Set up Mailchimp' ) }
							</ExternalLink>
						) : null }
					</>
				) }
			/>
			{ isConnected && (
				<Notice
					noticeText={ __(
						'You can insert newsletter sign up forms in your content using the Mailchimp block.'
					) }
					isSuccess
				/>
			) }
			{ error?.code === 'unavailable_site_id' && (
				<Notice noticeText={ __( 'Connect Jetpack in order to configure Mailchimp.' ) } isWarning />
			) }
			<SectionHeader title={ __( 'Authoring', 'newspack' ) } />
			<NewspackNewsletters
				mailchimpOnly={ false }
				onUpdate={ config => updateConfiguration( { newslettersConfig: config } ) }
			/>
			<div className="newspack-buttons-card">
				<Button isPrimary onClick={ saveNewslettersData }>
					{ __( 'Save', 'newspack' ) }
				</Button>
			</div>
		</Fragment>
	);
};

export default withWizardScreen( () => (
	<>
		<Newsletters />
		<SectionHeader title={ __( 'WooCommerce integration', 'newspack' ) } />{' '}
		<PluginInstaller plugins={ [ 'mailchimp-for-woocommerce' ] } withoutFooterButton />
	</>
) );
