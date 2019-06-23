/**
 * New/Edit Subscription Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Card,
	FormattedHeader,
	Button,
	TextControl,
	ImageUpload,
	SelectControl,
	withWizardScreen,
} from '../../../components/src';

/**
 * New/Edit Subscription Screen.
 */
class EditSubscriptionScreen extends Component {
	/**
	 * Handle an update to a subscription field.
	 *
	 * @param string key Subscription field
	 * @param mixed  value New value for field
	 *
	 */
	handleOnChange( key, value ) {
		const { subscription, onChange } = this.props;
		subscription[ key ] = value;
		onChange( subscription );
	}

	/**
	 * Render.
	 */
	render() {
		const { subscription, onClickSave } = this.props;
		const { id, name, price, frequency } = subscription;
		let { image } = subscription;
		if ( ! image || '0' === image.id ) {
			image = null;
		}

		const editing_existing_subscription = !! id;
		const heading = editing_existing_subscription
			? __( 'Edit subscription' )
			: __( 'Add a subscription' );
		const subHeading = editing_existing_subscription
			? __( 'You are editing an existing subscription' )
			: __( 'You are adding a new subscription' );

		return (
			<div className="newspack-edit-subscription-screen">
				<FormattedHeader headerText={ heading } subHeaderText={ subHeading } />
				<Card>
					<TextControl
						label={ __( 'What is this product called? e.g. Valued Donor' ) }
						value={ name }
						onChange={ value => this.handleOnChange( 'name', value ) }
					/>
					<ImageUpload
						image={ image }
						onChange={ value => this.handleOnChange( 'image', value ) }
					/>
					<div className="newspack-edit-subscription-screen__price-settings">
						<TextControl
							type="number"
							step="0.01"
							label={ __( 'Price' ) }
							value={ price }
							onChange={ value => this.handleOnChange( 'price', value ) }
						/>
						<SelectControl
							label={ __( 'Frequency' ) }
							value={ frequency }
							options={ [
								{ value: 'month', label: __( 'per month' ) },
								{ value: 'year', label: __( 'per year' ) },
								{ value: 'once', label: __( 'once' ) },
							] }
							onChange={ value => this.handleOnChange( 'frequency', value ) }
						/>
					</div>
					<Button isPrimary className="is-centered" onClick={ () => onClickSave( subscription ) }>
						{ __( 'Save' ) }
					</Button>
					<Button
						className="newspack-edit-subscription-screen__cancel isLink is-centered is-tertiary"
						href="#/"
					>
						{ __( 'Cancel' ) }
					</Button>
				</Card>
			</div>
		);
	}
}

export default withWizardScreen( EditSubscriptionScreen );
