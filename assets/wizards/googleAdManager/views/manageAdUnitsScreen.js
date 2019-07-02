/**
 * Ad Manager Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
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
			<Fragment>
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
			</Fragment>
		);
	}
}

export default withWizardScreen( ManageAdUnitsScreen );
