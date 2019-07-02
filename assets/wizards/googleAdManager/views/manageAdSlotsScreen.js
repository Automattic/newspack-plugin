/**
 * Ad Manager Ad Unit Management Screens.
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
	withWizardScreen,
} from '../../../components/src';

/**
 * Advertising management screen.
 */
class ManageAdUnitsScreen extends Component {
	/**
	 * Render.
	 */
	render() {
		const {
			adUnits,
			onClickDeleteAdUnit,
		} = this.props;

		return (
			<div className="newspack-manage-ad-units-screen">
				{ adUnits.map( adUnit => {
					const { id, name, code } = adUnit;
					return (
						<ActionCard
							key={ id }
							title={ name }
							actionText={ __( 'Edit' ) }
							href={ `#edit/${ id }` }
							secondaryActionText={ __( 'Delete' ) }
							onSecondaryActionClick={ () => onClickDeleteAdUnit( adUnit ) }
						/>
					);
				} ) }
			</div>
		);
	}
}

export default withWizardScreen( ManageAdUnitsScreen );
