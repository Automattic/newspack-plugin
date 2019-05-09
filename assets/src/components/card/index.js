/**
 * Muriel-styled Card.
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

class Card extends Component {
	/**
	 * Render.
	 */
	render() {
		return <div className="muriel-card" { ...this.props } />
	}
}

export default Card;
