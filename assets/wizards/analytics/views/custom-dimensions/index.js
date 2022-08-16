/* global newspack_analytics_wizard_data */

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Button,
	Grid,
	Notice,
	SectionHeader,
	SelectControl,
	TextControl,
	withWizardScreen,
} from '../../../../components/src';

const SCOPES_OPTIONS = [
	{ value: 'HIT', label: __( 'Hit', 'newspack' ) },
	{ value: 'SESSION', label: __( 'Session', 'newspack' ) },
	{ value: 'USER', label: __( 'User', 'newspack' ) },
	{ value: 'PRODUCT', label: __( 'Product', 'newspack' ) },
];

/**
 * Analytics Custom Dimensions screen.
 */
class CustomDimensions extends Component {
	state = {
		error: newspack_analytics_wizard_data.analyticsConnectionError,
		customDimensions: newspack_analytics_wizard_data.customDimensions,
		newDimensionName: '',
		newDimensionScope: SCOPES_OPTIONS[ 0 ].value,
	};

	handleAPIError = ( { message: error } ) => {
		this.setState( { error } );
	};

	handleCustomDimensionCreation = () => {
		const { wizardApiFetch } = this.props;
		const { customDimensions, newDimensionName, newDimensionScope } = this.state;
		wizardApiFetch( {
			path: '/newspack/v1/wizard/analytics/custom-dimensions',
			method: 'POST',
			data: { name: newDimensionName, scope: newDimensionScope },
		} )
			.then( newCustomDimension => {
				this.setState( { customDimensions: [ ...customDimensions, newCustomDimension ] } );
			} )
			.catch( this.handleAPIError );
	};

	handleCustomDimensionSetting = dimensionId => role => {
		const { wizardApiFetch } = this.props;
		wizardApiFetch( {
			path: `/newspack/v1/wizard/analytics/custom-dimensions/${ dimensionId }`,
			method: 'POST',
			data: { role },
		} )
			.then( res => {
				this.setState( { customDimensions: res } );
			} )
			.catch( this.handleAPIError );
	};

	render() {
		const { error, customDimensions, newDimensionName, newDimensionScope } = this.state;
		return (
			<div className="newspack__analytics-configuration">
				<SectionHeader
					title={ __( 'User-defined custom dimensions', 'newspack' ) }
					description={ __(
						"Collect and analyze data that Google Analytics doesn't automatically track",
						'newspack'
					) }
				/>
				{ error ? (
					<Notice noticeText={ error } isError rawHTML />
				) : (
					<>
						<table>
							<thead>
								<tr>
									{ [
										__( 'Name', 'newspack' ),
										__( 'ID', 'newspack' ),
										__( 'Role', 'newspack' ),
									].map( ( colName, i ) => (
										<th key={ i }>{ colName }</th>
									) ) }
								</tr>
							</thead>
							<tbody>
								{ customDimensions.map( dimension => (
									<tr key={ dimension.id }>
										<td>{ dimension.name }</td>
										<td>
											<code>{ dimension.id }</code>
										</td>
										<td>
											<SelectControl
												options={ newspack_analytics_wizard_data.customDimensionsOptions }
												value={ dimension.role || '' }
												onChange={ this.handleCustomDimensionSetting( dimension.id ) }
												className="newspack__analytics-configuration__select"
											/>
										</td>
									</tr>
								) ) }
							</tbody>
						</table>
						<SectionHeader title={ __( 'Create new custom dimension', 'newspack' ) } />
						<Grid columns={ 1 } gutter={ 16 }>
							<Grid rowGap={ 16 }>
								<TextControl
									value={ newDimensionName }
									onChange={ val => this.setState( { newDimensionName: val } ) }
									label={ __( 'Name', 'newspack' ) }
								/>
								<SelectControl
									value={ newDimensionScope }
									onChange={ val => this.setState( { newDimensionScope: val } ) }
									label={ __( 'Scope', 'newspack' ) }
									options={ SCOPES_OPTIONS }
								/>
							</Grid>
							<div className="flex justify-end">
								<Button
									onClick={ this.handleCustomDimensionCreation }
									disabled={ newDimensionName.length === 0 }
									variant="primary"
								>
									{ __( 'Save', 'newspack' ) }
								</Button>
							</div>
						</Grid>
					</>
				) }
			</div>
		);
	}
}

export default withWizardScreen( CustomDimensions );
