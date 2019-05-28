/**
 * Muriel-styled buttons.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Button as BaseComponent } from '@wordpress/components';

/**
 * Internal dependencies
 */
import murielClassnames from '../../../shared/js/muriel-classnames';

import './style.scss';

class Button extends Component {

	/**
	 * Render.
	 */
	render( props ) {
		const { className, ...otherProps } = this.props;
		const classes = murielClassnames( 'muriel-button', className );
		return (
			<BaseComponent className={ classes } { ...otherProps } />
		);
	}
}

export default Button;
