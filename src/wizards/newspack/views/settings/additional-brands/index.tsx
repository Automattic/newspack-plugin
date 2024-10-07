const { Route, Switch, useHistory, useRouteMatch } = Router;

import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { useState, useEffect } from '@wordpress/element';

import Brand from './brand';
import BrandsList from './list';
import WizardsTab from '../../../../wizards-tab';
import WizardSection from '../../../../wizards-section';
import { Router, utils } from '../../../../../components/src';
import { useWizardApiFetch } from '../../../../hooks/use-wizard-api-fetch';

export default function AdditionalBrands() {
	const { wizardApiFetch, isFetching } = useWizardApiFetch(
		'newspack-settings/additional-brands'
	);

	const [ brands, setBrands ] = useState< Brand[] >( [] );
	const history = useHistory();
	const { path } = useRouteMatch();

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
		wizardApiFetch< Brand[] >(
			{
				path: addQueryArgs( '/wp/v2/brand', { per_page: 100 } ),
			},
			{
				onSuccess( response ) {
					setBrands(
						response.map( ( brand: Brand ) => ( {
							...brand,
							meta: {
								...brand.meta,
								_theme_colors: brand.meta._theme_colors?.length
									? brand.meta._theme_colors
									: [],
								_menus: brand.meta._menus?.length
									? brand.meta._menus
									: [],
							},
						} ) )
					);
				},
			}
		);
	};

	const saveBrand = ( brandId: number, brand: Brand ) => {
		wizardApiFetch< Brand >(
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
						const newBrand = { ...brand, id: result.id };
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
		if (
			utils.confirmAction(
				__( 'Are you sure you want to delete this brand?', 'newspack' )
			)
		) {
			wizardApiFetch< { deleted: boolean; previous: Brand } >(
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
		wizardApiFetch(
			{
				path: `/wp/v2/media/${ attachmentId }`,
			},
			{
				onSuccess( attachment ) {
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
				<pre>{ JSON.stringify( { isFetching }, null, 2 ) }</pre>
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
