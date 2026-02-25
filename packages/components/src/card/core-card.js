/**
 * Card using WP Core's Card component.
 * https://wordpress.github.io/gutenberg/?path=/docs/components-card--docs
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Card as CardWrapper, CardHeader, CardFooter, DropdownMenu, MenuItem, ToggleControl } from '@wordpress/components';
import { Icon, chevronRight, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import './style-core.scss';

/**
 * External dependencies
 */
import classNames from 'classnames';

const CoreCard = ( {
	actions,
	actionType,
	as,
	buttonsCard,
	className,
	footer,
	header,
	icon,
	iconBackgroundColor,
	isActive,
	isNarrow,
	isSmall,
	onHeaderClick,
	noBorder,
	noMargin,
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
		iconBackgroundColor && 'newspack-card--core__has-icon-background-color',
		isActive && 'newspack-card--core__is-active',
		children && 'newspack-card--core__has-children',
		noMargin && 'newspack-card--core__no-margin'
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
				<CardHeader
					as={ onHeaderClick ? 'button' : undefined }
					className="newspack-card--core__header"
					size={ sizeProps }
					onClick={ onHeaderClick }
				>
					{ icon && (
						<div className="newspack-card--core__icon">
							<Icon icon={ icon } height={ isSmall ? 24 : 48 } width={ isSmall ? 24 : 48 } />
						</div>
					) }
					{ header && <div className="newspack-card--core__header-content">{ header }</div> }
					{ ! actions?.length > 0 && actionType === 'chevron' && (
						<Icon className="newspack-card--core__action" icon={ chevronRight } height={ 24 } width={ 24 } />
					) }
					{ ! actions?.length > 0 && actionType === 'toggle' && (
						<ToggleControl
							className="newspack-card--core__action"
							label={ otherProps.title }
							hideLabelFromVision
							checked={ isActive }
							onChange={ () => {} }
						/>
					) }
					{ actions?.length > 0 && (
						<DropdownMenu icon={ moreVertical } label={ __( 'More', 'newspack-plugin' ) }>
							{ () =>
								actions.map( ( action, index ) => (
									<MenuItem
										key={ index }
										icon={ action.icon }
										onClick={ action.action }
										disabled={ action.disabled || false }
										isDestructive={ action.destructive || false }
									>
										{ action.label }
									</MenuItem>
								) )
							}
						</DropdownMenu>
					) }
				</CardHeader>
			) }
			{ children && <div className="newspack-card--core__body">{ children }</div> }
			{ footer && <CardFooter size={ sizeProps }>{ footer }</CardFooter> }
		</CardWrapper>
	);
};

export default CoreCard;
