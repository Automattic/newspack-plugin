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

import { ActionCard, Grid } from '../../../../../packages/components/src';

export default function CountdownBanner( { config, setConfig, updateConfig } ) {
	return (
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
							onChange={ value => setConfig( { ...config, countdown_banner: { ...config.countdown_banner, button_label: value } } ) }
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
								<div className="newspack-countdown-banner__cta-preview" inert>
									<div className="newspack-ui">
										<div
											className={ `banner newspack-countdown-banner__cta is-style-${
												config.countdown_banner.style || 'light'
											}` }
										>
											<div className="wrapper newspack-countdown-banner__cta__content">
												<div className="newspack-countdown-banner__cta__content__wrapper">
													<span className="newspack-countdown-banner__cta__content__countdown newspack-ui__font--s">
														<strong>{ __( '1/10 free articles this month', 'newspack-plugin' ) }</strong>
													</span>
													<span className="newspack-countdown-banner__cta__content__message newspack-ui__font--xs">
														{ config.countdown_banner.cta_label ||
															__( 'Subscribe now and get unlimited access.', 'newspack-plugin' ) }{ ' ' }
														<a href="#signin_modal">{ __( 'Sign in to an existing account', 'newspack-plugin' ) }</a>.
													</span>
												</div>
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
	);
}
