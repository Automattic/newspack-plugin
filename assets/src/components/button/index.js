/**
 * Muriel-styled buttons.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Button as BaseComponent } from '@wordpress/components';

import classnames from 'classnames';

import './style.scss';

class Button extends Component {

	/**
	 * Render.
	 */
	render( props ) {
		const { value } = this.props;
		return (
			<BaseComponent className={ classnames( 'muriel-button', this.props.className ) } { ...this.props } />
		);
	}
}

export default Button;
