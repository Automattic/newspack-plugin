const { Route, Switch, useHistory, useLocation, useParams, useRouteMatch } =
	Router;

import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useState, useEffect, Fragment } from '@wordpress/element';

import Brand from './brand';
import BrandsList from './list';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import { Router } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

export default function AdditionalBrands() {
	const { wizardApiFetch, setError, isFetching } = useWizardApiFetch(
		'newspack-settings/additional-brands'
	);

	const [ brands, setBrands ] = useState< Brand[] >( [] );
	const history = useHistory();

	const location = useLocation();
	const params = useParams();
	const { path, url } = useRouteMatch();

	const headerText = __( 'Brands', 'newspack' );
	const subHeaderText = __( 'Configure brands settings', 'newspack' );
	const wizardScreenProps = {
		isFetching,
		headerText,
		subHeaderText,
	};

	/**
	 * Fetching brands data.
	 */
	const fetchBrands = () => {
		wizardApiFetch(
			{
				path: addQueryArgs( '/wp/v2/brand', { per_page: 100 } ),
			},
			{
				onSuccess( response ) {
					setBrands(
						response.map(
							( brand: {
								meta: {
									_theme_colors: string | any[];
									_menus: string | any[];
								};
							} ) => ( {
								...brand,
								meta: {
									...brand.meta,
									_theme_colors:
										0 === brand.meta._theme_colors?.length
											? null
											: brand.meta._theme_colors,
									_menus:
										0 === brand.meta._menus?.length
											? null
											: brand.meta._menus,
								},
							} )
						)
					);
				},
			}
		);
	};

	const saveBrand = ( brandId: number, brand: Brand ) => {
		wizardApiFetch(
			{
				path: brandId ? `/wp/v2/brand/${ brandId }` : '/wp/v2/brand',
				method: 'POST',
				data: {
					...brand,
					meta: {
						...brand.meta,
						...( brand.meta._logo && {
							_logo:
								brand.meta._logo instanceof Object
									? brand.meta._logo.id
									: brand.meta._logo,
						} ),
					},
				},
			},
			{
				onSuccess( result ) {
					setBrands( ( brandsList: Brand[] ) => {
						// The result from the API call doesn't contain the logo details.
						const newBrand: Brand = { ...brand, id: result.id };
						if ( brandId ) {
							const brandIndex = brandsList.findIndex(
								_brand => brandId === _brand.id
							);
							if ( brandIndex > -1 ) {
								return brandsList.map( _brand =>
									brandId === _brand.id ? newBrand : _brand
								);
							}
						}

						return [ newBrand, ...brandsList ];
					} );
					history.push( '/additional-brands' );
				},
			}
		);
	};

	const deleteBrand = ( brand: Brand ) => {
		// eslint-disable-next-line no-alert
		if (
			confirm(
				__( 'Are you sure you want to delete this brand?', 'newspack' )
			)
		) {
			wizardApiFetch(
				{
					path: addQueryArgs( `/wp/v2/brand/${ brand.id }`, {
						force: true,
					} ),
					method: 'DELETE',
				},
				{
					onSuccess( result ) {
						if ( result.deleted ) {
							setBrands( oldBrands =>
								oldBrands.filter(
									oldBrand => brand.id !== oldBrand.id
								)
							);
						}
					},
				}
			);
		}
	};

	const fetchLogoAttachment = ( brandId: number, attachmentId: number ) => {
		if ( ! attachmentId ) {
			return;
		}
		console.log( { brandId, attachmentId } );
		wizardApiFetch(
			{
				path: `/wp/v2/media/${ attachmentId }`,
			},
			{
				onStart: () => {
					console.log( 'onStart' );
				},
				onSuccess( attachment ) {
					console.log( { attachment } );
					setBrands( brandsList => {
						const brandIndex = brandsList.findIndex(
							_brand => brandId === _brand.id
						);
						return brandIndex > -1
							? brandsList.map( _brand =>
									brandId === _brand.id
										? {
												..._brand,
												meta: {
													..._brand.meta,
													_logo: {
														...attachment,
														url: attachment.source_url,
													},
												},
										  }
										: _brand
							  )
							: brandsList;
					} );
				},
			}
		);
	};

	useEffect( fetchBrands, [] );

	return (
		<WizardsTab title={ __( 'Additional Brands', 'newspack-plugin' ) }>
			<WizardSection>
				<Switch>
					<Route
						exact
						path={ path }
						render={ () => (
							<BrandsList
								{ ...wizardScreenProps }
								brands={ brands }
								deleteBrand={ deleteBrand }
							/>
						) }
					/>
					<Route
						path={ `${ path }/new` }
						render={ () => (
							<Brand
								{ ...wizardScreenProps }
								brands={ brands }
								saveBrand={ saveBrand }
								fetchLogoAttachment={ fetchLogoAttachment }
								wizardApiFetch={ wizardApiFetch }
							/>
						) }
					/>
					<Route
						path={ `${ path }/:brandId` }
						render={ ( {
							match,
						}: {
							match: { params: { brandId: string } };
						} ) => (
							<Brand
								{ ...wizardScreenProps }
								brands={ brands }
								editBrand={ Number( match.params.brandId ) }
								saveBrand={ saveBrand }
								fetchLogoAttachment={ fetchLogoAttachment }
								wizardApiFetch={ wizardApiFetch }
							/>
						) }
					/>
				</Switch>
			</WizardSection>
		</WizardsTab>
	);
}
