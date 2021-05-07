/**
 * Ad Unit Management Screens.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { trash, pencil } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ActionCard, Button, Card, Notice, withWizardScreen } from '../../../../components/src';

/**
 * Advertising management screen.
 */
class AdUnits extends Component {
	/**
	 * Render.
	 */
	render() {
		const { adUnits, onDelete, updateAdUnit, service, gamConnectionStatus } = this.props;
		const warningNoticeText = `${ __(
			'Please connect your Google account using the Newspack dashboard in order to use ad units from your GAM account.',
			'newspack'
		) } ${
			Object.values( adUnits ).length
				? __( 'The legacy ad units will continue to work, but they are not editable.', 'newspack' )
				: ''
		}`;
		const gamConnectionMessage = gamConnectionStatus?.error
			? `${ __( 'Google Ad Manager connection error', 'newspack' ) }: ${
					gamConnectionStatus.error
			  }`
			: false;

		const isDisabled = false === gamConnectionStatus?.is_network_code_matched;
		const buttonProps = {
			disabled: isDisabled,
			isQuaternary: true,
			isSmall: true,
			tooltipPosition: 'bottom center',
		};

		return (
			<Fragment>
				{ false === gamConnectionStatus?.is_network_code_matched && (
					<Notice
						noticeText={ __(
							'Your GAM network code is different than the network code the site was configured with. Editing has been disabled.',
							'newspack'
						) }
						isError
					/>
				) }
				{ gamConnectionStatus?.connected === false && (
					<Notice
						noticeText={ gamConnectionMessage || warningNoticeText }
						isWarning={ ! gamConnectionMessage }
						isError={ gamConnectionMessage }
					/>
				) }
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
							const editLink = `#${ service }/${ adUnit.id }`;
							return (
								<ActionCard
									disabled={ isDisabled }
									key={ adUnit.id }
									title={ adUnit.name }
									isSmall
									className="mv0"
									{ ...( adUnit.is_legacy
										? {}
										: {
												titleLink: isDisabled ? null : editLink,
												toggleChecked: adUnit.status === 'ACTIVE',
												toggleOnChange: value => {
													adUnit.status = value ? 'ACTIVE' : 'INACTIVE';
													updateAdUnit( adUnit );
												},
										  } ) }
									description={ () =>
										adUnit.is_legacy ? (
											<em>
												{ __(
													'Legacy ad unit - remove it after updating ad placements to use the GAM-sourced ad units.',
													'newspack'
												) }
											</em>
										) : (
											<span>
												{ __( 'Sizes:', 'newspack' ) }{' '}
												{ adUnit.sizes.map( ( size, i ) => (
													<code key={ i }>{ size.join( 'x' ) }</code>
												) ) }
											</span>
										)
									}
									actionText={
										<div className="flex items-center">
											{ ! adUnit.is_legacy && (
												<Button
													href={ editLink }
													icon={ pencil }
													label={ __( 'Edit the ad unit', 'newspack' ) }
													{ ...buttonProps }
												/>
											) }
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
			</Fragment>
		);
	}
}

export default withWizardScreen( AdUnits );
