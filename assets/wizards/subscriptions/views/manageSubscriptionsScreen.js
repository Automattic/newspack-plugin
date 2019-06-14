/**
 * Subscription Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, CheckboxControl } from '../../../components/src';

/**
 * Subscriptions management screen.
 */
class ManageSubscriptionsScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const {
			subscriptions,
			choosePrice,
			onClickEditSubscription,
			onClickDeleteSubscription,
			onClickChoosePrice,
		} = this.props;

		return (
			<div className="newspack-manage-subscriptions-screen">
				{ subscriptions.map( subscription => {
					const { id, image, name, display_price, url } = subscription;

					return (
						<ActionCard
							key={ id }
							imageLink={ url }
							image={ image.url }
							title={ name }
							description={ display_price }
							actionText={ __( 'Edit' ) }
							onClick={ () => onClickEditSubscription( subscription ) }
							secondaryActionText={ __( 'Delete' ) }
							onSecondaryActionClick={ () => onClickDeleteSubscription( subscription ) }
						/>
					);
				} ) }
				{ !! subscriptions.length && (
					<CheckboxControl
						className="newspack-manage-subscriptions-screen__choose-price"
						label={ __( 'Allow members to specify donation amount' ) }
						onChange={ () => onClickChoosePrice() }
						tooltip={ __(
							'Enabling this makes the subscription price a "Recommended price" and allows subscribers to set the subscription price when purchasing.'
						) }
						help={ __( 'Mostly used for donations' ) }
						checked={ choosePrice }
					/>
				) }
			</div>
		);
	}
}

export default ManageSubscriptionsScreen;
