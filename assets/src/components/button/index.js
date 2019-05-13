/**
 * Muriel-styled buttons.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Button as BaseComponent } from '@wordpress/components';

import './style.scss';

class Button extends Component {

	/**
	 * Render.
	 */
	render( props ) {
		const { value } = this.props;
		return <BaseComponent className="muriel-button" { ...this.props } />;
	}
}

export default Button;
