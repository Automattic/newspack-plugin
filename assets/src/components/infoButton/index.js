/**
 * Muriel-styled Info Button with Tooltip.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Tooltip } from '@wordpress/components';

/**
 * Internal dependencies
 */
import murielClassnames from '../../shared/js/muriel-classnames';
import './style.scss';

class InfoButton extends Component {

	/**
	 * Render.
	 */
	render() {
		const { className, ...otherProps } = this.props;
		return <Tooltip { ...otherProps }><div className={ murielClassnames( 'muriel-info-button', className ) } /></Tooltip>
	}
}

export default InfoButton;
