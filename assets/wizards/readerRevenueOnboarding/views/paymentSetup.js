/**
 * Stripe setup Screen.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	TextControl,
	CheckboxControl,
	withWizardScreen,
} from '../../../components/src';

/**
 * Stripe setup.
 */
class PaymentSetup extends Component {
	/**
	 * Handle an update to a setting field.
	 *
	 * @param string key Setting field
	 * @param mixed  value New value for field
	 *
	 */
	handleOnChange( key, value ) {
		const { stripeSettings, onChange } = this.props;
		stripeSettings[ key ] = value;
		onChange( stripeSettings );
	}

	/**
	 * Render.
	 */
	render() {
		const { stripeSettings, onClickFinish, onClickCancel, onChange } = this.props;
		const {
			enabled,
			testMode,
			publishableKey,
			secretKey,
			testPublishableKey,
			testSecretKey,
		} = stripeSettings;

		return (
			<div className='newspack-payment-setup-screen'>
				<ToggleControl
					label={ __( 'Enable Stripe' ) }
					checked={ enabled }
					onChange={ value => this.handleOnChange( 'enabled', value ) }
				/>
				{ enabled && (
					<Fragment>
						<h3 className='newspack-payment-setup-screen__settings-heading'>
							{ __( 'Stripe settings' ) }
						</h3>
						<CheckboxControl
							label={ __( 'Use Stripe in test mode' ) }
							checked={ testMode }
							onChange={ value => this.handleOnChange( 'testMode', value ) }
							tooltip='Test mode will not capture real payments. Use it for testing your purchase flow.'
						/>
						<div className='newspack-payment-setup-screen__api-keys-heading'>
							<h4 className='newspack-payment-setup-screen__api-keys-instruction'>
								{ __( 'Get your API keys from your Stripe account' ) }
							</h4>
							<p className='newspack-payment-setup-screen__api-tip'>
								<a href='https://stripe.com/docs/keys#api-keys' target='_blank'>
									{ __( 'Learn how' ) }
								</a>
							</p>

							{ testMode && (
								<Fragment>
									<TextControl
										type='password'
										value={ testPublishableKey }
										label={ __( 'Test Publishable Key' ) }
										onChange={ value => this.handleOnChange( 'testPublishableKey', value ) }
									/>
									<TextControl
										type='password'
										value={ testSecretKey }
										label={ __( 'Test Secret Key' ) }
										onChange={ value => this.handleOnChange( 'testSecretKey', value ) }
									/>
								</Fragment>
							) }
							{ ! testMode && (
								<Fragment>
									<TextControl
										type='password'
										value={ publishableKey }
										label={ __( 'Publishable Key' ) }
										onChange={ value => this.handleOnChange( 'publishableKey', value ) }
									/>
									<TextControl
										type='password'
										value={ secretKey }
										label={ __( 'Secret Key' ) }
										onChange={ value => this.handleOnChange( 'secretKey', value ) }
									/>
								</Fragment>
							) }
						</div>
					</Fragment>
				) }
				{ ! enabled && (
					<p className='newspack-payment-setup-screen__info'>
						{ __(
							'Other gateways can be enabled and set up in the WooCommerce payment gateway settings.'
						) }
					</p>
				) }
			</div>
		);
	}
}

export default withWizardScreen( PaymentSetup );
