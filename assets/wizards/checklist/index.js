/**
 * Checklist.
 */

/**
 * WordPress dependencies
 */
import { Component, Fragment, render } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button, FormattedHeader, Checklist, Task } from '../../components/src';

/**
 * Renders any checklist.
 */
class ChecklistScreen extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );
		this.state = {
			checklistProgress: 0,
		};
	}

	/**
	 * Mark a checklist item as skipped.
	 * @todo Make this permanent using an API call.
	 */
	dismissCheckListItem = index => {
		const { checklistProgress } = this.state;
		this.setState( { checklistProgress: Math.max( checklistProgress, index + 1 ) } );
	};

	/**
	 * Render.
	 */
	render() {
		const { name, description, steps, dashboardURL } = this.props;
		const { checklistProgress } = this.state;

		return (
			<Fragment>
				<FormattedHeader headerText={ name } subHeaderText={ description } />
				<Checklist progressBarText={ __( 'Your setup list' ) }>
					{ steps.map( ( step, index ) => (
						<Task
							key={ index }
							title={ step.name }
							description={ step.description }
							buttonText={ __( 'Do it' ) }
							completedTitle={ __( 'All set!' ) }
							completed={ step.completed || checklistProgress > index }
							onDismiss={ () => this.dismissCheckListItem( index ) }
							active={ checklistProgress === index }
							onClick={ () => ( window.location = step.url ) }
						/>
					) ) }
				</Checklist>
				<Button
					className="is-centered"
					isTertiary
					onClick={ () => ( window.location = dashboardURL ) }
				>
					{ __( "I'm done setting up" ) }
				</Button>
			</Fragment>
		);
	}
}
render(
	<ChecklistScreen { ...newspack_checklist } />,
	document.getElementById( 'newspack-checklist' )
);
