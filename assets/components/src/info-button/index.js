/**
 * Info Button
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Tooltip, SVG, Path } from '@wordpress/components';

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
		const infoIcon = (
			<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
			</SVG>
		);
		return (
			<Tooltip { ...otherProps }>
				<div className={ classnames( 'newspack-info-button', className ) }>{ infoIcon }</div>
			</Tooltip>
		);
	}
}

export default InfoButton;
