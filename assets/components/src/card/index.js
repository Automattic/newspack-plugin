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
		const { className, noBackground, wideLayout, ...otherProps } = this.props;
		const classes = murielClassnames(
			'muriel-card',
			className,
			noBackground && 'muriel-card__no-background',
			wideLayout && 'muriel-card__wide-layout'
		);
		return <div className={ classes } { ...otherProps } />;
	}
}

export default Card;
