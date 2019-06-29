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
import { Button, Card, FormattedHeader, Handoff } from '../';
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
			return (
				<Fragment>
					<Card noBackground>
						{ headerText && (
							<FormattedHeader headerText={ headerText } subHeaderText={ subHeaderText } />
						) }
					</Card>
					{ !! noCard && content }
					{ ! noCard && (
						<Card className={ classes } noBackground={ noBackground }>
							{ content }
						</Card>
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
