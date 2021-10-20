/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { trash, pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Card } from '../../../../components/src';

/**
 * Ad Units Management.
 */
const AdUnits = ( { adUnits, onDelete, updateAdUnit, serviceData } ) => {
	const { status } = serviceData;
	return (
		<>
			<p>
				{ __(
					'Set up multiple ad units to use on your homepage, articles and other places throughout your site.'
				) }
				<br />
				{ __(
					'You can place ads through our Newspack Ad Block in the Editor, Newspack Ad widget, and using the global placements.'
				) }
			</p>
			<Card noBorder>
				{ Object.values( adUnits )
					.sort( ( a, b ) => b.name.localeCompare( a.name ) )
					.sort( a => ( a.is_legacy ? 1 : -1 ) )
					.map( adUnit => {
						const editLink = `#/gam/ad-units/${ adUnit.id }`;
						const buttonProps = {
							isQuaternary: true,
							isSmall: true,
							tooltipPosition: 'bottom center',
						};
						const displayLegacyAdUnitLabel = status.can_connect && adUnit.is_legacy;
						return (
							<ActionCard
								key={ adUnit.id }
								title={ adUnit.name }
								isSmall
								titleLink={ editLink }
								className="mv0"
								{ ...( adUnit.is_legacy
									? {}
									: {
											toggleChecked: adUnit.status === 'ACTIVE',
											toggleOnChange: value => {
												adUnit.status = value ? 'ACTIVE' : 'INACTIVE';
												updateAdUnit( adUnit );
											},
									  } ) }
								description={ () => (
									<span>
										{ displayLegacyAdUnitLabel ? (
											<>
												<i>{ __( 'Legacy ad unit.', 'newspack' ) }</i> |{ ' ' }
											</>
										) : null }
										{ __( 'Sizes:', 'newspack' ) }{ ' ' }
										{ adUnit.sizes.map( ( size, i ) => (
											<code key={ i }>{ size.join( 'x' ) }</code>
										) ) }
										{ adUnit.fluid && <code>{ __( 'Fluid', 'newspack' ) }</code> }
									</span>
								) }
								actionText={
									<div className="flex items-center">
										<Button
											href={ editLink }
											icon={ pencil }
											label={ __( 'Edit the ad unit', 'newspack' ) }
											{ ...buttonProps }
										/>
										<Button
											onClick={ () => onDelete( adUnit.id ) }
											icon={ trash }
											label={ __( 'Archive the ad unit', 'newspack' ) }
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

export default AdUnits;
