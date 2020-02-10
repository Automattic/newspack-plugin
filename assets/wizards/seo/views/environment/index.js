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
		const { data, onEnvironmentChange } = this.props;
		const { underConstruction } = data;
		return (
			<Fragment>
				<h2>Environment</h2>
				<ToggleControl
					label={ __( 'Site under construction', 'newspack' ) }
					checked={ underConstruction }
					onChange={ value => onEnvironmentChange( value ) }
				/>
			</Fragment>
		);
	}
}
Environment.defaultProps = {
	data: {},
};

export default withWizardScreen( Environment );
