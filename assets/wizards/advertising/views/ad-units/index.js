/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { ActionCard, withWizardScreen } from '../../../../components/src';

/**
 * Advertising management screen.
 */
class AdUnits extends Component {
	/**
	 * Render.
	 */
	render() {
		const { adUnits, onDelete, service } = this.props;

		return (
			<Fragment>
				<p>
					{ __(
						'Set up multiple ad units to use on your homepage, articles and other places throughout your site. You can place ads through our Newspack Ad Block in the Editor.'
					) }
				</p>
				{ Object.values( adUnits )
					.sort( ( a, b ) => b.name.localeCompare( a.name ) )
					.sort( a => ( a.is_legacy ? 1 : -1 ) )
					.map( ( { id, name, status, is_legacy } ) => {
						return (
							<ActionCard
								key={ id }
								title={ name }
								description={ () =>
									is_legacy ? (
										<i>
											{ __(
												'Legacy ad unit - remove it after updating ad placements to use the GAM-sourced ad units.',
												'newspack'
											) }
										</i>
									) : (
										<span>
											{ __( 'Status:', 'newspack' ) }{' '}
											<strong
												className={ classnames( {
													green: status === 'ACTIVE',
													orange: status === 'INACTIVE',
												} ) }
											>
												{ status.toLowerCase() }
											</strong>
										</span>
									)
								}
								onSecondaryActionClick={ () => onDelete( id ) }
								{ ...( is_legacy
									? {
											secondaryActionText: __( 'Delete' ),
									  }
									: {
											href: `#${ service }/${ id }`,
											actionText: __( 'Edit' ),
											secondaryActionText: __( 'Archive' ),
									  } ) }
							/>
						);
					} ) }
			</Fragment>
		);
	}
}

export default withWizardScreen( AdUnits );
