/**
 * Order Management Screens.
 */

/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { trash, pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Card, withWizardScreen } from '../../../../components/src';

/**
 * Orders Management.
 */
const Orders = ( { orders } ) => {
	return (
		<>
			<p>
				{ __( 'Setup your ad buyers and how ad creatives are shown on your site.', 'newspack' ) }
			</p>
			<Card noBorder>
				{ Object.values( orders )
					.filter( order => ! order.is_archived && order.id )
					.map( order => {
						const buttonProps = {
							isQuaternary: true,
							isSmall: true,
							tooltipPosition: 'bottom center',
						};
						const itemsCount = order?.lineItems?.length || 0;
						const badges = [ order.status ];
						if ( order.is_archived ) {
							badges.push( __( 'Archived', 'newspack' ) );
						}
						return (
							<ActionCard
								key={ order.id }
								title={ order.name }
								badge={ badges }
								isSmall
								className="mv0"
								description={ () => [
									<span key="items-count">
										{ itemsCount === 0
											? __( 'No line items', 'newspack' )
											: sprintf(
													_n( '%d line item', '%d line items', itemsCount, 'newspack' ),
													itemsCount
											  ) }
									</span>,
								] }
								actionText={
									<div className="flex items-center">
										<Button
											icon={ pencil }
											label={ __( 'Edit the order', 'newspack' ) }
											{ ...buttonProps }
										/>
										<Button
											icon={ trash }
											label={ __( 'Archive the order', 'newspack' ) }
											{ ...buttonProps }
										/>
									</div>
								}
							/>
						);
					} ) }
			</Card>
		</>
	);
};

export default withWizardScreen( Orders );
