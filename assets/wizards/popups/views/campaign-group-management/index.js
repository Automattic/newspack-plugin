/**
 * Campaign Groups management.
 */

/**
 * WordPress dependencies.
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, moreVertical } from '@wordpress/icons';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Material UI dependencies.
 */
import DeleteIcon from '@material-ui/icons/Delete';

/**
 * Internal dependencies
 */
import {
	withWizardScreen,
	ActionCard,
	Button,
	Popover,
	SelectControl,
	TextControl,
	ToggleControl,
} from '../../../../components/src';
import './style.scss';

/**
 * Popup group screen.
 */
const CampaignGroupManagement = ( {} ) => {
	const [ groups, setGroups ] = useState( [] );
	const [ inFlight, setInFlight ] = useState( false );
	const [ popoverVisibility, setPopoverVisibility ] = useState( false );
	const [ newGroupName, setNewGroupName ] = useState( '' );

	const onFocusOutside = () => setPopoverVisibility( false );

	const createTerm = term => {
		setInFlight( true );
		apiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy',
			method: 'POST',
			data: {
				name: term,
				slug: term,
			},
		} ).then( () => {
			setInFlight( false );
			retrieveTerms();
		} );
	};

	const deleteTerm = id => {
		apiFetch( {
			path: `/wp/v2/newspack_popups_taxonomy/${ id }?force=true`,
			method: 'DELETE',
		} ).then( retrieveTerms );
	};

	const retrieveTerms = () => {
		apiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy?_fields=id,name,count',
		} ).then( terms => setGroups( terms ) );
	};

	useEffect( retrieveTerms, [] );

	return (
		<Fragment>
			<div noBorder className="newspack-campaigns-wizard-groups__add-ui">
				<TextControl
					placeholder={ __( 'Campaign Group Name', 'newspack' ) }
					onChange={ setNewGroupName }
					label={ __( 'Campaign Group Name', 'newspack' ) }
					hideLabelFromVision={ true }
					value={ newGroupName }
					disabled={ !! inFlight }
				/>
				<Button
					isPrimary
					isSmall
					onClick={ () => createTerm( newGroupName ) }
					disabled={ !! inFlight }
				>
					{ __( 'Add New', 'newspack' ) }
				</Button>
			</div>
			{ groups.map( ( { count, id, name } ) => (
				<ActionCard
					description={
						String( count ) +
						' ' +
						( 1 === count ? __( 'Campaign', 'newspack' ) : __( 'Campaigns', 'newspack' ) )
					}
					isSmall
					key={ id }
					title={ name }
					actionText=<Button onClick={ () => deleteTerm( id ) }>
						<DeleteIcon />
					</Button>
				/>
			) ) }
		</Fragment>
	);
};
export default withWizardScreen( CampaignGroupManagement );
