/**
 * Muriel-styled buttons.
 */

/**
 * WordPress dependencies.
 */
import { Component } from '@wordpress/element';
import { Button } from '@wordpress/components';

class NewspackButton extends Component {

	/**
	 * Render.
	 */
	render() {
		return (
			<div className="newspack-button">
				<Button { ...this.props } >
					<label>Continue</label>
				</Button>
			</div>
		);
	}
}

export default NewspackButton;
