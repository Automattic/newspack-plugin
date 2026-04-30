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
import './reader-account-customization.scss';

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

// Zero out intrinsic top/bottom margins on non-control elements so the per-section VStack `spacing={ 8 }` is the single source of vertical rhythm inside each section.
const NO_MARGIN = { marginTop: 0, marginBottom: 0 };

function ReaderAccountCustomization() {
	const [ settings, setSettings ] = useState( DEFAULTS );
	const update = ( key, value ) => setSettings( prev => ( { ...prev, [ key ]: value } ) );

	return (
		<WizardsTab title={ __( 'Reader Account Customization', 'newspack-plugin' ) } className="newspack-audience__reader-account-customization">
			<Grid columns={ 2 } gutter={ 32 } noMargin>
				<SectionHeader
					heading={ 2 }
					noMargin
					title={ __( 'Branding', 'newspack-plugin' ) }
					description={ __( 'Customize the sidebar and add your logo.', 'newspack-plugin' ) }
				/>
				<VStack spacing={ 8 }>
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

			<Divider alignment="full-width" variant="tertiary" />

			<Grid columns={ 2 } gutter={ 32 } noMargin>
				<SectionHeader
					heading={ 2 }
					noMargin
					title={ __( 'Newsletters', 'newspack-plugin' ) }
					description={ __( 'Configure the optional title and description for the Newsletters page.', 'newspack-plugin' ) }
				/>
				<VStack spacing={ 8 }>
					<TextControl
						label={ __( 'Page title', 'newspack-plugin' ) }
						value={ settings.newslettersTitle }
						onChange={ value => update( 'newslettersTitle', value ) }
						__next40pxDefaultSize
					/>
					<TextareaControl
						label={ __( 'Page description', 'newspack-plugin' ) }
						value={ settings.newslettersDescription }
						onChange={ value => update( 'newslettersDescription', value ) }
						rows={ 4 }
					/>
				</VStack>
			</Grid>

			<Divider alignment="full-width" variant="tertiary" />

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
				<VStack spacing={ 8 }>
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
					>
						<ToggleGroupControlOption label={ __( 'Subscription', 'newspack-plugin' ) } value="subscription" />
						<ToggleGroupControlOption label={ __( 'Membership', 'newspack-plugin' ) } value="membership" />
						<ToggleGroupControlOption label={ __( 'Custom', 'newspack-plugin' ) } value="custom" />
					</ToggleGroupControl>
					{ settings.terminology === 'custom' && (
						<VStack spacing={ 8 }>
							<TextControl
								label={ __( 'Custom term (singular)', 'newspack-plugin' ) }
								placeholder={ __( 'e.g. Patronage', 'newspack-plugin' ) }
								value={ settings.terminologyCustomSingular }
								onChange={ value => update( 'terminologyCustomSingular', value ) }
								__next40pxDefaultSize
							/>
							<TextControl
								label={ __( 'Custom term (plural)', 'newspack-plugin' ) }
								placeholder={ __( 'e.g. Patronages', 'newspack-plugin' ) }
								value={ settings.terminologyCustomPlural }
								onChange={ value => update( 'terminologyCustomPlural', value ) }
								__next40pxDefaultSize
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
					/>
				</VStack>
			</Grid>

			<div className="newspack-buttons-card">
				<Button variant="primary" onClick={ () => null }>
					{ __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
		</WizardsTab>
	);
}

export default withWizardScreen( ReaderAccountCustomization );
