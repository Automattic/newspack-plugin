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
import './style.scss';

class InfoButton extends Component {

	/**
	 * Render.
	 */
	render() {
		return <Tooltip { ...this.props }><div className="muriel-info-button" /></Tooltip>
	}
}

export default InfoButton;
