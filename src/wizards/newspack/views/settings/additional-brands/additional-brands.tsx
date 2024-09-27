// @ts-nocheck
import { Router } from '../../../../../components/src';

const { Route, Switch, useHistory, useLocation, useParams, useRouteMatch } =
	Router;

console.log( Router );

import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useState, useEffect, Fragment } from '@wordpress/element';

import Brand from './additional-brands-brand';
import BrandsList from './additional-brands-list';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

export default function AdditionalBrands() {
	const { wizardApiFetch, setError } = useWizardApiFetch(
		'newspack-settings/additional-brands'
	);
	const [ brands, setBrands ] = useState< Brand[] >( [] );
	const history = useHistory();

	const location = useLocation();
	const params = useParams();
	const { path, url } = useRouteMatch();

	console.log( location, params, path, url );

	const headerText = __( 'Brands', 'newspack' );
	const subHeaderText = __( 'Configure brands settings', 'newspack' );
	const wizardScreenProps = {
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
		wizardApiFetch( {
			path: brandId ? `/wp/v2/brand/${ brandId }` : '/wp/v2/brand',
			method: 'POST',
			data: {
				...brand,
				meta: {
					...brand.meta,
					...( brand.meta._logo && { _logo: brand.meta._logo.id } ),
				},
			},
		} )
			.then( result =>
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
				} )
			)
			.then( history.push( '/' ) )
			.catch( setError );
	};

	const deleteBrand = ( brand: Brand ) => {
		// eslint-disable-next-line no-alert
		if (
			confirm(
				__( 'Are you sure you want to delete this brand?', 'newspack' )
			)
		) {
			return wizardApiFetch( {
				path: addQueryArgs( `/wp/v2/brand/${ brand.id }`, {
					force: true,
				} ),
				method: 'DELETE',
			} )
				.then( result => {
					if ( result.deleted ) {
						setBrands( oldBrands =>
							oldBrands.filter(
								oldBrand => brand.id !== oldBrand.id
							)
						);
					}
				} )
				.catch( e => {
					setError( e );
				} );
		}
	};

	const fetchLogoAttachment = ( brandId: number, attachmentId: number ) => {
		if ( ! attachmentId ) {
			return;
		}
		wizardApiFetch( {
			path: `/wp/v2/media/${ attachmentId }`,
			method: 'GET',
		} )
			.then( attachment =>
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
				} )
			)
			.catch( setError );
	};

	useEffect( fetchBrands, [] );

	return (
		<Fragment>
			<pre>
				{ JSON.stringify(
					{ path, url, location, params, brands },
					null,
					2
				) }
			</pre>
			<Switch>
				<Route
					exact
					path={ path }
					render={ () => (
						<BrandsList
							{ ...wizardScreenProps }
							brands={ brands }
							setError={ setError }
							deleteBrand={ deleteBrand }
						/>
					) }
				/>
				<Route
					path={ `${ path }/new` }
					render={ () => (
						<Brand
							{ ...wizardScreenProps }
							saveBrand={ saveBrand }
							setError={ setError }
							wizardApiFetch={ wizardApiFetch }
						/>
					) }
				/>
				<Route
					path="/brands/:brandId"
					element={
						<Brand
							{ ...wizardScreenProps }
							brands={ brands }
							saveBrand={ saveBrand }
							fetchLogoAttachment={ fetchLogoAttachment }
							setError={ setError }
							wizardApiFetch={ wizardApiFetch }
						/>
					}
				/>
			</Switch>
		</Fragment>
	);
}
