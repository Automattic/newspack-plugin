/**
 * Muriel-styled buttons.
 */

/**
 * Internal dependencies.
 */
 import { murielClassNames } from '../shared/js/muriel-classnames';

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
		const { classNames } = this.props;
		return <BaseComponent { ...this.props } className={ murielClassNames( 'muriel-button', this.props.className ) }  />;
	}
}

export default Button;
