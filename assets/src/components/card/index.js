/**
 * Muriel-styled Card.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

class Card extends Component {
	/**
	 * Render.
	 */
	render() {
		return <div className="newspack-card" { ...this.props } />
	}
}

export default Card;
