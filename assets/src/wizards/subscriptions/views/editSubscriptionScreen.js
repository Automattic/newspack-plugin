/**
 * New/Edit Subscription Screen.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import Card from '../../../components/card';
import FormattedHeader from '../../../components/formattedHeader';
import Button from '../../../components/button';
import TextControl from '../../../components/textControl';
import ImageUpload from '../../../components/imageUpload';
import SelectControl from '../../../components/selectControl';
import ManageSubscriptionsScreen from './manageSubscriptionsScreen';

/**
 * New/Edit Subscription Screen.
 */
class EditSubscriptionScreen extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			name: '',
			image: null,
			price: '',
			frequency: 'month',
		};
	}

	componentDidMount() {
		const { subscriptionID } = this.props;

		if ( !! subscriptionID ) {
			apiFetch( { path: '/newspack/v1/wizard/subscriptions/' + subscriptionID } ).then(
				subscription => {
					this.setState( { ...subscription } );
				}
			);
		}
	}

	saveSubscription() {
		const { subscriptionID } = this.props;

		apiFetch( {
			path: '/newspack/v1/wizard/subscriptions',
			method: 'post',
			data: {
				id: subscriptionID ? subscriptionID : 0,
				name: this.state.name,
				image_id: this.state.image ? this.state.image.id : 0,
				price: this.state.price,
				frequency: this.state.frequency,
			},
		} ).then( response => {
			this.props.changeScreen( ManageSubscriptionsScreen );
		} );
	}

	/**
	 * Render.
	 */
	render() {
		const { name, price, frequency } = this.state;
		const { subscriptionID, changeScreen } = this.props;
		const editing_existing_subscription = !! subscriptionID;
		const heading = editing_existing_subscription
			? __( 'Edit subscription' )
			: __( 'Add a subscription' );
		const subHeading = editing_existing_subscription
			? __( 'You are editing an existing subscription' )
			: __( 'You are adding a new subscription' );
		let { image } = this.state;
		if ( ! image || '0' === image.id ) {
			image = null;
		}

		return (
			<div className="newspack-edit-subscription-screen">
				<FormattedHeader headerText={ heading } subHeaderText={ subHeading } />
				<Card>
					<TextControl
						label={ __( 'What is this product called? e.g. Valued Donor' ) }
						value={ name }
						onChange={ value => this.setState( { name: value } ) }
					/>
					<ImageUpload image={ image } onChange={ value => this.setState( { image: value } ) } />
					<TextControl
						type="number"
						step="0.01"
						label={ __( 'Price' ) }
						value={ price }
						onChange={ value => this.setState( { price: value } ) }
					/>
					<SelectControl
						label={ __( 'Frequency' ) }
						value={ frequency }
						options={ [
							{ value: 'month', label: __( 'per month' ) },
							{ value: 'year', label: __( 'per year' ) },
							{ value: 'once', label: __( 'once' ) },
						] }
						onChange={ value => this.setState( { frequency: value } ) }
					/>
					<Button isPrimary className="is-centered" onClick={ () => this.saveSubscription() }>
						{ __( 'Save' ) }
					</Button>
					<a
						className="newspack-edit-subscription-screen__cancel"
						href="#"
						onClick={ () => changeScreen( ManageSubscriptionsScreen ) }
					>
						{ __( 'Cancel' ) }
					</a>
				</Card>
			</div>
		);
	}
}

export default EditSubscriptionScreen;
