/**
 * Card using WP Core's Card component.
 * https://wordpress.github.io/gutenberg/?path=/docs/components-card--docs
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Card as CardWrapper, CardHeader, CardFooter, DropdownMenu, MenuItem, ToggleControl } from '@wordpress/components';
import { Icon, chevronDown, chevronRight, chevronUp, dragHandle, moreVertical } from '@wordpress/icons';

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
	headerStyle,
	childrenStyle,
	footerStyle,
	icon,
	iconBackgroundColor,
	isActive,
	isDraggable,
	isFirstTarget,
	isLastTarget,
	isNarrow,
	isSmall,
	dragIndex,
	onDragCallback = () => {},
	onHeaderClick,
	noBorder,
	noMargin,
	children = null,
	...otherProps
} ) => {
	const classes = classNames(
		'newspack-card--core',
		className,
		( buttonsCard || as === 'a' ) && 'newspack-card--core__buttons-card',
		isDraggable && 'newspack-card--core__is-draggable',
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
					className={ classNames( 'newspack-card--core__header', isDraggable && 'newspack-card--core__header--is-draggable' ) }
					style={ headerStyle }
					size={ sizeProps }
					onClick={ onHeaderClick }
				>
					{ isDraggable && (
						<div className="newspack-card--core__header__draggable-controls">
							<div className="newspack-card--core__header__draggable-controls__drag-handle">
								<Icon icon={ dragHandle } />
							</div>
							<div className="newspack-card--core__header__draggable-controls__move-buttons">
								<Button
									icon={ chevronUp }
									onClick={ () => onDragCallback( dragIndex, dragIndex - 1 ) }
									disabled={ isFirstTarget }
									label={ __( 'Move one position up', 'newspack-plugin' ) }
									size="small"
								/>
								<Button
									icon={ chevronDown }
									onClick={ () => onDragCallback( dragIndex, dragIndex + 1 ) }
									disabled={ isLastTarget }
									label={ __( 'Move one position down', 'newspack-plugin' ) }
									size="small"
								/>
							</div>
						</div>
					) }
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
			{ children && (
				<div className="newspack-card--core__body" style={ childrenStyle }>
					{ children }
				</div>
			) }
			{ footer && (
				<CardFooter size={ sizeProps } style={ footerStyle }>
					{ footer }
				</CardFooter>
			) }
		</CardWrapper>
	);
};

export default CoreCard;
