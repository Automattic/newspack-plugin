/**
 * Subscriptions Wizard.
 */

/**
 * WordPress dependencies
 */
import { Component, render } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ManageSubscriptionsScreen from './views/manageSubscriptionsScreen';
import EditSubscriptionScreen from './views/editSubscriptionScreen';
import './style.scss';

/**
 * Subscriptions wizard for managing and setting up subscriptions.
 */
class SubscriptionsWizard extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			subscriptions: [],
			editing: false,
			choosePrice: false,
		};
	}

	/**
	 * Get info when wizard is first loaded.
	 */
	componentDidMount() {
		this.refreshSubscriptions();
		this.refreshChoosePrice();
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
	 * Save the fields to a susbcription.
	 */
	saveSubscription( subscription ) {
		const { id, name, image, price, frequency } = subscription;
		const image_id = image ? image.id : 0;

		apiFetch( {
			path: '/newspack/v1/wizard/subscriptions',
			method: 'post',
			data: {
				id: id,
				name: name,
				image_id: image_id,
				price: price,
				frequency: frequency,
			},
		} ).then( response => {
			this.setState( {
				editing: false,
			} );
			this.refreshSubscriptions();
		} );
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
	 * Get the latest info about the choosePrice setting.
	 */
	refreshChoosePrice() {
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
	 * Render.
	 */
	render() {
		const { subscriptions, editing, choosePrice } = this.state;

		if ( !! editing ) {
			return (
				<EditSubscriptionScreen
					subscription={ editing }
					onChange={ subscription => { this.setState( { editing: subscription } ); } }
					onClickSave={ subscription => this.saveSubscription( subscription ) }
					onClickCancel={ () => this.setState( { editing: false } ) }
				/>
			);
		} else {
			return (
				<ManageSubscriptionsScreen
					subscriptions={ subscriptions }
					choosePrice={ choosePrice }
					onClickEditSubscription={ subscription => this.setState( { editing: subscription } ) }
					onClickDeleteSubscription={ subscription => this.deleteSubscription( subscription.id ) }
					onClickChoosePrice={ () => this.toggleChoosePrice() }
				/>
			);
		}
	}
}

render( <SubscriptionsWizard />, document.getElementById( 'newspack-subscriptions-wizard' ) );
