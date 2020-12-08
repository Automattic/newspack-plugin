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
		const { className, buttonsCard, ...otherProps } = this.props;
		const classes = classNames(
			'newspack-card',
			className,
			buttonsCard && 'newspack-card__buttons-card'
		);
		return <div className={ classes } { ...otherProps } />;
	}
}

export default Card;
