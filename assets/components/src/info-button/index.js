/**
 * Info Button
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Tooltip } from '@wordpress/components';
import { Icon, info } from '@wordpress/icons';

/**
 * External dependencies.
 */
import classnames from 'classnames';

/**
 * Internal dependencies.
 */
import './style.scss';

class InfoButton extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, ...otherProps } = this.props;
		return (
			<Tooltip { ...otherProps }>
				<div className={ classnames( 'newspack-info-button', className ) }>
					<Icon icon={ info } />
				</div>
			</Tooltip>
		);
	}
}

export default InfoButton;
