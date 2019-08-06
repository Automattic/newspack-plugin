/**
 * Stripe Setup Screen
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { ExternalLink, ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { CheckboxControl, TextControl, withWizardScreen } from '../../../../components/src';
import './style.scss';

/**
 * Stripe Setup Screen Component
 */
class StripeSetup extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange } = this.props;
		const {
			enabled = false,
			testMode = false,
			publishableKey = '',
			secretKey = '',
			testPublishableKey = '',
			testSecretKey = '',
		} = data;
		return (
			<div className="newspack-payment-setup-screen">
				<ToggleControl
					label={ __( 'Enable Stripe' ) }
					checked={ enabled }
					onChange={ enabled => onChange( { ...data, enabled } ) }
				/>
				{ enabled && (
					<Fragment>
						<h3 className="newspack-payment-setup-screen__settings-heading">
							{ __( 'Stripe settings' ) }
						</h3>
						<CheckboxControl
							label={ __( 'Use Stripe in test mode' ) }
							checked={ testMode }
							onChange={ testMode => onChange( { ...data, testMode } ) }
							tooltip="Test mode will not capture real payments. Use it for testing your purchase flow."
						/>
						<div className="newspack-payment-setup-screen__api-keys-heading">
							<h4 className="newspack-payment-setup-screen__api-keys-instruction">
								{ __( 'Get your API keys from your Stripe account' ) }
							</h4>
							<p className="newspack-payment-setup-screen__api-tip">
								<ExternalLink href="https://stripe.com/docs/keys#api-keys">
									{ __( 'Learn how' ) }
								</ExternalLink>
							</p>

							{ testMode && (
								<Fragment>
									<TextControl
										type="password"
										value={ testPublishableKey }
										label={ __( 'Test Publishable Key' ) }
										onChange={ testPublishableKey => onChange( { ...data, testPublishableKey } ) }
									/>
									<TextControl
										type="password"
										value={ testSecretKey }
										label={ __( 'Test Secret Key' ) }
										onChange={ testSecretKey => onChange( { ...data, testSecretKey } ) }
									/>
								</Fragment>
							) }
							{ ! testMode && (
								<Fragment>
									<TextControl
										type="password"
										value={ publishableKey }
										label={ __( 'Publishable Key' ) }
										onChange={ publishableKey => onChange( { ...data, publishableKey } ) }
									/>
									<TextControl
										type="password"
										value={ secretKey }
										label={ __( 'Secret Key' ) }
										onChange={ secretKey => onChange( { ...data, secretKey } ) }
									/>
								</Fragment>
							) }
						</div>
					</Fragment>
				) }
				{ ! enabled && (
					<p className="newspack-payment-setup-screen__info">
						{ __(
							'Other gateways can be enabled and set up in the WooCommerce payment gateway settings.'
						) }
					</p>
				) }
			</div>
		);
	}
}

StripeSetup.defaultProps = {
	data: {},
	onChange: () => null,
};

export default withWizardScreen( StripeSetup );
