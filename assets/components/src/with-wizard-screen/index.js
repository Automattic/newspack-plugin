/**
 * Higher-Order Component to provide plugin management and error handling to Newspack Wizards.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';

/**
 * Internal dependencies.
 */
import { Button, Card, FormattedHeader, Handoff, Grid, TabbedNavigation } from '../';
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
			} = this.props;
			const classes = murielClassnames(
				'muriel-wizardScreen',
				className,
				noBackground ? 'muriel-wizardScreen__no-background' : ''
			);
			const content = (
				<div className="muriel-wizardScreen__content">
					<WrappedComponent { ...this.props } />
				</div>
			);
			const retrievedButtonProps = buttonProps( buttonAction );
			return (
				<Fragment>
					<Grid>
						<Card noBackground>
							{ headerText && (
								<FormattedHeader headerText={ headerText } subHeaderText={ subHeaderText } />
							) }
						</Card>
						{ tabbedNavigation && (
							<Card noBackground>
								<TabbedNavigation items={ tabbedNavigation } />
							</Card>
						) }
					</Grid>
					{ !! noCard && content }
					{ ! noCard && (
						<Grid>
							<Card className={ classes } noBackground={ noBackground }>
								{ content }
							</Card>
						</Grid>
					) }
					{ buttonText && buttonAction && !! retrievedButtonProps.plugin && (
						<Handoff
							isPrimary
							className="is-centered muriel-wizardScreen__completeButton"
							{ ...retrievedButtonProps }
						>
							{ buttonText }
						</Handoff>
					) }
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
				</Fragment>
			);
		}
	};
}
