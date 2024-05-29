/**
 * Settings Wizard: Connections > Webhooks > Endpoint Actions Card
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getEndpointTitle } from './utils';
import EndpointActions from './endpoint-actions';
import WizardsActionCard from '../../../../../wizards-action-card';

function EndpointActionsCard( {
	endpoint,
	setAction,
}: {
	endpoint: Endpoint;
	setAction: ( action: Actions, id: number | string ) => void;
} ) {
	return (
		<WizardsActionCard
			isMedium
			className="newspack-webhooks__endpoint mt16"
			toggleChecked={ ! endpoint.disabled }
			toggleOnChange={ () => setAction( 'toggle', endpoint.id ) }
			key={ endpoint.id }
			title={ getEndpointTitle( endpoint ) }
			disabled={ endpoint.system }
			description={ () => {
				if ( endpoint.disabled && endpoint.disabled_error ) {
					return (
						__( 'This endpoint is disabled due to excessive request errors', 'newspack-plugin' ) +
						': ' +
						endpoint.disabled_error
					);
				}
				return (
					<Fragment>
						<span className="newspack-webhooks__endpoint__action newspack-text-overflow">
							{ __( 'Actions:', 'newspack-plugin' ) }{ ' ' }
							{ endpoint.global
								? __( 'global', 'newspack-plugin' )
								: endpoint.actions.join( ', ' ) }
						</span>
					</Fragment>
				);
			} }
			actionText={
				<EndpointActions
					endpoint={ endpoint }
					setAction={ setAction }
					isSystem={ endpoint.system }
				/>
			}
		/>
	);
}

export default EndpointActionsCard;
