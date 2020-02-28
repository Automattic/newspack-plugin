/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { withWizardScreen, Waiting } from '../../../../components/src';
import './style.scss';

/**
 * Loading screen.
 */
class Loading extends Component {
	render() {
		return (
			<div className="newspack_support_loading">
				<Waiting />
			</div>
		);
	}
}
export default withWizardScreen( Loading );
