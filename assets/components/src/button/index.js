/**
 * Button
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Button as BaseComponent } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

class Button extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, isQuaternary, ...otherProps } = this.props;
		const classes = classnames( 'newspack-button', isQuaternary && 'is-quaternary', className );
		return <BaseComponent className={ classes } { ...otherProps } />;
	}
}

export default Button;
