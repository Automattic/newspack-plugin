/**
 * Muriel-styled Checkbox.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { CheckboxControl as BaseComponent } from '@wordpress/components';

/**
 * Internal dependencies
 */
import murielClassnames from '../../shared/js/muriel-classnames';
import InfoButton from '../../components/infoButton';
import './style.scss';

class CheckboxControl extends Component {

	/**
	 * Render.
	 */
	render() {
		const { className, tooltip, ...otherProps } = this.props;
		const classes = murielClassnames( 'muriel-checkbox', className );
		return (
			<div className={ classes }>
				<BaseComponent { ...otherProps } />
				{ tooltip && <InfoButton text={ tooltip } /> }
			</div>
		);
	}
}

export default CheckboxControl;
