/**
 * Muriel-styled Info Button with Tooltip.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Tooltip } from '@wordpress/components';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

class InfoButton extends Component {

	/**
	 * Render.
	 */
	render() {
		const { className, ...otherProps } = this.props;
		return <Tooltip { ...otherProps }><div className={ classnames( 'muriel-info-button', className ) } /></Tooltip>
	}
}

export default InfoButton;
