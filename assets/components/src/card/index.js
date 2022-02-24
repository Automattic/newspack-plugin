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
		const {
			buttonsCard,
			className,
			headerActions,
			isLarge,
			isMedium,
			isNarrow,
			isSmall,
			isWhite,
			noBorder,
			...otherProps
		} = this.props;
		const classes = classNames(
			'newspack-card',
			className,
			buttonsCard && 'newspack-card__buttons-card',
			headerActions && 'newspack-card__header-actions',
			isLarge && 'newspack-card__is-large',
			isMedium && 'newspack-card__is-medium',
			isNarrow && 'newspack-card__is-narrow',
			isSmall && 'newspack-card__is-small',
			isWhite && 'newspack-card__is-white',
			noBorder && 'newspack-card__no-border'
		);
		return <div className={ classes } { ...otherProps } />;
	}
}

export default Card;
