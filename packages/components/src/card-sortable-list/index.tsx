/**
 * Card - Sortable list component.
 */

/**
 * WordPress dependencies.
 */
import { Draggable, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { useEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Badge, Card } from '../';
import './style.scss';

/**
 * External dependencies
 */
import classNames from 'classnames';

const DROP_ANIMATION_DURATION = 400; // ms — must match $drop-duration in style.scss

type DraggableItem = {
	title: string;
	badgeLevel: 'success' | 'info' | 'warning' | 'error';
	badgeText: string;
};

type DragMeasurements = {
	lockedHeight: number;
	sourceHeight: number;
	// Height of each item (including the VStack gap after it, except the last).
	itemStrides: number[];
	// Top edge of each item, used for drop position hit-testing in onDragEnd.
	itemTops: number[];
};

const CardSortableList = ( {
	isActive = false,
	items = [],
	onDragCallback = () => {},
}: {
	isActive?: boolean;
	items?: DraggableItem[];
	onDragCallback?: ( index: number, targetIndex: number ) => void;
} ) => {
	const [ sortedItems, setSortedItems ] = useState( items );
	const [ draggingIndex, setDraggingIndex ] = useState< number | null >( null );
	const [ hoverIndex, setHoverIndex ] = useState< number | null >( null );
	const [ droppedIndex, setDroppedIndex ] = useState< number | null >( null );
	const [ measurements, setMeasurements ] = useState< DragMeasurements | null >( null );
	const listRef = useRef< HTMLDivElement | null >( null );
	const itemRefs = useRef< ( HTMLDivElement | null )[] >( [] );
	const dropAnimationTimer = useRef< ReturnType< typeof setTimeout > | null >( null );

	// Keep sortedItems in sync when the items prop changes externally (e.g. after a save).
	useEffect( () => {
		setSortedItems( items );
	}, [ items ] );

	// Clean up any pending animation timer on unmount.
	useEffect( () => {
		return () => {
			if ( dropAnimationTimer.current ) {
				clearTimeout( dropAnimationTimer.current );
			}
		};
	}, [] );

	const handleDragStart = ( index: number ) => {
		const listEl = listRef.current;
		if ( listEl ) {
			const itemEls = itemRefs.current;
			const rects = itemEls.map( el => el?.getBoundingClientRect() );

			// Stride = item height + gap to next item (difference between consecutive tops).
			const itemStrides = rects.map( ( rect, i ) => {
				if ( ! rect ) {
					return 0;
				}
				const nextRect = rects[ i + 1 ];
				return nextRect ? nextRect.top - rect.top : rect.height;
			} );

			setMeasurements( {
				lockedHeight: listEl.getBoundingClientRect().height,
				sourceHeight: rects[ index ]?.height ?? 0,
				itemStrides,
				itemTops: rects.map( rect => rect?.top ?? 0 ),
			} );
		}
		setDraggingIndex( index );
		setDroppedIndex( null );
	};

	const clearDragState = () => {
		setDraggingIndex( null );
		setHoverIndex( null );
		setMeasurements( null );
	};

	/**
	 * Determine the drop target index from cursor coordinates and the item
	 * top positions snapshotted at drag start. Mirrors the midpoint logic
	 * previously used in getDropIndex but works without a live event target.
	 */
	const getDropIndexFromCursor = ( clientY: number, m: DragMeasurements, sourceIndex: number ): number => {
		const { itemTops, itemStrides, sourceHeight } = m;
		for ( let i = 0; i < itemTops.length; i++ ) {
			const movingDown = sourceIndex > i;
			const midpoint = itemTops[ i ] + ( movingDown ? itemStrides[ i ] : itemStrides[ i ] - sourceHeight );
			if ( clientY < midpoint ) {
				return i;
			}
		}
		return itemTops.length; // below all items
	};

	const handleDragEnd = ( event: DragEvent ) => {
		// Take a local copy of measurements before clearDragState nulls it.
		const m = measurements;
		const sourceIndex = draggingIndex;

		clearDragState();

		if ( m === null || sourceIndex === null ) {
			return;
		}

		const dropIndex = getDropIndexFromCursor( event.clientY, m, sourceIndex );

		// Compute the destination index in the post-removal array.
		// After splicing out the dragged item, indices above it shift down by one.
		const insertIndex = dropIndex > sourceIndex ? dropIndex - 1 : dropIndex;
		if ( insertIndex === sourceIndex ) {
			return;
		}

		const reordered = [ ...sortedItems ];
		const [ moved ] = reordered.splice( sourceIndex, 1 );
		reordered.splice( insertIndex, 0, moved );

		// First render: show items in their new order with no animation.
		// The dragging CSS classes are already cleared by clearDragState() above,
		// so no transitions will fire on this paint.
		setSortedItems( reordered );

		// Next frame: trigger the drop animation on the newly-positioned item,
		// then call onDragCallback after the animation completes.
		requestAnimationFrame( () => {
			setDroppedIndex( insertIndex );
			dropAnimationTimer.current = setTimeout( () => {
				setDroppedIndex( null );
				onDragCallback( sourceIndex, insertIndex );
			}, DROP_ANIMATION_DURATION );
		} );
	};

	const handleDragOver = ( event: React.DragEvent< HTMLDivElement >, index: number ) => {
		event.preventDefault();
		if ( ! measurements ) {
			return;
		}
		const rect = event.currentTarget.getBoundingClientRect();
		const midpoint = rect.top + rect.height / 2;
		setHoverIndex( event.clientY < midpoint ? index : index + 1 );
	};

	/**
	 * Compute the translateY for a non-source item at `index` given the current
	 * draggingIndex and hoverIndex, so that items visually shift to show the gap
	 * while the container's layout height stays fixed.
	 *
	 * The source item has been visually hidden but still occupies its layout slot.
	 * Items between the source and the hover position need to slide by the source
	 * item's stride (height + gap) to either fill the vacated source slot or make
	 * room for the incoming gap at the hover position.
	 */
	const getTranslateY = ( index: number ): number => {
		if ( draggingIndex === null || hoverIndex === null || ! measurements ) {
			return 0;
		}
		if ( index === draggingIndex ) {
			return 0;
		}

		const { itemStrides, sourceHeight } = measurements;
		const sourceStride = itemStrides[ draggingIndex ] ?? sourceHeight;

		if ( hoverIndex > draggingIndex ) {
			// Dragging downward: items strictly between source and hover position slide up.
			if ( index > draggingIndex && index < hoverIndex ) {
				return -sourceStride;
			}
		} else if ( index >= hoverIndex && index < draggingIndex ) {
			// Dragging upward: items between hover position and source slide down.
			return sourceStride;
		}

		return 0;
	};

	const isDragging = draggingIndex !== null;

	return (
		<VStack
			ref={ listRef }
			className={ classNames(
				'newspack-card--core--sortable-list',
				isActive && 'newspack-card--core--sortable-list__is-active',
				isDragging && 'newspack-card--core--sortable-list__is-dragging'
			) }
			style={ measurements ? { height: measurements.lockedHeight } : undefined }
			spacing="16px"
		>
			{ sortedItems.map( ( item, index ) => {
				const translateY = getTranslateY( index );
				return (
					<div
						key={ index }
						ref={ el => {
							itemRefs.current[ index ] = el;
						} }
						className={ classNames( 'newspack-card--core--sortable-list__item', {
							'is-source': draggingIndex === index,
							'is-dropped': droppedIndex === index,
						} ) }
						style={ translateY ? { transform: `translateY(${ translateY }px)` } : { transition: ! isDragging ? 'none' : undefined } }
						id={ `draggable-card-${ index }` }
						onDragOver={ e => handleDragOver( e, index ) }
						// onDragLeave={ handleDragLeave }
					>
						<Draggable
							transferData={ {} }
							cloneClassname="newspack-card--core--sortable-list__item__clone"
							elementId={ `draggable-card-${ index }` }
							onDragStart={ () => handleDragStart( index ) }
							onDragEnd={ handleDragEnd }
						>
							{ ( { onDraggableStart, onDraggableEnd } ) => (
								<Card
									isSmall
									draggable
									onDragStart={ onDraggableStart }
									onDragEnd={ onDraggableEnd }
									__experimentalCoreCard
									__experimentalCoreProps={ {
										header: (
											<h3>
												{ item.title }
												<Badge level={ item.badgeLevel } text={ item.badgeText } />
											</h3>
										),
										isDraggable: true,
										isFirstTarget: index === 0,
										isLastTarget: index === sortedItems.length - 1,
										dragIndex: index,
										onDragStart: () => handleDragStart( index ),
										onDragEnd: handleDragEnd,
										onDragOver: handleDragOver,
									} }
								/>
							) }
						</Draggable>
					</div>
				);
			} ) }
		</VStack>
	);
};

export default CardSortableList;
