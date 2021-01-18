/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, Handoff, TabbedNavigation, WizardPagination } from '../';
import { buttonProps } from '../../../shared/js/';
import './style.scss';

/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */
export default function withWizardScreen( WrappedComponent ) {
	const WrappedWithWizardScreen = props => {
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
			hidden,
			routes,
		} = props;
		if ( hidden ) {
			return null;
		}
		const content = <WrappedComponent { ...props } />;
		const retrievedButtonProps = buttonProps( buttonAction );
		const retrievedSecondaryButtonProps = buttonProps( secondaryButtonAction );
		const SecondaryCTAComponent = retrievedSecondaryButtonProps.plugin ? Handoff : Button;
		const shouldRenderPrimaryButton = buttonText && buttonAction;
		const shouldRenderSecondaryButton = secondaryButtonText && secondaryButtonAction;
		return (
			<>
				{ newspack_aux_data.is_debug_mode && (
					<div className="newspack-wizard__debug-mode-notice">
						{ __( 'Newspack is in debug mode.', 'newspack' ) }
					</div>
				) }
				<div className="newspack-wizard__header">
					<div className="newspack-wizard__header__inner">
						{ headerText && <h1>{ headerText }</h1> }
						{ subHeaderText && <p>{ subHeaderText }</p> }
						{ tabbedNavigation && (
							<>
								<TabbedNavigation items={ tabbedNavigation } />
							</>
						) }
					</div>
					{ routes && <WizardPagination routes={ routes } /> }
				</div>

				<div className={ classnames( 'newspack-wizard newspack-wizard__content', className ) }>
					{ content }
					{ ( shouldRenderPrimaryButton || shouldRenderSecondaryButton ) && (
						<div className="newspack-buttons-card">
							{ shouldRenderPrimaryButton &&
								( retrievedButtonProps.plugin ? (
									<Handoff isPrimary { ...retrievedButtonProps }>
										{ buttonText }
									</Handoff>
								) : (
									<Button
										isPrimary={ ! buttonDisabled }
										isSecondary={ !! buttonDisabled }
										disabled={ buttonDisabled }
										{ ...retrievedButtonProps }
									>
										{ buttonText }
									</Button>
								) ) }
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
