/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	ExternalLink,
	TextControl,
	Button,
	BaseControl,
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
				title={ __( 'Countdown Banner', 'newspack-plugin' ) }
				description={ __( 'Show a countdown banner before content is restricted by a metered content gate.', 'newspack-plugin' ) }
				toggleOnChange={ value => updateConfig( { countdown_banner: { enabled: value } } ) }
				toggleChecked={ config.countdown_banner?.enabled }
				hasGreyHeader={ config.countdown_banner?.enabled }
				togglePosition="trailing"
			>
				{ config.countdown_banner?.enabled && (
					<>
						<Grid columns={ 2 } rowGap={ 16 }>
							<TextControl
								label={ __( 'Message', 'newspack-plugin' ) }
								help={ __( 'Text displayed in the countdown banner.', 'newspack-plugin' ) }
								value={ config.countdown_banner.cta_label }
								onChange={ value => setConfig( { ...config, countdown_banner: { ...config.countdown_banner, cta_label: value } } ) }
								__next40pxDefaultSize
							/>
							<TextControl
								label={ __( 'Subscribe button label', 'newspack-plugin' ) }
								help={ __( 'Text displayed on the subscribe button in the banner.', 'newspack-plugin' ) }
								value={ config.countdown_banner.button_label }
								onChange={ value =>
									setConfig( { ...config, countdown_banner: { ...config.countdown_banner, button_label: value } } )
								}
								__next40pxDefaultSize
							/>
							<TextControl
								label={ __( 'Subscribe button URL', 'newspack-plugin' ) }
								help={ __(
									'URL for the subscribe button in the banner. If not provided, the primary subscription tier product will be used with modal checkout.',
									'newspack-plugin'
								) }
								value={ config.countdown_banner.cta_url }
								onChange={ value => setConfig( { ...config, countdown_banner: { ...config.countdown_banner, cta_url: value } } ) }
								__next40pxDefaultSize
							/>
							<ToggleGroupControl
								label={ __( 'Style', 'newspack-plugin' ) }
								value={ config.countdown_banner.style || 'light' }
								onChange={ value => setConfig( { ...config, countdown_banner: { ...config.countdown_banner, style: value } } ) }
								isBlock
								__next40pxDefaultSize
							>
								<ToggleGroupControlOption label={ __( 'Light', 'newspack-plugin' ) } value="light" />
								<ToggleGroupControlOption label={ __( 'Dark', 'newspack-plugin' ) } value="dark" />
							</ToggleGroupControl>
							<div style={ { gridColumn: '1 / -1' } }>
								<BaseControl id="newspack-countdown-banner-cta-preview" label={ __( 'Preview', 'newspack-plugin' ) }>
									<div className="newspack-countdown-banner__cta-preview">
										<div className="newspack-ui">
											<div
												className={ `banner newspack-countdown-banner__cta is-style-${
													config.countdown_banner.style || 'light'
												}` }
											>
												<div className="wrapper newspack-countdown-banner__cta__content">
													<span className="newspack-ui__font--s">
														{ config.countdown_banner.cta_label ||
															__( 'Subscribe now and get unlimited access.', 'newspack-plugin' ) }
													</span>
													<button
														className={ `newspack-ui__button newspack-ui__button--x-small ${
															( config.countdown_banner.style || 'light' ) === 'dark'
																? 'newspack-ui__button--primary-light'
																: 'newspack-ui__button--accent'
														}` }
													>
														{ config.countdown_banner.button_label || __( 'Subscribe now', 'newspack-plugin' ) }
													</button>
												</div>
											</div>
										</div>
									</div>
								</BaseControl>
							</div>
						</Grid>
						<div className="newspack-buttons-card" style={ { margin: '32px 0 0 0' } }>
							<Button isPrimary onClick={ () => updateConfig( { countdown_banner: config.countdown_banner } ) }>
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
