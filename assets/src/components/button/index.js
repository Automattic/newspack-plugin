/**
 * Muriel-styled buttons.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Button } from '@wordpress/components';

import './style.scss';

class NewspackButton extends Component {

	/**
	 * Render.
	 */
	render( props ) {
		const { value } = this.props;
		return (
			<div className="newspack-button">
				<Button { ...this.props } >
					{ value }
				</Button>
			</div>
		);
	}
}

export default NewspackButton;
