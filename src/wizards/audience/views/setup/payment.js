/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl, TextareaControl } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import {
	Grid,
	Button,
	Wizard,
	withWizardScreen,
} from '../../../../components/src';
import WizardsTab from '../../../wizards-tab';
import WizardsSection from '../../../wizards-section';
import Platform from '../../components/platform';
import PaymentGateways from '../../components/payment-methods';
import NRHSettings from '../../components/nrh-settings';
import BillingFields from '../../components/billing-fields';

export default withWizardScreen( function ( {
	config,
	getSharedProps,
	updateConfig,
	saveConfig,
} ) {
	const data = Wizard.useWizardData( 'newspack-audience/payment' );
	return (
		<WizardsTab
			title={ __( 'Checkout & Payment', 'newspack-plugin' ) }
			description={ __(
				'Reader revenue configuration for donations and subscriptions.',
				'newspack-plugin'
			) }
		>
			<Platform />
			{ data?.platform_data?.platform === 'wc' && <PaymentGateways /> }
			{ data?.platform_data?.platform === 'wc' && <BillingFields /> }
			{ data?.platform_data?.platform === 'nrh' && <NRHSettings /> }

			<WizardsSection
				title={ __( 'Checkout Configuration', 'newspack-plugin' ) }
			>
				<ToggleControl
					label={ __(
						'Require sign in or create account before checkout',
						'newspack-plugin'
					) }
					help={ __(
						'Prompt users who are not logged in to sign in or register a new account before proceeding to checkout. When disabled, an account will automatically be created with the email address used at checkout.',
						'newspack-plugin'
					) }
					checked={ config.woocommerce_registration_required }
					onChange={ value =>
						updateConfig(
							'woocommerce_registration_required',
							value
						)
					}
				/>
				<Grid>
					<TextareaControl
						label={ __(
							'Post-checkout success message',
							'newspack-plugin'
						) }
						help={ __(
							'The success message to display to readers after completing checkout.',
							'newspack-plugin'
						) }
						{ ...getSharedProps(
							'woocommerce_post_checkout_success_text',
							'text'
						) }
					/>
					{ ! config.woocommerce_registration_required && (
						<TextareaControl
							label={ __(
								'Post-checkout registration success message',
								'newspack-plugin'
							) }
							help={ __(
								'The success message to display to new readers that have an account automatically created after completing checkout.',
								'newspack-plugin'
							) }
							{ ...getSharedProps(
								'woocommerce_post_checkout_registration_success_text',
								'text'
							) }
						/>
					) }
				</Grid>
				<Grid>
					<TextareaControl
						label={ __(
							'Checkout privacy policy text',
							'newspack-plugin'
						) }
						help={ __(
							'The privacy policy text to display at time of checkout for existing users. This will not show up unless a privacy page is set.',
							'newspack-plugin'
						) }
						{ ...getSharedProps(
							'woocommerce_checkout_privacy_policy_text',
							'text'
						) }
					/>
				</Grid>
			</WizardsSection>
			<div className="newspack-buttons-card">
				<Button variant="primary" onClick={ () => saveConfig( config ) }>
					{ __( 'Save Settings', 'newspack-plugin' ) }
				</Button>
			</div>
		</WizardsTab>
	);
} );
