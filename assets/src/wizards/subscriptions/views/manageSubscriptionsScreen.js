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
			choosePrice: false,
		};
	}

	/**
	 * Populate the screen with the latest info when loaded.
	 */
	componentDidMount() {
		this.refreshSubscriptions();

		apiFetch( { path: '/newspack/v1/wizard/subscriptions/choose-price' } ).then( choosePrice => {
			this.setState( {
				choosePrice: !! choosePrice,
			} );
		} );
	}

	/**
	 * Enable/Disable Name-Your-Price for Newspack subscriptions.
	 */
	toggleChoosePrice() {
		this.setState(
			{
				choosePrice: ! this.state.choosePrice,
			},
			() => {
				apiFetch( {
					path: '/newspack/v1/wizard/subscriptions/choose-price',
					method: 'post',
					data: {
						enabled: this.state.choosePrice,
					},
				} ).then( response => {
					this.refreshSubscriptions();
				} );
			}
		);
	}

	/**
	 * Delete a subscription.
	 *
	 * @param int id Subscription ID.
	 */
	deleteSubscription( id ) {
		if ( confirm( __( 'Are you sure you want to delete this subscription?' ) ) ) {
			apiFetch( {
				path: '/newspack/v1/wizard/subscriptions/' + id,
				method: 'delete',
			} ).then( response => {
				this.refreshSubscriptions();
			} );
		}
	}

	/**
	 * Get the latest subscriptions info.
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
		const { subscriptions, choosePrice } = this.state;
		const headerText = subscriptions.length
			? __( 'Any more subscriptions to add?' )
			: __( 'Add your first subscription' );
		const buttonText = subscriptions.length
			? __( 'Add another subscription' )
			: __( 'Add a subscription' );

		return (
			<div className="newspack-manage-subscriptions-screen">
				<FormattedHeader
					headerText={ headerText }
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
								<a
									className="delete-subscription"
									href="#"
									onClick={ () => this.deleteSubscription( id ) }
								>
									{ __( 'Delete' ) }
								</a>
							</div>
						</Card>
					);
				} ) }
				{ !! subscriptions.length && (
					<CheckboxControl
						className='newspack-manage-subscriptions-screen__choose-price'
						label={ __( 'Allow members to specify donation amount' ) }
						onChange={ () => this.toggleChoosePrice() }
						tooltip={ __(
							'Enabling this makes the subscription price a "Recommended price" and allows subscribers to set the subscription price when purchasing.'
						) }
						help={ __( 'Mostly used for donations' ) }
						checked={ choosePrice }
					/>
				) }
				<Button
					isPrimary
					className="is-centered"
					onClick={ () => changeScreen( EditSubscriptionScreen ) }
				>
					{ buttonText }
				</Button>
				<a
					className="newspack-manage-subscriptions-screen__finished is-centered"
					href="#linktochecklisthere"
				>
					{ __( "I'm done adding" ) }
				</a>
			</div>
		);
	}
}

export default ManageSubscriptionsScreen;
