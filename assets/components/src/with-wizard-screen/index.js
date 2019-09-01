/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies.
 */
import { Button, Card, FormattedHeader, Handoff, Grid, SecondaryNavigation, TabbedNavigation } from '../';
import { murielClassnames, buttonProps } from '../../../shared/js/';
import './style.scss';

export default function withWizardScreen( WrappedComponent, config ) {
	return class extends Component {
		render() {
			const {
				className,
				buttonText,
				buttonAction,
				buttonDisabled,
				headerText,
				subHeaderText,
				noBackground,
				noCard,
				tabbedNavigation,
				secondaryNavigation,
				footer,
				notice,
				secondaryButtonText,
				secondaryButtonAction,
				secondaryButtonStyle,
				hidden,
			} = this.props;
			const classes = murielClassnames(
				'muriel-wizardScreen',
				className,
				noBackground ? 'muriel-wizardScreen__no-background' : '',
				hidden ? 'muriel-wizardScreen__hidden' : '',
			);
			const content = (
				<div className="muriel-wizardScreen__content">
					<WrappedComponent { ...this.props } />
				</div>
			);
			const retrievedButtonProps = buttonProps( buttonAction );
			return (
				<Fragment>
					{ ! hidden && (
						<Grid>
							<Card noBackground>
								{ headerText && (
									<FormattedHeader headerText={ headerText } subHeaderText={ subHeaderText } />
								) }
							</Card>
							{ tabbedNavigation && (
								<Card noBackground>
									<TabbedNavigation items={ tabbedNavigation } />
									{ secondaryNavigation && <SecondaryNavigation items={ secondaryNavigation } /> }
								</Card>
							) }
						</Grid>
					) }
					{ !! noCard && content }
					{ ! noCard && (
						<Grid>
							<Card className={ classes } noBackground={ noBackground }>
								{ content }
							</Card>
						</Grid>
					) }
					{ ! hidden && (
						<Grid>
							<Card className="is-centered" noBackground>
								{ buttonText && buttonAction && !! retrievedButtonProps.plugin && (
									<Handoff
										isPrimary
										className="is-centered muriel-wizardScreen__completeButton"
										{ ...retrievedButtonProps }
									>
										{ buttonText }
									</Handoff>
								) }
								{ notice }
								{ buttonText && buttonAction && ! retrievedButtonProps.plugin && (
									<Button
										isPrimary={ ! buttonDisabled }
										isDefault={ !! buttonDisabled }
										className="is-centered muriel-wizardScreen__completeButton"
										disabled={ buttonDisabled }
										{ ...retrievedButtonProps }
									>
										{ buttonText }
									</Button>
								) }
								{ footer }
								{ secondaryButtonText && (
									<Button
										{ ...secondaryButtonStyle }
										className="is-centered"
										{ ...buttonProps( secondaryButtonAction ) }
									>
										{ secondaryButtonText }
									</Button>
								) }
							</Card>
						</Grid>
					) }
				</Fragment>
			);
		}
	};
}
