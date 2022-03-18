/**
 * Add-ons view
 */

/**
 * Internal dependencies
 */
import { withWizardScreen } from '../../../../components/src';
import AddOns from '../../components/add-ons';

function AddOnsView() {
	return <AddOns />;
}

export default withWizardScreen( AddOnsView );
