/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import { category } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button, Handoff, NewspackIcon, Notice, TabbedNavigation } from '../';
import { HANDOFF_KEY } from '../consts';
import { buttonProps } from '../../../shared/js/';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */
export default function withWizardScreen( WrappedComponent, { hidePrimaryButton } = {} ) {
	const WrappedWithWizardScreen = props => {
		const [ handoffMessage, setHandoffMessage ] = useState( false );
		const {
			className,
			buttonText,
			buttonAction,
			buttonDisabled,
			headerText,
			subHeaderText,
			tabbedNavigation,
			secondaryButtonText,
			secondaryButtonAction,
			renderAboveContent,
			disableUpcomingInTabbedNavigation,
		} = props;

		useEffect( () => {
			const handoff = JSON.parse( localStorage.getItem( HANDOFF_KEY ) );

			if ( handoff?.message ) {
				setHandoffMessage( handoff.message );
			}
		}, [] );

		const retrievedButtonProps = buttonProps( buttonAction );
		const retrievedSecondaryButtonProps = buttonProps( secondaryButtonAction );
		const SecondaryCTAComponent = retrievedSecondaryButtonProps.plugin ? Handoff : Button;
		const shouldRenderPrimaryButton = buttonText && buttonAction;
		const shouldRenderSecondaryButton = secondaryButtonText && secondaryButtonAction;
		const renderPrimaryButton = ( overridingProps = {} ) =>
			retrievedButtonProps.plugin ? (
				<Handoff isPrimary { ...retrievedButtonProps } { ...overridingProps }>
					{ buttonText }
				</Handoff>
			) : (
				<Button
					isPrimary={ ! buttonDisabled }
					isSecondary={ !! buttonDisabled }
					disabled={ buttonDisabled }
					// Allow overridingProps to set children.
					// eslint-disable-next-line react/no-children-prop
					children={ buttonText }
					{ ...retrievedButtonProps }
					{ ...overridingProps }
				/>
			);
		return (
			<>
				{ newspack_aux_data.is_debug_mode && <Notice debugMode /> }
				<div className="newspack-wizard__header">
					<div className="newspack-wizard__header__inner">
						<div className="newspack-wizard__title">
							<Button
								isLink
								href={ newspack_urls.dashboard }
								label={ __( 'Return to Dashboard', 'newspack' ) }
								showTooltip={ true }
								icon={ category }
								iconSize={ 36 }
							>
								<NewspackIcon size={ 36 } />
							</Button>
							<div>
								{ headerText && <h2>{ headerText }</h2> }
								{ subHeaderText && <span>{ subHeaderText }</span> }
							</div>
						</div>
					</div>
				</div>

				{ tabbedNavigation && (
					<TabbedNavigation
						disableUpcoming={ disableUpcomingInTabbedNavigation }
						items={ tabbedNavigation.filter( item => ! item.isHiddenInNav ) }
					/>
				) }

				{ handoffMessage && (
					<Notice isHandoff isDismissible={ false } rawHTML noticeText={ handoffMessage } />
				) }

				<div className={ classnames( 'newspack-wizard newspack-wizard__content', className ) }>
					{ typeof renderAboveContent === 'function' ? renderAboveContent() : null }
					{ <WrappedComponent { ...props } renderPrimaryButton={ renderPrimaryButton } /> }
					{ ( shouldRenderPrimaryButton || shouldRenderSecondaryButton ) && (
						<div className="newspack-buttons-card">
							{ shouldRenderPrimaryButton && ! hidePrimaryButton && renderPrimaryButton() }
							{ shouldRenderSecondaryButton && (
								<SecondaryCTAComponent isSecondary { ...retrievedSecondaryButtonProps }>
									{ secondaryButtonText }
								</SecondaryCTAComponent>
							) }
						</div>
					) }
				</div>
			</>
		);
	};
	return WrappedWithWizardScreen;
}
