/* global newspack_analytics_wizard_data */

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Button,
	Notice,
	TextControl,
	SelectControl,
	CheckboxControl,
	withWizardScreen,
} from '../../../../components/src';
import './style.scss';

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

	handleCategoryDimensionSetting = dimensionId => {
		const { wizardApiFetch } = this.props;
		const { customDimensions } = this.state;
		wizardApiFetch( {
			path: `/newspack/v1/wizard/analytics/category-dimension/${ dimensionId }`,
			method: 'POST',
		} )
			.then( ( { id } ) => {
				this.setState( {
					customDimensions: customDimensions.map( dimension => ( {
						...dimension,
						is_category_dimension: dimension.id === id,
					} ) ),
				} );
			} )
			.catch( this.handleAPIError );
	};

	render() {
		const { error, customDimensions, newDimensionName, newDimensionScope } = this.state;
		const hasCustomDimensions = ! error && customDimensions.length !== 0;
		return (
			<div className="newspack__analytics-configuration newspack-card newspack-card__no-background">
				<p>
					{ __(
						"Custom dimensions are used to collect and analyze data that Google Analytics doesn't automatically track.",
						'newspack'
					) }
				</p>
				{ hasCustomDimensions &&
					customDimensions.filter( dimension => dimension.is_category_dimension ).length === 0 && (
						<Notice
							noticeText={ __(
								'Please set a category dimension. Otherwise, the categories will not be reported to GA.',
								'newspack'
							) }
							isWarning
						/>
					) }
				{ error ? (
					<Notice noticeText={ error } isError />
				) : (
					<Fragment>
						<table>
							<thead>
								<tr>
									{ [
										__( 'Name', 'newspack' ),
										__( 'ID', 'newspack' ),
										__( 'Category dimension', 'newspack' ),
									].map( ( colName, i ) => (
										<th key={ i }>{ colName }</th>
									) ) }
								</tr>
							</thead>
							<tbody>
								{ customDimensions.map( dimension => (
									<tr key={ dimension.id }>
										<td>
											<strong>{ dimension.name }</strong>
										</td>
										<td>
											<code>{ dimension.id }</code>
										</td>
										<td>
											<CheckboxControl
												onChange={ () => this.handleCategoryDimensionSetting( dimension.id ) }
												checked={ dimension.is_category_dimension }
											/>
										</td>
									</tr>
								) ) }
							</tbody>
						</table>

						<p className="is-dark">
							<strong>{ __( 'Create a new custom dimension:', 'newspack' ) }</strong>
						</p>
						<div>
							<div className="newspack__analytics-configuration__form">
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
								<Button
									onClick={ this.handleCustomDimensionCreation }
									disabled={ newDimensionName.length === 0 }
									isPrimary
								>
									{ __( 'Create', 'newspack' ) }
								</Button>
							</div>
						</div>
					</Fragment>
				) }
			</div>
		);
	}
}

export default withWizardScreen( CustomDimensions );
