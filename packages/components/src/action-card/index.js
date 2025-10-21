/**
 * Action Card
 */

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import { Draggable, ExternalLink, ToggleControl } from '@wordpress/components';
import { Icon, check, chevronDown, chevronUp, dragHandle } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button, Card, Grid, Handoff, Notice, Waiting } from '../';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

const ActionCard = ( {
	badge,
	badgeLevel = 'info',
	className,
	checkbox,
	children,
	collapse,
	disabled,
	title,
	description,
	handoff,
	editLink,
	href,
	notification,
	notificationLevel,
	notificationHTML,
	actionContent,
	actionText,
	secondaryActionText,
	secondaryDestructive,
	id,
	image,
	imageLink,
	indent,
	isSmall,
	isMedium,
	simple,
	onClick,
	onSecondaryActionClick,
	isWaiting,
	titleLink,
	toggleChecked = false,
	toggleOnChange,
	hasGreyHeader,
	hasWhiteHeader,
	noBorder,
	isPending,
	expandable = false,
	isButtonEnabled = false,
	// Draggable props. All are required to enable drag-and-drop.
	draggable = false,
	dragIndex,
	dragWrapperRef,
	onDragCallback,
	totalDraggableCards,
} ) => {
	const [ expanded, setExpanded ] = useState( false );
	const [ dragging, setDragging ] = useState( false );

	useEffect( () => {
		if ( collapse && expanded ) {
			setExpanded( false );
		}
	}, [ collapse ] );

	const hasChildren = notification || children;
	const classes = classnames(
		'newspack-action-card',
		simple && 'newspack-card--is-clickable',
		hasGreyHeader && 'newspack-card--has-grey-header',
		hasWhiteHeader && 'newspack-card--has-white-header',
		hasChildren && 'newspack-card--has-children',
		indent && 'newspack-card--indent',
		isSmall && 'is-small',
		isMedium && 'is-medium',
		checkbox && 'has-checkbox',
		expandable && 'is-expandable',
		draggable && 'is-draggable',
		actionContent && 'has-action-content',
		className
	);
	const backgroundImageStyles = url => {
		return url ? { backgroundImage: `url(${ url })` } : {};
	};
	const titleProps = toggleOnChange && ! titleLink && ! disabled ? { onClick: () => toggleOnChange( ! toggleChecked ), tabIndex: '0' } : {};
	const hasInternalLink = href && href.indexOf( 'http' ) !== 0;
	const isDisplayingSecondaryAction = secondaryActionText && onSecondaryActionClick;
	const badges = ! Array.isArray( badge ) && badge ? [ badge ] : badge;
	const isDraggable = draggable && dragWrapperRef && dragIndex !== undefined && onDragCallback && totalDraggableCards && id;
	const Component = ( { handleDraggableStart, handleDraggableEnd } ) => (
		<Card className={ classes } onClick={ simple && onClick } id={ id ?? null } noBorder={ noBorder }>
			{ isDraggable && (
				<div className="drag-handle" draggable onDragStart={ handleDraggableStart } onDragEnd={ handleDraggableEnd }>
					<Icon icon={ dragHandle } height={ 18 } width={ 18 } />
				</div>
			) }
			<div className="newspack-action-card__region newspack-action-card__region-top">
				{ toggleOnChange && <ToggleControl checked={ toggleChecked } onChange={ toggleOnChange } disabled={ disabled } /> }
				{ image && ! toggleOnChange && (
					<div className="newspack-action-card__region newspack-action-card__region-left">
						<a href={ imageLink }>
							<div className="newspack-action-card__image" style={ backgroundImageStyles( image ) } />
						</a>
					</div>
				) }
				{ checkbox && ! toggleOnChange && (
					<div className="newspack-action-card__region newspack-action-card__region-left">
						<span
							className={ classnames(
								'newspack-checkbox-icon',
								'is-primary',
								'checked' === checkbox && 'newspack-checkbox-icon--checked',
								isPending && 'newspack-checkbox-icon--pending'
							) }
						>
							{ 'checked' === checkbox && <Icon icon={ check } /> }
						</span>
					</div>
				) }
				<div className="newspack-action-card__region newspack-action-card__region-center">
					<Grid columns={ 1 } gutter={ 8 } noMargin>
						<h2>
							<span className="newspack-action-card__title" { ...titleProps }>
								{ titleLink && <a href={ titleLink }>{ title }</a> }
								{ ! titleLink && expandable && (
									<Button isLink onClick={ () => setExpanded( ! expanded ) }>
										{ title }
									</Button>
								) }
								{ ! titleLink && ! expandable && title }
							</span>
							{ badges?.length &&
								badges.map( ( badgeText, i ) => (
									<span
										key={ `badge-${ i }` }
										className={ `newspack-action-card__badge newspack-action-card__badge-level-${ badgeLevel }` }
									>
										{ badgeText }
									</span>
								) ) }
						</h2>
						{ description && (
							<p>
								{ typeof description === 'string' && description }
								{ typeof description === 'function' && description() }
							</p>
						) }
					</Grid>
				</div>
				{ ! expandable && ( actionText || isDisplayingSecondaryAction || actionContent ) && (
					<div className="newspack-action-card__region newspack-action-card__region-right">
						{ /* eslint-disable no-nested-ternary */ }
						{ actionContent && actionContent }
						{ actionText &&
							( handoff ? (
								<Handoff plugin={ handoff } editLink={ editLink } compact isLink>
									{ actionText }
								</Handoff>
							) : onClick || hasInternalLink ? (
								<Button
									disabled={ disabled && ! isButtonEnabled }
									isLink
									href={ href }
									onClick={ onClick }
									className="newspack-action-card__primary_button"
								>
									{ actionText }
								</Button>
							) : href ? (
								<ExternalLink href={ href } className="newspack-action-card__primary_button">
									{ actionText }
								</ExternalLink>
							) : (
								<div className="newspack-action-card__container">
									{ actionText }
									{ isWaiting && <Waiting isRight /> }
								</div>
							) ) }
						{ /* eslint-enable no-nested-ternary */ }
						{ isDisplayingSecondaryAction && (
							<Button
								isLink
								onClick={ onSecondaryActionClick }
								className="newspack-action-card__secondary_button"
								isDestructive={ secondaryDestructive }
							>
								{ secondaryActionText }
							</Button>
						) }
					</div>
				) }
				{ expandable && (
					<Button onClick={ () => setExpanded( ! expanded ) }>
						<Icon icon={ expanded ? chevronUp : chevronDown } height={ 24 } width={ 24 } />
					</Button>
				) }
			</div>
			{ notification && (
				<div className="newspack-action-card__notification newspack-action-card__region-children">
					{ 'error' === notificationLevel && <Notice noticeText={ notification } isError rawHTML={ notificationHTML } /> }
					{ 'info' === notificationLevel && <Notice noticeText={ notification } rawHTML={ notificationHTML } /> }
					{ 'success' === notificationLevel && <Notice noticeText={ notification } isSuccess rawHTML={ notificationHTML } /> }
					{ 'warning' === notificationLevel && <Notice noticeText={ notification } isWarning rawHTML={ notificationHTML } /> }
				</div>
			) }
			{ children && ( ( expandable && expanded ) || ! expandable ) && (
				<div className="newspack-action-card__region-children">{ children }</div>
			) }
		</Card>
	);

	if ( isDraggable ) {
		const onDragStart = () => {
			if ( dragging ) {
				return;
			}
			setDragging( true );
		};
		const onDragEnd = () => {
			setDragging( false );
		};
		const onDragOver = e => {
			const wrapperRect = dragWrapperRef.current.getBoundingClientRect();
			const isDraggingToTop = e.pageY <= wrapperRect.top + window.scrollY;
			const isDraggingToBottom = e.pageY >= wrapperRect.bottom + window.scrollY;

			if ( isDraggingToTop || isDraggingToBottom || e.target.classList.contains( 'newspack-action-card' ) ) {
				const draggableCards = Array.prototype.slice.call(
					dragWrapperRef.current.querySelectorAll( '.newspack-action-card__draggable-wrapper' )
				);

				let targetIndex = draggableCards.indexOf( e.target.parentElement );

				// If dragging the element over itself or over an invalid target, cancel the drop.
				if ( 0 > targetIndex || targetIndex === dragIndex + 1 ) {
					targetIndex = dragIndex;
				}

				// Handle dropping before the first item.
				if ( isDraggingToTop ) {
					targetIndex = 0;
				}

				// Handle dropping after the last item.
				if ( isDraggingToBottom ) {
					targetIndex = totalDraggableCards;
				}
				onDragCallback( targetIndex );
			}
		};

		return (
			<div className={ 'newspack-action-card__draggable-wrapper' + ( dragging ? ' is-dragging' : '' ) } id={ id }>
				<Draggable elementId={ id } transferData={ {} } onDragStart={ onDragStart } onDragEnd={ onDragEnd } onDragOver={ onDragOver }>
					{ ( { onDraggableStart, onDraggableEnd } ) => (
						<Component handleDraggableStart={ onDraggableStart } handleDraggableEnd={ onDraggableEnd } />
					) }
				</Draggable>
			</div>
		);
	}

	return <Component />;
};

export default ActionCard;
