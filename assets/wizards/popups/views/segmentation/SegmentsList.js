/**
 * WordPress dependencies.
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { format } from '@wordpress/date';
import { Tooltip, MenuItem } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Material UI dependencies.
 */
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

import { Icon, moreVertical } from '@wordpress/icons';

/**
 * Internal dependencies.
 */
import { ActionCard, Popover, Button, Router } from '../../../../components/src';

const { NavLink, useHistory } = Router;

const AddNewSegmentLink = () => (
	<NavLink to="segmentation/new">
		<Button isPrimary isSmall>
			{ __( 'Add new', 'newspack' ) }
		</Button>
	</NavLink>
);

const SegmentActionCard = ( { segment, deleteSegment } ) => {
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const onFocusOutside = () => setPopoverVisibility( false );
	const history = useHistory();

	return (
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
		/>
	);
};

const SegmentsList = ( { wizardApiFetch, segments, setSegments } ) => {
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
			<div className="newspack-campaigns-wizard-segments__list">
				{ segments.map( segment => (
					<SegmentActionCard
						deleteSegment={ deleteSegment }
						key={ segment.id }
						segment={ segment }
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
