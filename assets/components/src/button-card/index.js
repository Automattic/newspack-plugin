/**
 * Button Card
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

class ButtonCard extends Component {
	/**
	 * Render
	 */
	render() {
		const { className, desc, grouped, icon, isSmall, title, ...otherProps } = this.props;
		const classes = classnames(
			'newspack-button-card',
			className,
			grouped && 'grouped',
			icon && 'has-icon',
			isSmall && 'is-small'
		);

		return (
			<a className={ classes } { ...otherProps }>
				{ icon && <Icon icon={ icon } height={ 48 } width={ 48 } /> }
				<div>
					{ title && <div className="title">{ title }</div> }
					{ desc && <div className="desc">{ desc }</div> }
				</div>
			</a>
		);
	}
}

export default ButtonCard;
