/**
 * Reader Account Customization (My Account v2 prototype demo).
 *
 * Pure-demo screen — no REST roundtrip, no persistence. Local React state only.
 * Demonstrates the admin shape we have in mind for the v2 My Account experience
 * so publishers can click through the controls during stakeholder review.
 */

/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	TextareaControl,
	TextControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies.
 */
import { Button, Divider, Grid, ImageUpload, SectionHeader, withWizardScreen } from '../../../../../packages/components/src';
import WizardsTab from '../../../wizards-tab';

const DEFAULTS = {
	logo: '',
	newslettersTitle: '',
	newslettersDescription: '',
	terminology: 'subscription',
	terminologyCustomSingular: '',
	terminologyCustomPlural: '',
	cancelDonationMessage: __( 'We appreciate your generous support, even if you can no longer donate at this time.', 'newspack-plugin' ),
	billingFooter: '',
};

// Zero out intrinsic top/bottom margins so the wrapping VStack `spacing={ 8 }` is the single source of section-to-section rhythm.
const NO_MARGIN = { marginTop: 0, marginBottom: 0 };

function ReaderAccountCustomization() {
	const [ settings, setSettings ] = useState( DEFAULTS );
	const update = ( key, value ) => setSettings( prev => ( { ...prev, [ key ]: value } ) );

	return (
		<WizardsTab title={ __( 'Reader Account Customization', 'newspack-plugin' ) }>
			<VStack spacing={ 8 }>
				<Grid columns={ 2 } gutter={ 32 } noMargin>
					<SectionHeader
						heading={ 2 }
						noMargin
						title={ __( 'Branding', 'newspack-plugin' ) }
						description={ __( 'Customize the sidebar and add your logo.', 'newspack-plugin' ) }
					/>
					<VStack spacing={ 4 }>
						<ImageUpload
							style={ NO_MARGIN }
							label={ __( 'Logo', 'newspack-plugin' ) }
							image={ settings.logo }
							onChange={ value => update( 'logo', value ) }
						/>
						<p className="newspack-wizard__help-text" style={ NO_MARGIN }>
							{ __( 'Display your logo in the sidebar (on a white background). It will replace the default icon.', 'newspack-plugin' ) }
						</p>
					</VStack>
				</Grid>

				<Divider alignment="full-width" variant="tertiary" style={ NO_MARGIN } />

				<Grid columns={ 2 } gutter={ 32 } noMargin>
					<SectionHeader
						heading={ 2 }
						noMargin
						title={ __( 'Newsletters', 'newspack-plugin' ) }
						description={ __( 'Configure the optional title and description for the Newsletters page.', 'newspack-plugin' ) }
					/>
					<VStack spacing={ 4 }>
						<TextControl
							label={ __( 'Page title', 'newspack-plugin' ) }
							value={ settings.newslettersTitle }
							onChange={ value => update( 'newslettersTitle', value ) }
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						/>
						<TextareaControl
							label={ __( 'Page description', 'newspack-plugin' ) }
							value={ settings.newslettersDescription }
							onChange={ value => update( 'newslettersDescription', value ) }
							rows={ 4 }
							__nextHasNoMarginBottom
						/>
					</VStack>
				</Grid>

				<Divider alignment="full-width" variant="tertiary" style={ NO_MARGIN } />

				<Grid columns={ 2 } gutter={ 32 } noMargin>
					<SectionHeader
						heading={ 2 }
						noMargin
						title={ __( 'Account & Billing', 'newspack-plugin' ) }
						description={ __(
							'Manage your account settings and customize messaging across billing, invoices, and cancellation flows.',
							'newspack-plugin'
						) }
					/>
					<VStack spacing={ 4 }>
						<ToggleGroupControl
							label={ __( 'Terminology', 'newspack-plugin' ) }
							help={
								settings.terminology === 'custom'
									? __( 'Define your own terms for the user account and billing pages.', 'newspack-plugin' )
									: __(
											'Use either "Subscription", "Membership", or a custom term on the user account and billing pages.',
											'newspack-plugin'
									  )
							}
							value={ settings.terminology }
							onChange={ value => update( 'terminology', value ) }
							isBlock
							__next40pxDefaultSize
							__nextHasNoMarginBottom
						>
							<ToggleGroupControlOption label={ __( 'Subscription', 'newspack-plugin' ) } value="subscription" />
							<ToggleGroupControlOption label={ __( 'Membership', 'newspack-plugin' ) } value="membership" />
							<ToggleGroupControlOption label={ __( 'Custom', 'newspack-plugin' ) } value="custom" />
						</ToggleGroupControl>
						{ settings.terminology === 'custom' && (
							<VStack spacing={ 4 }>
								<TextControl
									label={ __( 'Custom term (singular)', 'newspack-plugin' ) }
									placeholder={ __( 'e.g. Patronage', 'newspack-plugin' ) }
									value={ settings.terminologyCustomSingular }
									onChange={ value => update( 'terminologyCustomSingular', value ) }
									__next40pxDefaultSize
									__nextHasNoMarginBottom
								/>
								<TextControl
									label={ __( 'Custom term (plural)', 'newspack-plugin' ) }
									placeholder={ __( 'e.g. Patronages', 'newspack-plugin' ) }
									value={ settings.terminologyCustomPlural }
									onChange={ value => update( 'terminologyCustomPlural', value ) }
									__next40pxDefaultSize
									__nextHasNoMarginBottom
								/>
							</VStack>
						) }
						<TextareaControl
							label={ __( 'Cancel recurring donation', 'newspack-plugin' ) }
							help={ __(
								'Add a message to display to users when they are about to cancel a recurring donation. This is an opportunity to encourage them to keep their donation.',
								'newspack-plugin'
							) }
							value={ settings.cancelDonationMessage }
							onChange={ value => update( 'cancelDonationMessage', value ) }
							rows={ 4 }
							__nextHasNoMarginBottom
						/>
						<TextareaControl
							label={ __( 'Billing/invoice footer', 'newspack-plugin' ) }
							help={ __(
								'Add an optional footer message to display at the bottom of billing and invoice pages, such as tax information or other relevant details.',
								'newspack-plugin'
							) }
							value={ settings.billingFooter }
							onChange={ value => update( 'billingFooter', value ) }
							rows={ 4 }
							__nextHasNoMarginBottom
						/>
					</VStack>
				</Grid>

				<div className="newspack-buttons-card">
					<Button variant="primary" onClick={ () => null }>
						{ __( 'Save Settings', 'newspack-plugin' ) }
					</Button>
				</div>
			</VStack>
		</WizardsTab>
	);
}

export default withWizardScreen( ReaderAccountCustomization );
