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
		return (
			<div className="muriel-button">
				<BaseComponent { ...this.props } />
			</div>
		);
	}
}

export default Button;
