/**
 * Internal dependencies
 */
import {
	Button,
	Card,
	FormattedHeader,
	Handoff,
	Grid,
	SecondaryNavigation,
	TabbedNavigation,
} from '../';
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
			headerIcon,
			headerText,
			subHeaderText,
			noBackground,
			isWide,
			tabbedNavigation,
			secondaryNavigation,
			secondaryButtonText,
			secondaryButtonAction,
			hidden,
		} = props;
		if ( hidden ) {
			return null;
		}
		const content = <WrappedComponent { ...props } />;
		const retrievedButtonProps = buttonProps( buttonAction );
		const retrievedSecondaryButtonProps = buttonProps( secondaryButtonAction );
		const SecondaryCTAComponent = retrievedSecondaryButtonProps.plugin ? Handoff : Button;
		return (
			<>
				<Grid>
					<Card noBackground>
						{ headerText && (
							<FormattedHeader
								headerIcon={ headerIcon }
								headerText={ headerText }
								subHeaderText={ subHeaderText }
							/>
						) }
					</Card>
					{ tabbedNavigation && (
						<Card noBackground>
							<TabbedNavigation items={ tabbedNavigation } />
							{ secondaryNavigation && <SecondaryNavigation items={ secondaryNavigation } /> }
						</Card>
					) }
				</Grid>

				<Grid isWide={ isWide }>
					<Card
						className={ classnames( 'newspack-wizard', className ) }
						noBackground={ noBackground }
					>
						{ content }
						<div className="newspack-buttons-card">
							{ buttonText &&
								buttonAction &&
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
							{ secondaryButtonText && secondaryButtonAction && (
								<SecondaryCTAComponent isSecondary { ...retrievedSecondaryButtonProps }>
									{ secondaryButtonText }
								</SecondaryCTAComponent>
							) }
						</div>
					</Card>
				</Grid>
			</>
		);
	};
	return WrappedWithWizardScreen;
}
