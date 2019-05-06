/**
 * Muriel-styled Info Button with Tooltip.
 */

/**
 * WordPress dependencies
 */
import { Tooltip } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

class InfoButton extends Tooltip {

	/**
	 * Render.
	 */
	render() {
		return <Tooltip { ...this.props }><div className="newspack-info-button" /></Tooltip>
	}
}

export default InfoButton;
