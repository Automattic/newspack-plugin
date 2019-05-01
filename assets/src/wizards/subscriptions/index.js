import CheckboxInput from '../../components/checkboxInput';

/**
 * Subscriptions wizard stub for example purposes.
 */
class SubscriptionsWizard extends React.Component {

	/**
	 * Render the example stub.
	 */
	render() {
		return(
			<CheckboxInput 
		        label="Checkbox is tested?"
		        onChange={ function(){ console.log( 'Yep, it\'s tested' ); } }
			/>
		);
	}
}

ReactDOM.render(
  <SubscriptionsWizard />,
  document.getElementById( 'newspack-subscriptions-wizard' )
);
