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
import { Button, Card, FormattedHeader } from '../';
import { murielClassnames, buttonProps } from '../../../shared/js/';
import './style.scss';

export default function withWizardScreen( WrappedComponent, config ) {
	return class extends Component {
		render() {
			const {
				className,
				buttonText,
				buttonAction,
				headerText,
				subHeaderText,
				noBackground,
				wideLayout,
			} = this.props;
			const classes = murielClassnames(
				'muriel-wizardScreen',
				className,
				noBackground ? 'muriel-wizardScreen__no-background' : ''
			);
			return (
				<Fragment>
					<Card className={ classes } noBackground={ noBackground } wideLayout={ wideLayout }>
						{ headerText && (
							<FormattedHeader headerText={ headerText } subHeaderText={ subHeaderText } />
						) }
						<div className="muriel-wizardScreen__content">
							<WrappedComponent { ...this.props } />
						</div>
					</Card>
					{ buttonText && buttonAction && (
						<Button
							isPrimary
							className="is-centered muriel-wizardScreen__completeButton"
							{ ...buttonProps( buttonAction ) }
						>
							{ buttonText }
						</Button>
					) }
				</Fragment>
			);
		}
	};
}
