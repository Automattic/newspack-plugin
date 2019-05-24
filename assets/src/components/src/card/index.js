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
import murielClassnames from '../../../shared/js/muriel-classnames';

/**
 * Internal dependencies
 */
import './style.scss';

class Card extends Component {
	/**
	 * Render.
	 */
	render() {
		const { className, ...otherProps } = this.props;
		const classes = murielClassnames( 'muriel-card', className );
		return <div className={ classes } { ...otherProps } />
	}
}

export default Card;
