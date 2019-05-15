/**
 * Subscription Card.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import Card from '../../../components/card';

/**
 * Details about one subscription.
 */
class SubscriptionCard extends Component {

	/**
	 * Render the card.
	 */
	render() {
		const { subscription } = this.props;
		const { id, image, name, price, url } = subscription;

		return (
			<Card className='newspack-manage-subscriptions-screen__subscription-card'>
				<a href={ url } target="_blank">
					<img src={ image } />
				</a>
				<div className='newspack-manage-subscriptions-screen__subscription-card__product-info'>
					<div className='product-name'>{ name }</div>
					<div className='product-price'>{ price }</div>
				</div>
				<div className='newspack-manage-subscriptions-screen__subscription-card__product-actions'>
					<a className='edit-subscription' href='#edittodo'>{ __( 'Edit' ) }</a>
					<a className='delete-subscription' href='#deletetodo'>{ __( 'Delete' ) }</a>
				</div>
			</Card>
		);
	}
}

export default SubscriptionCard;
