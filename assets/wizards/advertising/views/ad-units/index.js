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
				{ Object.values( adUnits ).map( ( { id, name, status } ) => {
					return (
						<ActionCard
							key={ id }
							title={ name }
							actionText={ __( 'Edit' ) }
							description={ () => (
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
							) }
							href={ `#${ service }/${ id }` }
							secondaryActionText={ __( 'Archive' ) }
							onSecondaryActionClick={ () => onDelete( id ) }
						/>
					);
				} ) }
			</Fragment>
		);
	}
}

export default withWizardScreen( AdUnits );
