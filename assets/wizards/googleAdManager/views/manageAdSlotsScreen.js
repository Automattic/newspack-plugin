/**
 * Ad Manager Ad Slot Management Screens.
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
	ActionCard,
	CheckboxControl,
	withWizardScreen,
} from '../../../components/src';

/**
 * Subscriptions management screen.
 */
class ManageAdSlotsScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const {
			adSlots,
			onClickDeleteAdSlot,
		} = this.props;

		return (
			<div className="newspack-manage-ad-slots-screen">
				{ adSlots.map( adSlot => {
					const { id, name, code } = adSlot;
					return (
						<ActionCard
							key={ id }
							title={ name }
							actionText={ __( 'Edit' ) }
							href={ `#edit/${ id }` }
							secondaryActionText={ __( 'Delete' ) }
							onSecondaryActionClick={ () => onClickDeleteAdSlot( adSlot ) }
						/>
					);
				} ) }
			</div>
		);
	}
}

export default withWizardScreen( ManageAdSlotsScreen );
