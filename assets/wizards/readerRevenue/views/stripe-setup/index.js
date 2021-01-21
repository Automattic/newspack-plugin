/**
 * Stripe Setup Screen
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, Fragment } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	Card,
	CheckboxControl,
	Grid,
	TextControl,
	ToggleControl,
	withWizardScreen,
} from '../../../../components/src';

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
			<Fragment>
				<Grid>
					<ToggleControl
						label={ __( 'Enable Stripe' ) }
						checked={ enabled }
						onChange={ _enabled => onChange( { ...data, enabled: _enabled } ) }
					/>
				</Grid>
				{ enabled && (
					<Fragment>
						<Grid>
							<Card noBorder>
								<p className="newspack-payment-setup-screen__api-keys-instruction">
									{ __( 'Get your API keys from your Stripe account.' ) }{' '}
									<ExternalLink href="https://stripe.com/docs/keys#api-keys">
										{ __( 'Learn how' ) }
									</ExternalLink>
								</p>
								<CheckboxControl
									label={ __( 'Use Stripe in test mode' ) }
									checked={ testMode }
									onChange={ _testMode => onChange( { ...data, testMode: _testMode } ) }
									tooltip="Test mode will not capture real payments. Use it for testing your purchase flow."
								/>
							</Card>
						</Grid>
						<Grid>
							{ testMode && (
								<Fragment>
									<TextControl
										type="password"
										value={ testPublishableKey }
										label={ __( 'Test Publishable Key' ) }
										onChange={ _testPublishableKey =>
											onChange( { ...data, testPublishableKey: _testPublishableKey } )
										}
									/>
									<TextControl
										type="password"
										value={ testSecretKey }
										label={ __( 'Test Secret Key' ) }
										onChange={ _testSecretKey =>
											onChange( { ...data, testSecretKey: _testSecretKey } )
										}
									/>
								</Fragment>
							) }
							{ ! testMode && (
								<Fragment>
									<TextControl
										type="password"
										value={ publishableKey }
										label={ __( 'Publishable Key' ) }
										onChange={ _publishableKey =>
											onChange( { ...data, publishableKey: _publishableKey } )
										}
									/>
									<TextControl
										type="password"
										value={ secretKey }
										label={ __( 'Secret Key' ) }
										onChange={ _secretKey => onChange( { ...data, secretKey: _secretKey } ) }
									/>
								</Fragment>
							) }
						</Grid>
					</Fragment>
				) }
				{ ! enabled && (
					<Grid>
						<p className="newspack-payment-setup-screen__info">
							{ __( 'Other gateways can be enabled and set up in the ' ) }
							<ExternalLink href="/wp-admin/admin.php?page=wc-settings&tab=checkout">
								{ __( 'WooCommerce payment gateway settings' ) }
							</ExternalLink>
						</p>
					</Grid>
				) }
			</Fragment>
		);
	}
}

StripeSetup.defaultProps = {
	data: {},
	onChange: () => null,
};

export default withWizardScreen( StripeSetup );
