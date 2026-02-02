/**
 * Button Card
 */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Grid } from '../';
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
		const {
			borderRadius, // 'none' (0px) | 'large' (8px) - default is 2px
			chevron,
			className,
			desc,
			grouped,
			icon,
			iconBackgroundColor,
			isDestructive,
			isPressed,
			isSmall,
			title,
			...otherProps
		} = this.props;
		const classes = classnames(
			'newspack-button-card',
			borderRadius && `border-radius--${ borderRadius }`,
			className,
			chevron && 'has-chevron',
			grouped && 'grouped',
			icon && 'has-icon',
			iconBackgroundColor && 'has-icon-background-color',
			isDestructive && 'is-destructive',
			isPressed && 'is-pressed',
			isSmall && 'is-small'
		);

		return (
			<a className={ classes } { ...otherProps }>
				{ icon && (
					<div className="newspack-button-card__icon">
						<Icon icon={ icon } height={ 48 } width={ 48 } />
					</div>
				) }
				<Grid noMargin columns={ 1 } gutter={ 8 }>
					{ title && <h3>{ title }</h3> }
					{ desc && <p>{ desc }</p> }
				</Grid>
				{ chevron && <Icon icon={ chevronRight } height={ 24 } width={ 24 } /> }
			</a>
		);
	}
}

export default ButtonCard;
