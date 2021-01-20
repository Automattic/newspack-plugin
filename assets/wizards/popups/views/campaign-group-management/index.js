/**
 * Campaign Groups management.
 */

/**
 * WordPress dependencies.
 */
import { MenuItem } from '@wordpress/components';
import { useEffect, useState, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ENTER, ESCAPE } from '@wordpress/keycodes';

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
	Notice,
	Popover,
	TextControl,
} from '../../../../components/src';
import './style.scss';

/**
 * Campaign Groups management screen.
 */
const CampaignGroupManagement = ( { wizardApiFetch } ) => {
	const [ groups, setGroups ] = useState( null );
	const [ inFlight, setInFlight ] = useState( false );
	const [ newGroupName, setNewGroupName ] = useState( '' );
	const [ addNewPopoverIsVisible, setAddNewPopoverIsVisible ] = useState( false );
	const [ error, setError ] = useState( null );

	const createTerm = term => {
		setAddNewPopoverIsVisible( false );
		setInFlight( true );
		setError( false );
		wizardApiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy',
			method: 'POST',
			quiet: true,
			data: {
				name: term,
				slug: term,
			},
		} )
			.then( () => {
				setInFlight( false );
				setNewGroupName( '' );
				retrieveTerms();
			} )
			.catch( e => {
				const message =
					e.message || __( 'An error occurred when creating this group.', 'newspack' );
				setError( message );
				setInFlight( false );
			} );
	};

	const deleteTerm = id => {
		setInFlight( true );
		setError( false );
		wizardApiFetch( {
			path: `/wp/v2/newspack_popups_taxonomy/${ id }?force=true`,
			method: 'DELETE',
			quiet: true,
		} )
			.then( () => {
				setInFlight( false );
				retrieveTerms();
			} )
			.catch( e => {
				const message =
					e.message || __( 'An error occurred when deleting this group.', 'newspack' );
				setError( message );
				setInFlight( false );
			} );
	};

	const retrieveTerms = () => {
		setInFlight( true );
		setError( false );
		wizardApiFetch( {
			path: '/wp/v2/newspack_popups_taxonomy?_fields=id,name,count',
			quiet: null !== groups,
		} )
			.then( terms => {
				setInFlight( false );
				setGroups( terms );
			} )
			.catch( e => {
				const message = e.message || __( 'An error occurred when retrieving groups.', 'newspack' );
				setError( message );
				setInFlight( false );
			} );
	};

	useEffect( retrieveTerms, [] );

	return (
		<Fragment>
			{ error && <Notice noticeText={ error } isError /> }
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
								onClick={ () => setAddNewPopoverIsVisible( false ) }
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
								onKeyDown={ event =>
									ENTER === event.keyCode && '' !== newGroupName && createTerm( newGroupName )
								}
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
							' Published ' +
							( 1 === count ? __( 'campaign', 'newspack' ) : __( 'campaigns', 'newspack' ) )
						}
						isSmall
						key={ id }
						title={ name }
						titleLink={ `#/campaigns/${ id }` }
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
