/**
 * Campaign Groups management.
 */

/**
 * WordPress dependencies.
 */
import { MenuItem } from '@wordpress/components';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	TextControl,
} from '../../../../components/src';
import './style.scss';

/**
 * Popup group screen.
 */
const CampaignGroupManagement = ( { wizardApiFetch } ) => {
	const [ groups, setGroups ] = useState( null );
	const [ inFlight, setInFlight ] = useState( false );
	const [ newGroupName, setNewGroupName ] = useState( '' );
	const [ addNewPopoverIsVisible, setAddNewPopoverIsVisible ] = useState( false );

	const createTerm = term => {
		setInFlight( true );
		wizardApiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy',
			method: 'POST',
			quiet: true,
			data: {
				name: term,
				slug: term,
			},
		} ).then( () => {
			setInFlight( false );
			setNewGroupName( '' );
			retrieveTerms();
		} );
	};

	const deleteTerm = id => {
		wizardApiFetch( {
			path: `/wp/v2/newspack_popups_taxonomy/${ id }?force=true`,
			method: 'DELETE',
			quiet: true,
		} ).then( () => {
			setInFlight( false );
			retrieveTerms();
		} );
	};

	const retrieveTerms = () => {
		setInFlight( true );
		wizardApiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy?_fields=id,name,count',
			quiet: null !== groups,
		} ).then( terms => {
			setInFlight( false );
			setGroups( terms );
		} );
	};

	useEffect( retrieveTerms, [] );

	return (
		<Fragment>
			<div noBorder className="newspack-campaigns-wizard-groups__add-ui">
				<Button
					isPrimary
					isSmall
					onClick={ () => setAddNewPopoverIsVisible( true ) }
					disabled={ !! inFlight }
				>
					{ __( 'Add New', 'newspack' ) }
				</Button>
				{ addNewPopoverIsVisible && (
					<div className="newspack-campaigns-wizard-groups__add-new-button">
						<Popover
							position="bottom left"
							onFocusOutside={ () => setAddNewPopoverIsVisible( false ) }
							onKeyDown={ event => ESCAPE === event.keyCode && setAddNewPopoverIsVisible( false ) }
						>
							<MenuItem
								onClick={ () => setPreviewPopoverIsVisible( false ) }
								className="screen-reader-text"
							>
								{ __( 'Close Popover', 'newspack' ) }
							</MenuItem>
							<TextControl
								placeholder={ __( 'Campaign Group Name', 'newspack' ) }
								onChange={ setNewGroupName }
								label={ __( 'Campaign Group Name', 'newspack' ) }
								hideLabelFromVision={ true }
								value={ newGroupName }
								disabled={ !! inFlight }
							/>
							<Button
								isLink
								disabled={ inFlight || ! newGroupName }
								onClick={ () => {
									createTerm( newGroupName );
									setAddNewPopoverIsVisible( false );
								} }
							>
								{ __( 'Add', 'newspack' ) }
							</Button>
						</Popover>
					</div>
				) }
			</div>
			{ Array.isArray( groups ) &&
				groups.map( ( { count, id, name } ) => (
					<ActionCard
						description={
							String( count ) +
							' ' +
							( 1 === count ? __( 'Campaign', 'newspack' ) : __( 'Campaigns', 'newspack' ) )
						}
						isSmall
						key={ id }
						title={ name }
						actionText={
							<Button onClick={ () => deleteTerm( id ) }>
								<DeleteIcon />
							</Button>
						}
					/>
				) ) }
			{ Array.isArray( groups ) && 0 === groups.length && (
				<p>{ __( 'No campaign groups have been created yet.', 'newspack' ) }</p>
			) }
		</Fragment>
	);
};
export default withWizardScreen( CampaignGroupManagement );
