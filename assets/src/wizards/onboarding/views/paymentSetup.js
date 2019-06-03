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
	Card,
	FormattedHeader,
	Button,
	TextControl,
	SelectControl,
	CheckboxControl,
	InfoButton,
} from '../../../components';

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
			<div className="newspack-payment-setup-screen">
				<FormattedHeader
					headerText={ __( 'Set up Stripe' ) }
					subHeaderText={ __( 'Stripe is the recommended gateway for accepting payments' ) }
				/>
				<Card>
					<ToggleControl
						label={ __( 'Enable Stripe' ) }
						checked={ enabled }
						onChange={ value => this.handleOnChange( 'enabled', value ) }
					/>
					{ enabled && (
						<Fragment>
							<h3 className="newspack-payment-setup-screen__settings-heading">
								{ __( 'Stripe settings' ) }
							</h3>
							<CheckboxControl
								label={ __( 'Use Stripe in test mode' ) }
								checked={ testMode }
								onChange={ value => this.handleOnChange( 'testMode', value ) }
								tooltip="Test mode will not capture real payments. Use it for testing your purchase flow."
							/>
							<div className="newspack-payment-setup-screen__api-keys-heading">
								<h4 class="newspack-payment-setup-screen__api-heading">
									{ __( 'Get your API keys from your Stripe account' ) }
								</h4>
								{ testMode && (
									<Fragment>
										<TextControl
											type="password"
											value={ testPublishableKey }
											label={ __( 'Test Publishable Key' ) }
											onChange={ value => this.handleOnChange( 'testPublishableKey', value ) }
										/>
										<TextControl
											type="password"
											value={ testSecretKey }
											label={ __( 'Test Secret Key' ) }
											onChange={ value => this.handleOnChange( 'testSecretKey', value ) }
										/>
									</Fragment>
								) }
								{ ! testMode && (
									<Fragment>
										<TextControl
											type="password"
											value={ publishableKey }
											label={ __( 'Publishable Key' ) }
											onChange={ value => this.handleOnChange( 'publishableKey', value ) }
										/>
										<TextControl
											type="password"
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
						<em>
							{ __(
								'Other gateways can be enabled and set up in the WooCommerce payment gateway settings.'
							) }
						</em>
					) }
					<Button isPrimary className="is-centered" onClick={ () => onClickFinish() }>
						{ __( 'Finish' ) }
					</Button>
					<Button
						className="isLink is-centered is-tertiary"
						href="#"
						onClick={ () => onClickCancel() }
					>
						{ __( 'Cancel' ) }
					</Button>
				</Card>
			</div>
		);
	}
}

export default PaymentSetup;
