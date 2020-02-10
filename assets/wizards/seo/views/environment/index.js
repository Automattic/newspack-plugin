/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { withWizardScreen, ToggleControl } from '../../../../components/src';

/**
 * SEO Environment screen.
 */
class Environment extends Component {
	/**
	 * Render.
	 */
	render() {
		const { data, onChange } = this.props;
		const { underConstruction } = data;
		return (
			<Fragment>
				<h2>Environment</h2>
				<ToggleControl
					label={ __( 'Site under constructions', 'newspack' ) }
					checked={ underConstruction }
					onChange={ value => onChange( { underConstruction: value } ) }
				/>
			</Fragment>
		);
	}
}
Environment.defaultProps = {
	data: {},
};

export default withWizardScreen( Environment );
