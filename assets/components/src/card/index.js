/**
 * Card
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classNames from 'classnames';

class Card extends Component {
	/**
	 * Render
	 */
	render() {
		const { buttonsCard, className, cptHeader, isSmall, noBorder, ...otherProps } = this.props;
		const classes = classNames(
			'newspack-card',
			className,
			buttonsCard && 'newspack-card__buttons-card',
			cptHeader && 'newspack-card__cpt-header',
			isSmall && 'newspack-card__is-small',
			noBorder && 'newspack-card__no-border'
		);
		return <div className={ classes } { ...otherProps } />;
	}
}

export default Card;
