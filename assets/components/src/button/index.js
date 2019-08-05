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
		const isCentered = classes.indexOf( 'is-centered' ) > -1; // TODO: Replace with a prop
		const renderedButton = <BaseComponent className={ classes } { ...otherProps } />;
		return isCentered ? (
			<div className="muriel-button-is-centered-wrapper">{ renderedButton }</div>
		) : (
			renderedButton
		);
	}
}

export default Button;
