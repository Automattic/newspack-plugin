/* globals newspackAudienceCampaigns */
/**
 * WordPress dependencies.
 */
import { useRef, useState, Fragment, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';
import { moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ActionCard, Button, Card, Notice, Popover, Router } from '../../../../../../packages/components/src';
import { segmentDescription } from '../utils';

const { NavLink, useHistory } = Router;

const AddNewSegmentLink = () => (
	<NavLink to="segments/new">
		<Button variant="primary">{ __( 'Add New Segment', 'newspack-plugin' ) }</Button>
	</NavLink>
);

const SegmentActionCard = ( { inFlight, segment, segments, deleteSegment, index, sortSegments, wrapperRef, toggleSegmentStatus } ) => {
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );

	const onFocusOutside = () => setPopoverVisibility( false );
	const history = useHistory();
	const resortSegments = targetIndex => {
		if ( inFlight ) {
			return;
		}

		const sortedSegments = [ ...segments ];

		// Remove the segment and drop it back into the array at the target index.
		sortedSegments.splice( index, 1 );
		sortedSegments.splice( targetIndex, 0, segment );

		// Reindex priorities to avoid gaps and dupes.
		sortedSegments.forEach( ( _segment, _index ) => ( _segment.priority = _index ) );

		// Only trigger the API request if the order has changed.
		if ( JSON.stringify( sortedSegments ) !== JSON.stringify( segments ) ) {
			sortSegments( sortedSegments );
		}
	};

	return (
		<ActionCard
			isSmall
			id={ `segment-${ segment.id }` }
			title={ segment.name }
			titleLink={ `#/segments/${ segment.id }` }
			description={ segmentDescription( segment ) }
			toggleChecked={ ! segment.configuration.is_disabled }
			toggleOnChange={ () => toggleSegmentStatus( segment ) }
			badge={ segment.is_criteria_duplicated ? __( 'Duplicate', 'newspack-plugin' ) : undefined }
			draggable
			dragIndex={ index }
			dragWrapperRef={ wrapperRef }
			onDragCallback={ resortSegments }
			actionText={
				<>
					<Button
						onClick={ () => setPopoverVisibility( ! popoverVisibility ) }
						label={ __( 'More options', 'newspack-plugin' ) }
						icon={ moreVertical }
						className={ popoverVisibility && 'popover-active' }
					/>
					{ popoverVisibility && (
						<Popover
							position="bottom left"
							onKeyDown={ event => ESCAPE === event.keyCode && onFocusOutside }
							onFocusOutside={ onFocusOutside }
						>
							<MenuItem onClick={ () => onFocusOutside() } className="screen-reader-text">
								{ __( 'Close Popover', 'newspack-plugin' ) }
							</MenuItem>
							<MenuItem onClick={ () => history.push( `/segments/${ segment.id }` ) } className="newspack-button">
								{ __( 'Edit', 'newspack-plugin' ) }
							</MenuItem>
							<MenuItem onClick={ () => deleteSegment( segment ) } className="newspack-button">
								{ __( 'Delete', 'newspack-plugin' ) }
							</MenuItem>
						</Popover>
					) }
				</>
			}
		/>
	);
};

const SegmentsList = ( { wizardApiFetch, segments, setSegments, isLoading } ) => {
	const [ sortedSegments, setSortedSegments ] = useState( null );
	const [ inFlight, setInFlight ] = useState( false );
	const [ error, setError ] = useState( null );
	const ref = useRef();
	useEffect( () => {
		window.scrollTo( 0, 0 );
	}, [] );
	const toggleSegmentStatus = segment => {
		setInFlight( true );
		setError( null );
		wizardApiFetch( {
			path: `${ newspackAudienceCampaigns.api }/segmentation/${ segment.id }`,
			method: 'POST',
			quiet: true,
			data: {
				name: segment.name,
				configuration: {
					...segment.configuration,
					is_disabled: ! segment.configuration.is_disabled,
				},
				criteria: segment.criteria,
			},
		} )
			.then( _segments => {
				setInFlight( false );
				setSegments( _segments );
			} )
			.catch( () => {
				setInFlight( false );
			} );
	};
	const deleteSegment = segment => {
		setInFlight( true );
		setError( null );
		wizardApiFetch( {
			path: `${ newspackAudienceCampaigns.api }/segmentation/${ segment.id }`,
			method: 'DELETE',
			quiet: true,
		} )
			.then( _segments => {
				setInFlight( false );
				setSegments( _segments );
			} )
			.catch( () => {
				setInFlight( false );
			} );
	};
	const sortSegments = segmentsToSort => {
		setError( null );
		setSortedSegments( segmentsToSort );
		setInFlight( true );
		wizardApiFetch( {
			path: `${ newspackAudienceCampaigns.api }/segmentation-sort`,
			method: 'POST',
			data: { segmentIds: segmentsToSort.map( _segment => _segment.id ) },
			quiet: true,
		} )
			.then( _segments => {
				setInFlight( false );
				setSortedSegments( null );
				setSegments( _segments );
			} )
			.catch( e => {
				setInFlight( false );
				setError( e.message || __( 'There was an error sorting segments. Please try again.', 'newspack-plugin' ) );
				setSegments( segments );
			} );
	};

	if ( segments === null ) {
		return null;
	}

	// Optimistically update the order of the list while the sort request is pending.
	const segmentsToShow = sortedSegments || segments;

	return segments.length ? (
		<Fragment>
			{ error && <Notice noticeText={ error } isError /> }
			<Card headerActions noBorder>
				<h2>{ __( 'Audience segments', 'newspack-plugin' ) }</h2>
				<AddNewSegmentLink />
			</Card>
			<div className={ 'newspack-campaigns-wizard-segments__list' + ( inFlight ? ' is-loading' : '' ) } ref={ ref }>
				{ segmentsToShow.map( ( segment, index ) => (
					<SegmentActionCard
						deleteSegment={ deleteSegment }
						key={ segment.id }
						inFlight={ inFlight || isLoading > 0 }
						segment={ segment }
						segments={ segments }
						sortSegments={ sortSegments }
						index={ index }
						wrapperRef={ ref }
						totalSegments={ segments.length }
						toggleSegmentStatus={ toggleSegmentStatus }
					/>
				) ) }
			</div>
		</Fragment>
	) : (
		<Fragment>
			<Card headerActions noBorder>
				<h2>{ __( 'You have no saved audience segments.', 'newspack-plugin' ) }</h2>
				<AddNewSegmentLink />
			</Card>
			<p>{ __( 'Create audience segments to target visitors by engagement, activity, and more.', 'newspack-plugin' ) }</p>
		</Fragment>
	);
};

export default SegmentsList;
