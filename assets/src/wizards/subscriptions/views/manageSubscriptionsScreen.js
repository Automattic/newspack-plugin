/**
 * Subscription Management Screens.
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
import CheckboxControl from '../../../components/checkboxControl';
import Card from '../../../components/card';
import FormattedHeader from '../../../components/formattedHeader';
import Button from '../../../components/button';
import EditSubscriptionScreen from './editSubscriptionScreen';

/**
 * Subscriptions management screen.
 */
class ManageSubscriptionsScreen extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			subscriptions: [],
		};
	}

	/**
	 * Populate the screen with the latest info when loaded.
	 */
	componentDidMount() {
		this.refreshSubscriptions();
	}

	/**
	 * Get subscriptions info.
	 */
	refreshSubscriptions() {
		apiFetch( { path: '/newspack/v1/wizard/subscriptions' } ).then( subscriptions => {
			this.setState( {
				subscriptions: subscriptions,
			} );
		} );
	}

	/**
	 * Render.
	 */
	render() {
		const { changeScreen } = this.props;
		const { subscriptions } = this.state;

		return (
			<div className="newspack-manage-subscriptions-screen">
				<FormattedHeader
					headerText={ __( 'Any more subscriptions to add?' ) }
					subHeaderText={ __( 'Subscriptions can provide a stable, recurring source of revenue' ) }
				/>
				{ subscriptions.map( subscription => {
					const { id, image, name, display_price, url } = subscription;

					return (
						<Card className="newspack-manage-subscriptions-screen__subscription-card" key={ id }>
							<a href={ url } target="_blank">
								<img src={ image.url } />
							</a>
							<div className="newspack-manage-subscriptions-screen__subscription-card__product-info">
								<div className="product-name">{ name }</div>
								<div className="product-price">{ display_price }</div>
							</div>
							<div className="newspack-manage-subscriptions-screen__subscription-card__product-actions">
								<a
									className="edit-subscription"
									href="#"
									onClick={ () => changeScreen( EditSubscriptionScreen, { subscriptionID: id } ) }
								>
									{ __( 'Edit' ) }
								</a>
								<a className="delete-subscription" href="#deletetodo">
									{ __( 'Delete' ) }
								</a>
							</div>
						</Card>
					);
				} ) }
				<CheckboxControl
					label={ __( 'Allow members to name their price' ) }
					onChange={ function() {
						console.log( 'API REQUEST NOW' );
					} }
					tooltip={ __(
						'Enabling this makes the subscription price a "Recommended price" and allows subscribers to set the subscription price when purchasing.'
					) }
					help={ __( 'Mostly used for donations' ) }
				/>
				<Button
					isPrimary
					className="is-centered"
					onClick={ () => changeScreen( EditSubscriptionScreen ) }
				>
					{ __( 'Add another subscription' ) }
				</Button>
				<a className="newspack-manage-subscriptions-screen__finished" href="#linktochecklisthere">
					{ __( "I'm done adding" ) }
				</a>
			</div>
		);
	}
}

export default ManageSubscriptionsScreen;
