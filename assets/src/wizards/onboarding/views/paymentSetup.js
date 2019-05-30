/**
 * Location setup Screen.
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

class PaymentSetup extends Component {
	handleOnChange( key, value ) {
		const { stripeSettings, onChange } = this.props;
		stripeSettings[ key ] = value;
		onChange( stripeSettings );
	}

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
							<CheckboxControl
								label={ __( 'Use Stripe in test mode' ) }
								checked={ testMode }
								onChange={ value => this.handleOnChange( 'testMode', value ) }
								tooltip='Test mode will not capture real payments. Use it for testing your purchase flow.'
							/>
							<div className='newspack-payment-setup-screen__api-keys'>
								<h3>{ __( 'API keys' ) }</h3>
								<h4>{ __( 'Get your API keys from your Stripe account') }</h4>
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
					<Button isPrimary className='is-centered' onClick={ () => onClickFinish() }>
						{ __( 'Finish' ) }
					</Button>
					<Button
						className='isLink is-centered is-tertiary'
						href='#'
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
