/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ActionCard, Router, withWizardScreen } from '../../../../components/src';

/**
 * Router component for managing single-page app nav.
 */
const { useHistory } = Router;

/**
 * Advertising management screen.
 */
const AdUnits = ( { adUnits, onDelete, service } ) => {
	const history = useHistory();

	return (
		<>
			<p>
				{ __(
					'Set up multiple ad units to use on your homepage, articles and other places throughout your site. You can place ads through our Newspack Ad Block in the Editor.'
				) }
			</p>
			{ Object.values( adUnits ).map( ( { id, name } ) => {
				return (
					<ActionCard
						key={ id }
						title={ name }
						actionText={ __( 'Edit' ) }
						titleLink={ `#${ service }/${ id }` }
						onClick={ () => history.push( `${ service }/${ id }` ) }
						secondaryActionText={ __( 'Delete' ) }
						onSecondaryActionClick={ () => onDelete( id ) }
					/>
				);
			} ) }
		</>
	);
};

export default withWizardScreen( AdUnits );
