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
import { ActionCard, Button, CheckboxControl, FormattedHeader } from '../../../components/src';

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
				<Button
					isPrimary
					className="is-centered"
					onClick={ () =>
						onClickEditSubscription( {
							id: 0,
							name: '',
							image: null,
							price: '',
							frequency: 'month',
						} )
					}
				>
					{ buttonText }
				</Button>
				<Button
					className='is-centered'
					isTertiary
					href={ newspack_urls['checklists']['memberships'] }
				>
					{ __( "I'm done adding" ) }
				</Button>
			</div>
		);
	}
}

export default ManageSubscriptionsScreen;
