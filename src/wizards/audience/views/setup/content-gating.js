/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	RangeControl,
	SelectControl,
	TextControl,
	Button,
	BaseControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHeading as Heading,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';

import { ActionCard, Grid, Notice, withWizardScreen } from '../../../../../packages/components/src';
import WizardsTab from '../../../wizards-tab';

export default withWizardScreen( ( { wizardApiFetch } ) => {
	const [ error, setError ] = useState( false );
	const [ config, setConfig ] = useState( {} );

	useEffect( () => {
		fetchConfig();
	}, [] );

	const fetchConfig = () => {
		setError( false );
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-audience/content-gating',
		} )
			.then( data => {
				setConfig( data );
			} )
			.catch( setError );
	};

	const updateConfig = newConfig => {
		setError( false );
		wizardApiFetch( {
			path: '/newspack/v1/wizard/newspack-audience/content-gating',
			method: 'POST',
			quiet: true,
			data: newConfig,
		} )
			.then( data => {
				setConfig( data );
			} )
			.catch( setError );
	};

	const getContentGateDescription = () => {
		let message = __( 'Configure the gate rendered on content with restricted access.', 'newspack-plugin' );
		if ( 'publish' === config?.gate_status ) {
			message += ' ' + __( 'The gate is currently published.', 'newspack-plugin' );
		} else if ( 'draft' === config?.gate_status || 'trash' === config?.gate_status ) {
			message += ' ' + __( 'The gate is currently a draft.', 'newspack-plugin' );
		}
		return message;
	};

	return (
		<WizardsTab
			title={ __( 'Content Gating', 'newspack-plugin' ) }
			description={
				<>
					{ __( 'WooCommerce Memberships integration to improve the reader experience with content gating. ', 'newspack-plugin' ) }
					<ExternalLink href={ 'https://help.newspack.com/engagement/audience-management-system/content-gating/' }>
						{ __( 'Learn more', 'newspack-plugin' ) }
					</ExternalLink>
				</>
			}
		>
			{ error && <Notice noticeText={ error?.message || __( 'Something went wrong.', 'newspack-plugin' ) } isError /> }
			<ActionCard
				title={ __( 'Content Gate', 'newspack-plugin' ) }
				titleLink={ config.edit_gate_url }
				href={ config.edit_gate_url }
				description={ getContentGateDescription() }
				actionText={ __( 'Configure', 'newspack-plugin' ) }
			/>
			<ActionCard
				title={ __( 'Content Gifting', 'newspack-plugin' ) }
				description={ __( 'Allow members to gift articles for 24 hours, up to the configured limit.', 'newspack-plugin' ) }
				toggleOnChange={ value => updateConfig( { content_gifting: { enabled: value } } ) }
				toggleChecked={ config.content_gifting?.enabled }
				hasGreyHeader={ config.content_gifting?.enabled }
				togglePosition="trailing"
			>
				{ config.content_gifting?.enabled && (
					<>
						<Grid columns={ 2 } rowGap={ 16 }>
							<Heading level={ 4 } style={ { gridColumn: '1 / -1' } }>
								{ __( 'General Settings', 'newspack-plugin' ) }
							</Heading>
							<RangeControl
								label={ __( 'Gifting limit', 'newspack-plugin' ) }
								help={ __(
									'Maximum number of articles that can be gifted per user for the configured interval.',
									'newspack-plugin'
								) }
								min={ 1 }
								max={ 20 }
								value={ config.content_gifting.limit }
								onChange={ value => setConfig( { ...config, content_gifting: { ...config.content_gifting, limit: value } } ) }
								__next40pxDefaultSize
							/>
							<SelectControl
								label={ __( 'Gifting limit interval', 'newspack-plugin' ) }
								help={ __( 'Interval at which the gifting limit is reset.', 'newspack-plugin' ) }
								value={ config.content_gifting.interval }
								onChange={ value => setConfig( { ...config, content_gifting: { ...config.content_gifting, interval: value } } ) }
								options={ [
									{ value: 'day', label: __( 'Day', 'newspack-plugin' ) },
									{ value: 'week', label: __( 'Week', 'newspack-plugin' ) },
									{ value: 'month', label: __( 'Month', 'newspack-plugin' ) },
								] }
								__next40pxDefaultSize
							/>
						</Grid>
						<Grid columns={ 2 } rowGap={ 16 }>
							<Heading level={ 4 } style={ { gridColumn: '1 / -1' } }>
								{ __( 'Recipient Banner', 'newspack-plugin' ) }
							</Heading>
							<TextControl
								label={ __( 'Message', 'newspack-plugin' ) }
								help={ __( 'Text displayed in the banner shown to recipients of gifted articles.', 'newspack-plugin' ) }
								value={ config.content_gifting.cta_label }
								onChange={ value => setConfig( { ...config, content_gifting: { ...config.content_gifting, cta_label: value } } ) }
								__next40pxDefaultSize
							/>
							<TextControl
								label={ __( 'Subscribe button label', 'newspack-plugin' ) }
								help={ __( 'Text displayed on the subscribe button in the banner.', 'newspack-plugin' ) }
								value={ config.content_gifting.button_label }
								onChange={ value => setConfig( { ...config, content_gifting: { ...config.content_gifting, button_label: value } } ) }
								__next40pxDefaultSize
							/>
							<TextControl
								label={ __( 'Subscribe button URL', 'newspack-plugin' ) }
								help={
									<>
										{ __(
											'URL for the subscribe button in the banner. If not provided, the primary subscription tier product will be used with modal checkout.',
											'newspack-plugin'
										) }{ ' ' }
										<ExternalLink href="/wp-admin/admin.php?page=newspack-audience-subscriptions">
											{ __( 'Configure the primary subscription product', 'newspack-plugin' ) }
										</ExternalLink>
									</>
								}
								value={ config.content_gifting.cta_url }
								onChange={ value => setConfig( { ...config, content_gifting: { ...config.content_gifting, cta_url: value } } ) }
								__next40pxDefaultSize
							/>
							<ToggleGroupControl
								label={ __( 'Style', 'newspack-plugin' ) }
								value={ config.content_gifting.style || 'light' }
								onChange={ value => setConfig( { ...config, content_gifting: { ...config.content_gifting, style: value } } ) }
								isBlock
								__next40pxDefaultSize
							>
								<ToggleGroupControlOption label={ __( 'Light', 'newspack-plugin' ) } value="light" />
								<ToggleGroupControlOption label={ __( 'Dark', 'newspack-plugin' ) } value="dark" />
							</ToggleGroupControl>
							<div style={ { gridColumn: '1 / -1' } }>
								<BaseControl id="newspack-content-gifting-cta-preview" label={ __( 'Preview', 'newspack-plugin' ) }>
									<div className="newspack-content-gifting__cta-preview">
										<div className="newspack-ui">
											<div
												className={ `banner newspack-content-gifting__cta is-style-${
													config.content_gifting.style || 'light'
												}` }
											>
												<div className="wrapper newspack-content-gifting__cta__content">
													<span className="newspack-ui__font--s">
														{ config.content_gifting.cta_label ||
															__(
																'This article has been gifted to you by someone who values great journalism.',
																'newspack-plugin'
															) }
													</span>
													<button
														className={ `newspack-ui__button newspack-ui__button--x-small ${
															( config.content_gifting.style || 'light' ) === 'dark'
																? 'newspack-ui__button--primary-light'
																: 'newspack-ui__button--accent'
														}` }
													>
														{ config.content_gifting.button_label || __( 'Subscribe now', 'newspack-plugin' ) }
													</button>
												</div>
											</div>
										</div>
									</div>
								</BaseControl>
							</div>
						</Grid>
						<div className="newspack-buttons-card" style={ { margin: '32px 0 0 0' } }>
							<Button isPrimary onClick={ () => updateConfig( { content_gifting: config.content_gifting } ) }>
								{ __( 'Save Settings', 'newspack-plugin' ) }
							</Button>
						</div>
					</>
				) }
			</ActionCard>
			{ config?.plans && 1 < config.plans.length && (
				<ActionCard
					title={ __( 'Require membership in all plans', 'newspack-plugin' ) }
					description={ __(
						'When enabled, readers must belong to all membership plans that apply to a restricted content item before they are granted access. Otherwise, they will be able to unlock access to that item with membership in any single plan that applies to it.',
						'newspack-plugin'
					) }
					toggleOnChange={ value => updateConfig( { require_all_plans: value } ) }
					toggleChecked={ config.require_all_plans }
					togglePosition="trailing"
				/>
			) }
			{ config.has_memberships && (
				<ActionCard
					title={ __( 'Display memberships on the subscriptions tab', 'newspack-plugin' ) }
					description={ __(
						"Display memberships that don't have active subscriptions on the My Account Subscriptions tab, so readers can see information like expiration dates.",
						'newspack-plugin'
					) }
					toggleOnChange={ value => updateConfig( { show_on_subscription_tab: value } ) }
					toggleChecked={ config.show_on_subscription_tab }
					togglePosition="trailing"
				/>
			) }
		</WizardsTab>
	);
} );
