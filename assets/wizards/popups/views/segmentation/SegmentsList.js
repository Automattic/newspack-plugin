/**
 * WordPress dependencies.
 */
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { format } from '@wordpress/date';
import { Draggable, Tooltip, MenuItem } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';
import { Icon, chevronDown, chevronUp, dragHandle, moreVertical } from '@wordpress/icons';

/**
 * Material UI dependencies.
 */
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

/**
 * Internal dependencies.
 */
import { ActionCard, Popover, Button, Router } from '../../../../components/src';

const { NavLink, useHistory } = Router;

const AddNewSegmentLink = () => (
	<NavLink to="segmentation/new">
		<Button isPrimary isSmall>
			{ __( 'Add New', 'newspack' ) }
		</Button>
	</NavLink>
);

const SegmentActionCard = ( {
	segment,
	deleteSegment,
	dropTargetIndex,
	setDropTargetIndex,
	index,
	totalSegments,
	wrapperRef,
} ) => {
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const [ isDragging, setIsDragging ] = useState( false );

	const onFocusOutside = () => setPopoverVisibility( false );
	const history = useHistory();
	const isFirstTarget = 0 === index;
	const isLastTarget = index + 1 === totalSegments;
	const isDropTarget = index === dropTargetIndex;
	const targetIsLast = isLastTarget && dropTargetIndex >= totalSegments;
	const onDragStart = () => {
		console.log( 'drag start' );
		setDropTargetIndex( null );
		setIsDragging( true );
	};
	const onDragEnd = () => {
		console.log( 'drag end', dropTargetIndex );
		setDropTargetIndex( null );
		setIsDragging( false );
	};
	const onDragOver = e => {
		if ( e.target.classList.contains( 'newspack-action-card' ) ) {
			const segmentCards = Array.prototype.slice.call( wrapperRef.current.children );
			let targetIndex = segmentCards.indexOf( e.target.parentElement );

			// Handle dropping after the last item.
			if ( targetIndex + 1 === totalSegments ) {
				const lastSegment = segmentCards[ totalSegments - 1 ];
				if ( e.pageY > lastSegment.getBoundingClientRect().top + lastSegment.clientHeight / 2 )
					targetIndex = totalSegments;
			}

			setDropTargetIndex( 0 <= targetIndex ? targetIndex : null );
		}
	};

	return (
		<div
			className={
				'newspack-campaigns__draggable' +
				( isDragging ? ' is-dragging' : '' ) +
				( isDropTarget ? ' is-drop-target' : '' ) +
				( targetIsLast ? ' drop-target-after' : '' )
			}
			id={ `segment-${ segment.id }` }
		>
			<Draggable
				elementId={ `segment-${ segment.id }` }
				transferData={ {} }
				onDragStart={ onDragStart }
				onDragEnd={ onDragEnd }
				onDragOver={ onDragOver }
			>
				{ ( { onDraggableStart, onDraggableEnd } ) => (
					<ActionCard
						isSmall
						title={ segment.name }
						titleLink={ `#/segmentation/${ segment.id }` }
						description={ `${ __( 'Created on', 'newspack' ) } ${ format(
							'Y/m/d',
							segment.created_at
						) }` }
						actionText={
							<>
								<Tooltip text={ __( 'More options', 'newspack' ) }>
									<Button
										className="icon-only"
										onClick={ () => setPopoverVisibility( ! popoverVisibility ) }
									>
										<Icon icon={ moreVertical } />
									</Button>
								</Tooltip>
								{ popoverVisibility && (
									<Popover
										position="bottom left"
										onKeyDown={ event => ESCAPE === event.keyCode && onFocusOutside }
										onFocusOutside={ onFocusOutside }
									>
										<MenuItem
											onClick={ () => history.push( `/segmentation/${ segment.id }` ) }
											icon={ <EditIcon /> }
											className="newspack-button"
										>
											{ __( 'Edit', 'newspack' ) }
										</MenuItem>
										<MenuItem
											onClick={ () => deleteSegment( segment ) }
											icon={ <DeleteIcon /> }
											className="newspack-button"
										>
											{ __( 'Delete', 'newspack' ) }
										</MenuItem>
									</Popover>
								) }
							</>
						}
					>
						<div className="newspack-campaigns__segment-priority-controls">
							<div
								className="drag-handle"
								draggable
								onDragStart={ onDraggableStart }
								onDragEnd={ onDraggableEnd }
							>
								<Icon icon={ dragHandle } height={ 18 } width={ 18 } />
							</div>
							<div className="movers">
								<Button icon={ chevronUp } isLink disabled={ isFirstTarget } label={ __( 'Move segment position up', 'newspack' ) } />
								<Button icon={ chevronDown } isLink disabled={ isLastTarget } label={ __( 'Move segment position down', 'newspack' ) } />
							</div>
						</div>
					</ActionCard>
				) }
			</Draggable>
		</div>
	);
};

const SegmentsList = ( { wizardApiFetch, segments, setSegments } ) => {
	const [ dropTargetIndex, setDropTargetIndex ] = useState( null );

	const ref = useRef();
	const deleteSegment = segment => {
		wizardApiFetch( {
			path: `/newspack/v1/wizard/newspack-popups-wizard/segmentation/${ segment.id }`,
			method: 'DELETE',
		} ).then( setSegments );
	};

	if ( segments === null ) {
		return null;
	}

	return segments.length ? (
		<div className="newspack-campaigns-wizard-segments__list-wrapper">
			<div className="newspack-campaigns-wizard-segments__list-top">
				<AddNewSegmentLink />
			</div>
			<div className="newspack-campaigns-wizard-segments__list" ref={ ref }>
				{ segments.map( ( segment, index ) => (
					<SegmentActionCard
						deleteSegment={ deleteSegment }
						key={ segment.id }
						segment={ segment }
						index={ index }
						wrapperRef={ ref }
						dropTargetIndex={ dropTargetIndex }
						setDropTargetIndex={ setDropTargetIndex }
						totalSegments={ segments.length }
					/>
				) ) }
			</div>
		</div>
	) : (
		<div>
			<h2>{ __( 'You have no saved audience segments.', 'newspack' ) }</h2>
			<div className="newspack-campaigns-wizard-segments__subheader">
				{ __(
					'Create audience segments to target visitors by engagement, activity, and more.',
					'newspack'
				) }
			</div>
			<AddNewSegmentLink />
		</div>
	);
};

export default SegmentsList;
