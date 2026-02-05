/**
 * Card using WP Core's Card component.
 * https://wordpress.github.io/gutenberg/?path=/docs/components-card--docs
 */

/**
 * WordPress dependencies
 */
import { Card as CardWrapper, CardBody, CardHeader, CardFooter } from '@wordpress/components';
import { Icon, chevronRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style-core.scss';

/**
 * External dependencies
 */
import classNames from 'classnames';

const CoreCard = ( {
	as,
	buttonsCard,
	chevron,
	className,
	footer,
	header,
	icon,
	iconBackgroundColor,
	isNarrow,
	isSmall,
	noBorder,
	children,
	...otherProps
} ) => {
	const classes = classNames(
		'newspack-card--core',
		className,
		( buttonsCard || as === 'a' ) && 'newspack-card--core__buttons-card',
		isNarrow && 'newspack-card--core__is-narrow',
		isSmall && 'newspack-card--core__is-small',
		icon && 'newspack-card--core__has-icon',
		iconBackgroundColor && 'newspack-card--core__has-icon-background-color'
	);
	let sizeProps = isSmall ? 'small' : otherProps.size;
	if ( buttonsCard || as === 'a' ) {
		if ( ! isSmall ) {
			sizeProps = 'large';
		}
		if ( as !== 'a' ) {
			otherProps.as = 'a'; // Render as an anchor tag.
		}
	}
	if ( noBorder ) {
		otherProps.isBorderless = true;
	}
	return (
		<CardWrapper as={ as } className={ classes } { ...otherProps }>
			{ ( header || icon ) && (
				<CardHeader className="newspack-card--core__header" size={ sizeProps }>
					{ icon && (
						<div className="newspack-card--core__icon">
							<Icon icon={ icon } height={ isSmall ? 24 : 48 } width={ isSmall ? 24 : 48 } />
						</div>
					) }
					{ header && <div className="newspack-card--core__header-content">{ header }</div> }
					{ chevron && <Icon icon={ chevronRight } height={ 24 } width={ 24 } /> }
				</CardHeader>
			) }
			{ Array.isArray( children ) && children.map( Child => Child ) }
			{ children && ! Array.isArray( children ) && <CardBody size={ sizeProps }>{ children }</CardBody> }
			{ footer && <CardFooter size={ sizeProps }>{ footer }</CardFooter> }
		</CardWrapper>
	);
};

export default CoreCard;
